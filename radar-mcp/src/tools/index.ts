/**
 * As 13 tools do namespace `radar`.
 *
 * Convenções:
 * - toda tool devolve JSON estruturado (structuredContent + text);
 * - toda tool que grava exige contexto de usuário (JWT) e respeita RLS;
 * - nenhuma tool envia e-mail, WhatsApp ou interage com LinkedIn.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RadarRepository } from '../db/repositories.js';
import { crosscheckClassification, effectiveConfidence } from '../domain/classification.js';
import { scoreOpportunity } from '../domain/scoring.js';
import { buildRufasPayload } from '../domain/payload.js';
import { getCapabilities } from '../capabilities.js';
import {
  CONSTRUCTION_STAGES,
  CONSTRUCTION_TYPES,
  OPPORTUNITY_STATUSES,
  VERIFICATION_STATUSES,
  type ContentStatus,
} from '../types.js';
import { normalizeUrl } from '../domain/normalize.js';

export interface ToolContext {
  getRepository(): Promise<RadarRepository>;
  supabaseConfigured: boolean;
}

/** Envelope padrão de resposta. */
function ok(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data as Record<string, unknown>,
  };
}

function fail(error: string, detail: string, hint?: string) {
  const data = { success: false, error, detail, ...(hint ? { hint } : {}) };
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data as Record<string, unknown>,
    isError: true as const,
  };
}

async function guarded<T>(fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const name = err instanceof Error ? err.name : 'Error';
    return fail(name, message);
  }
}

export function registerRadarTools(server: McpServer, ctx: ToolContext): void {
  // ======================================================= get_capabilities
  server.registerTool(
    'radar_get_capabilities',
    {
      title: 'Radar: capacidades reais',
      description:
        'Retorna o que o Radar consegue fazer AGORA. Valores refletem runtime real, ' +
        'não intenção futura. Consulte antes de assumir qualquer integração.',
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => ok({ success: true, capabilities: getCapabilities({ supabaseConfigured: ctx.supabaseConfigured }) }),
  );

  // ========================================================= register_signal
  server.registerTool(
    'radar_register_signal',
    {
      title: 'Radar: registrar sinal',
      description:
        'Persiste um sinal bruto ANTES de qualquer processamento. Exige source_url ou raw_text. ' +
        'Não falha o pipeline se a URL não puder ser lida — devolve content_status para o agente decidir.',
      inputSchema: {
        source_url: z.string().optional().describe('URL do post/notícia. Opcional se raw_text for enviado.'),
        raw_text: z.string().optional().describe('Texto da publicação, colado manualmente.'),
        source: z.string().default('manual').describe('Origem: manual, rufas, instagram_url, news...'),
        source_external_id: z.string().optional().describe('ID externo, quando existir.'),
        published_at: z.string().optional().describe('ISO 8601 da publicação original.'),
        institution_id: z.string().uuid().optional().describe('Instituição, se já conhecida.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    async (args) =>
      guarded(async () => {
        if (!args.source_url && !args.raw_text) {
          return fail(
            'INVALID_INPUT',
            'É obrigatório enviar source_url ou raw_text.',
            'Cole o texto da publicação em raw_text quando a URL não puder ser lida.',
          );
        }

        const repo = await ctx.getRepository();

        const existing = await repo.findSignal({
          source: args.source,
          source_url: args.source_url,
          source_external_id: args.source_external_id,
        });
        if (existing.record) {
          return ok({
            success: true,
            signal_id: existing.record.id,
            duplicate: true,
            matched_by: existing.matchedBy?.field,
            content_status: existing.record.raw_text ? 'content_available' : 'url_only',
            next_action: 'signal_already_registered_use_classify_construction',
          });
        }

        const signal = await repo.createSignal({
          institution_id: args.institution_id ?? null,
          source: args.source,
          source_url: args.source_url ?? null,
          source_external_id: args.source_external_id ?? null,
          raw_text: args.raw_text ?? null,
          published_at: args.published_at ?? null,
        });

        let contentStatus: ContentStatus;
        let nextAction: string;
        if (args.raw_text && args.source_url) {
          contentStatus = 'content_available';
          nextAction = 'call_radar_resolve_institution_then_classify_construction';
        } else if (args.raw_text) {
          contentStatus = 'manual_text';
          nextAction = 'call_radar_resolve_institution_then_classify_construction';
        } else {
          contentStatus = 'url_only';
          nextAction =
            'fetch_content_with_your_own_tools_then_call_radar_classify_construction_with_raw_text';
        }

        return ok({
          success: true,
          signal_id: signal.id,
          duplicate: false,
          content_status: contentStatus,
          next_action: nextAction,
        });
      }),
  );

  // ===================================================== resolve_institution
  server.registerTool(
    'radar_resolve_institution',
    {
      title: 'Radar: resolver instituição',
      description:
        'Encontra ou cria a instituição, aplicando dedupe. Chave forte (domínio, instagram) reusa ' +
        'automaticamente. Chave fraca (nome+cidade+UF) devolve candidato e EXIGE confirmação — ' +
        'não faz merge automático de baixa confiança.',
      inputSchema: {
        name: z.string().describe('Nome do colégio como aparece na fonte.'),
        website: z.string().optional(),
        instagram_url: z.string().optional(),
        linkedin_url: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional().describe('UF ou nome do estado.'),
        phone: z.string().optional(),
        legal_name: z.string().optional(),
        signal_id: z.string().uuid().optional().describe('Vincula o sinal à instituição resolvida.'),
        confirm_weak_match: z
          .boolean()
          .default(false)
          .describe('Confirma explicitamente o uso de um candidato de baixa confiança.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    async (args) =>
      guarded(async () => {
        const repo = await ctx.getRepository();
        const match = await repo.findInstitution({
          name: args.name,
          website: args.website,
          instagram_url: args.instagram_url,
          city: args.city,
          state: args.state,
        });

        if (match.record && match.requiresConfirmation && !args.confirm_weak_match) {
          return ok({
            success: true,
            resolved: false,
            requires_confirmation: true,
            matched_by: match.matchedBy?.field,
            match_strength: match.matchedBy?.strength,
            candidate: {
              id: match.record.id,
              name: match.record.name,
              city: match.record.city,
              state: match.record.state,
              website: match.record.website,
            },
            next_action:
              'confirme com confirm_weak_match=true se for a mesma instituição, ou informe website/instagram para dedupe forte',
          });
        }

        let institution = match.record;
        let created = false;
        if (!institution) {
          institution = await repo.createInstitution({
            name: args.name,
            legal_name: args.legal_name ?? null,
            website: args.website ?? null,
            instagram_url: args.instagram_url ?? null,
            linkedin_url: args.linkedin_url ?? null,
            city: args.city ?? null,
            state: args.state ?? null,
            phone: args.phone ?? null,
          });
          created = true;
        }

        if (args.signal_id) {
          await repo.linkSignalToInstitution(args.signal_id, institution.id);
        }

        return ok({
          success: true,
          resolved: true,
          created,
          matched_by: match.matchedBy?.field ?? null,
          institution: {
            id: institution.id,
            name: institution.name,
            domain: institution.domain,
            instagram_url: institution.instagram_url,
            city: institution.city,
            state: institution.state,
          },
          next_action: 'call_radar_classify_construction',
        });
      }),
  );

  // ==================================================== research_institution
  server.registerTool(
    'radar_research_institution',
    {
      title: 'Radar: plano de pesquisa pública',
      description:
        'O SERVIDOR NÃO faz busca web. Esta tool devolve um plano de consultas para VOCÊ executar ' +
        'com suas próprias ferramentas e depois gravar os achados via radar_find_contacts ou ' +
        'atualização da instituição. Nunca afirme que um dado veio de Instagram ou LinkedIn sem ter acessado.',
      inputSchema: {
        institution_id: z.string().uuid(),
        focus: z
          .array(z.enum(['website', 'location', 'phone', 'public_email', 'news', 'construction']))
          .default(['website', 'location', 'phone', 'public_email', 'news', 'construction']),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) =>
      guarded(async () => {
        const repo = await ctx.getRepository();
        const inst = await repo.getInstitution(args.institution_id);
        if (!inst) return fail('NOT_FOUND', `Instituição ${args.institution_id} não encontrada.`);

        const base = [inst.name, inst.city, inst.state].filter(Boolean).join(' ');
        const plan: { focus: string; query: string; accept_sources: string[] }[] = [];
        const add = (focus: string, query: string, accept: string[]) =>
          plan.push({ focus, query, accept_sources: accept });

        if (args.focus.includes('website')) add('website', `${base} site oficial`, ['site institucional']);
        if (args.focus.includes('location')) add('location', `${base} endereço`, ['site institucional', 'diretórios públicos']);
        if (args.focus.includes('phone')) add('phone', `${base} telefone contato`, ['site institucional']);
        if (args.focus.includes('public_email')) add('public_email', `${base} email contato secretaria`, ['site institucional']);
        if (args.focus.includes('news')) add('news', `"${inst.name}" notícia`, ['portais de notícia']);
        if (args.focus.includes('construction')) {
          add('construction', `"${inst.name}" obra OR ampliação OR "novo bloco"`, ['portais de notícia', 'site institucional']);
        }

        return ok({
          success: true,
          institution: { id: inst.id, name: inst.name, city: inst.city, state: inst.state, website: inst.website },
          research_plan: plan,
          rules: [
            'Somente fontes públicas legítimas.',
            'Todo achado precisa de source_url.',
            'Nunca fabricar e-mail nem inferir padrão de e-mail como confirmado.',
            'Instagram e LinkedIn NÃO estão disponíveis: não atribua dados a essas fontes.',
          ],
          capabilities: getCapabilities({ supabaseConfigured: ctx.supabaseConfigured }),
          next_action: 'execute_plan_with_your_tools_then_call_radar_find_contacts',
        });
      }),
  );

  // =================================================== classify_construction
  server.registerTool(
    'radar_classify_construction',
    {
      title: 'Radar: classificar obra',
      description:
        'Persiste SUA análise semântica do sinal e roda uma contraprova léxica determinística. ' +
        'A decisão é sua; a tool confere contra o texto e registra divergências, reduzindo a ' +
        'confiança quando o texto não sustenta a afirmação. Envie reasoning_summary curto — ' +
        'NUNCA raciocínio interno completo.',
      inputSchema: {
        signal_id: z.string().uuid(),
        is_educational_institution: z.boolean().describe('O sinal é de instituição de ensino?'),
        construction_detected: z.boolean().describe('Há evidência de obra física?'),
        construction_type: z.enum(CONSTRUCTION_TYPES).default('unknown'),
        construction_stage: z.enum(CONSTRUCTION_STAGES).default('S0_VAGUE_SIGNAL'),
        confidence: z.number().min(0).max(1).describe('Sua confiança na análise (0–1).'),
        description: z.string().optional().describe('Descrição objetiva do que foi encontrado.'),
        reasoning_summary: z.string().optional().describe('Resumo curto e auditável. Não é chain-of-thought.'),
        raw_text_override: z.string().optional().describe('Texto lido por você, quando o sinal foi salvo só com URL.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    },
    async (args) =>
      guarded(async () => {
        const repo = await ctx.getRepository();
        const signal = await repo.getSignal(args.signal_id);
        if (!signal) return fail('NOT_FOUND', `Sinal ${args.signal_id} não encontrado.`);

        const text = args.raw_text_override ?? signal.raw_text;
        const crosscheck = crosscheckClassification(text, {
          is_educational_institution: args.is_educational_institution,
          construction_detected: args.construction_detected,
          construction_type: args.construction_type,
          construction_stage: args.construction_stage,
          confidence: args.confidence,
        });
        const finalConfidence = effectiveConfidence(args.confidence, crosscheck);

        const assessment = await repo.createAssessment({
          signal_id: args.signal_id,
          construction_detected: args.construction_detected,
          construction_type: args.construction_type,
          construction_stage: args.construction_stage,
          description: args.description ?? null,
          confidence: finalConfidence,
          reasoning_summary: args.reasoning_summary ?? null,
          is_educational_institution: args.is_educational_institution,
          lexical_crosscheck: crosscheck,
        });

        if (signal.source_url) {
          await repo.createEvidence({
            signal_id: signal.id,
            evidence_type: 'construction_signal',
            source_url: signal.source_url,
            source_name: signal.source,
            excerpt: (text ?? '').slice(0, 500) || null,
          });
        }

        return ok({
          success: true,
          assessment_id: assessment.id,
          is_educational_institution: args.is_educational_institution,
          construction_detected: args.construction_detected,
          construction_type: args.construction_type,
          construction_stage: args.construction_stage,
          claimed_confidence: args.confidence,
          effective_confidence: finalConfidence,
          lexical_crosscheck: crosscheck,
          warnings: crosscheck.disagreements,
          next_action: crosscheck.disagreements.length
            ? 'revise_a_classificacao_ou_traga_texto_que_sustente_a_afirmacao'
            : 'call_radar_find_contacts_or_radar_score_opportunity',
        });
      }),
  );

  // ============================================================ find_contacts
  server.registerTool(
    'radar_find_contacts',
    {
      title: 'Radar: registrar contatos públicos',
      description:
        'Grava contatos encontrados em fontes PÚBLICAS. Exige source_url por contato. ' +
        'verification_status=verified é rejeitado sem e-mail ou telefone reais. ' +
        'E-mail inferido deve vir como inferred — nunca como verified.',
      inputSchema: {
        institution_id: z.string().uuid(),
        opportunity_id: z.string().uuid().optional(),
        contacts: z
          .array(
            z.object({
              name: z.string(),
              role: z.string().optional(),
              organization: z.string().optional(),
              email: z.string().optional(),
              phone: z.string().optional(),
              linkedin_url: z.string().optional(),
              instagram_url: z.string().optional(),
              verification_status: z.enum(VERIFICATION_STATUSES),
              confidence: z.number().min(0).max(1).optional(),
              source_url: z.string().describe('OBRIGATÓRIO: onde este dado foi encontrado.'),
              source_name: z.string().optional(),
              excerpt: z.string().optional(),
            }),
          )
          .min(1),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    async (args) =>
      guarded(async () => {
        const repo = await ctx.getRepository();
        const created: unknown[] = [];
        const rejected: unknown[] = [];
        const duplicates: unknown[] = [];

        for (const c of args.contacts) {
          if (!normalizeUrl(c.source_url)) {
            rejected.push({ name: c.name, reason: 'source_url_invalido_ou_ausente' });
            continue;
          }
          if (c.verification_status === 'verified' && !c.email && !c.phone) {
            rejected.push({
              name: c.name,
              reason: 'verified_exige_email_ou_telefone_real',
            });
            continue;
          }
          if (c.email && c.verification_status === 'inferred') {
            // Permitido, mas nunca promovido: fica registrado como inferido.
          }

          const existing = await repo.findContactByName(args.institution_id, c.name);
          if (existing) {
            duplicates.push({ name: c.name, contact_id: existing.id });
            continue;
          }

          const contact = await repo.createContact({
            institution_id: args.institution_id,
            name: c.name,
            role: c.role ?? null,
            organization: c.organization ?? null,
            email: c.email ?? null,
            phone: c.phone ?? null,
            linkedin_url: c.linkedin_url ?? null,
            instagram_url: c.instagram_url ?? null,
            verification_status: c.verification_status,
            confidence: c.confidence ?? null,
          });

          await repo.createEvidence({
            opportunity_id: args.opportunity_id ?? null,
            contact_id: contact.id,
            evidence_type: 'contact_source',
            source_url: c.source_url,
            source_name: c.source_name ?? null,
            excerpt: c.excerpt ?? null,
          });

          created.push({
            contact_id: contact.id,
            name: contact.name,
            verification_status: contact.verification_status,
          });
        }

        return ok({
          success: true,
          created_count: created.length,
          created,
          duplicates,
          rejected,
          next_action: 'call_radar_score_opportunity',
        });
      }),
  );

  // ======================================================= score_opportunity
  server.registerTool(
    'radar_score_opportunity',
    {
      title: 'Radar: pontuar oportunidade',
      description:
        'Calcula score 0–100 de forma determinística a partir do que está persistido. ' +
        'eduinfo_fit e ecoclear_fit ficam null e FORA do score (insufficient_service_catalog).',
      inputSchema: {
        institution_id: z.string().uuid(),
        institution_confidence: z
          .number()
          .min(0)
          .max(1)
          .default(0.5)
          .describe('Sua confiança de que a instituição foi identificada corretamente.'),
        persist: z.boolean().default(true).describe('Grava score na oportunidade aberta.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    async (args) =>
      guarded(async () => {
        const repo = await ctx.getRepository();
        const signals = await repo.signalsForInstitution(args.institution_id);
        const assessment = await repo.latestAssessmentForSignals(signals.map((s) => s.id));
        const contacts = await repo.listContacts(args.institution_id);
        const newest = signals[0] ?? null;

        const result = scoreOpportunity({
          assessment,
          referenceDate: newest?.published_at ?? newest?.detected_at ?? null,
          institutionConfidence: args.institution_confidence,
          contacts,
        });

        let opportunityId: string | null = null;
        if (args.persist) {
          let opp = await repo.findOpenOpportunity(args.institution_id);
          if (!opp) opp = await repo.createOpportunity(args.institution_id);
          const updated = await repo.updateOpportunity(opp.id, {
            score: result.score,
            score_components: { components: result.components },
            score_explanation: result.explanation,
            eduinfo_fit: null,
            ecoclear_fit: null,
          });
          opportunityId = updated.id;
        }

        return ok({
          success: true,
          opportunity_id: opportunityId,
          score: result.score,
          score_components: result.components,
          score_explanation: result.explanation,
          eduinfo_fit: null,
          ecoclear_fit: null,
          fit_reason: result.fit_reason,
          next_action: 'call_radar_save_opportunity_or_radar_get_opportunity',
        });
      }),
  );

  // ======================================================== save_opportunity
  server.registerTool(
    'radar_save_opportunity',
    {
      title: 'Radar: salvar/atualizar oportunidade',
      description: 'Cria ou atualiza a oportunidade da instituição e devolve o payload para o Rufas.',
      inputSchema: {
        institution_id: z.string().uuid(),
        status: z.enum(OPPORTUNITY_STATUSES).optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    async (args) =>
      guarded(async () => {
        const repo = await ctx.getRepository();
        let opp = await repo.findOpenOpportunity(args.institution_id);
        if (!opp) opp = await repo.createOpportunity(args.institution_id);
        if (args.status) opp = await repo.updateOpportunity(opp.id, { status: args.status });

        return ok({
          success: true,
          opportunity_id: opp.id,
          status: opp.status,
          score: opp.score,
          next_action: 'call_radar_get_opportunity_para_o_payload_do_rufas',
        });
      }),
  );

  // ========================================================= get_opportunity
  server.registerTool(
    'radar_get_opportunity',
    {
      title: 'Radar: detalhe da oportunidade',
      description:
        'Retorna a oportunidade completa e o payload estruturado para o Rufas notificar no Telegram. ' +
        'O Radar NÃO envia Telegram — devolve o objeto para o Rufas renderizar.',
      inputSchema: { opportunity_id: z.string().uuid() },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) =>
      guarded(async () => {
        const repo = await ctx.getRepository();
        const opp = await repo.getOpportunity(args.opportunity_id);
        if (!opp) return fail('NOT_FOUND', `Oportunidade ${args.opportunity_id} não encontrada.`);

        const institution = await repo.getInstitution(opp.institution_id);
        if (!institution) return fail('NOT_FOUND', 'Instituição vinculada não encontrada.');

        const signals = await repo.signalsForInstitution(opp.institution_id);
        const assessment = await repo.latestAssessmentForSignals(signals.map((s) => s.id));
        const contacts = await repo.listContacts(opp.institution_id);

        const payload = buildRufasPayload({
          opportunity: opp,
          institution,
          assessment,
          contacts,
          sourceUrls: signals.map((s) => s.source_url).filter((u): u is string => Boolean(u)),
        });

        return ok({
          success: true,
          opportunity: opp,
          institution,
          assessment,
          contacts_count: contacts.length,
          rufas_payload: payload,
          delivery: { telegram_direct: false, note: 'Entregue o payload ao Rufas; ele renderiza.' },
        });
      }),
  );

  // ======================================================= list_opportunities
  server.registerTool(
    'radar_list_opportunities',
    {
      title: 'Radar: listar oportunidades',
      description: 'Lista oportunidades do usuário, ordenadas por score decrescente.',
      inputSchema: {
        status: z.enum(OPPORTUNITY_STATUSES).optional(),
        min_score: z.number().min(0).max(100).optional(),
        limit: z.number().min(1).max(100).default(25),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) =>
      guarded(async () => {
        const repo = await ctx.getRepository();
        const rows = await repo.listOpportunities({
          status: args.status,
          minScore: args.min_score,
          limit: args.limit,
        });
        return ok({ success: true, count: rows.length, opportunities: rows });
      }),
  );

  // ======================================================== prepare_outreach
  server.registerTool(
    'radar_prepare_outreach',
    {
      title: 'Radar: preparar rascunho de abordagem',
      description:
        'Cria um RASCUNHO de abordagem com status pending_approval. ' +
        'NÃO envia e-mail, NÃO envia WhatsApp, NÃO interage com LinkedIn. ' +
        'O envio exige aprovação humana e acontece fora do Radar.',
      inputSchema: {
        opportunity_id: z.string().uuid(),
        contact_id: z.string().uuid().optional(),
        channel: z.enum(['email', 'whatsapp', 'linkedin', 'phone']).default('email'),
        subject: z.string().optional(),
        body: z.string().describe('Corpo do rascunho, escrito por você.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    },
    async (args) =>
      guarded(async () => {
        const repo = await ctx.getRepository();
        const draft = await repo.createOutreachDraft({
          opportunity_id: args.opportunity_id,
          contact_id: args.contact_id ?? null,
          channel: args.channel,
          draft: { subject: args.subject ?? null, body: args.body },
        });
        await repo.updateOpportunity(args.opportunity_id, { status: 'outreach_prepared' });

        return ok({
          success: true,
          outreach_id: draft.id,
          status: draft.status,
          sent: false,
          approval_required: true,
          note: 'Rascunho criado. Nenhum envio foi realizado nem agendado pelo Radar.',
        });
      }),
  );

  // ====================================================== mark_false_positive
  server.registerTool(
    'radar_mark_false_positive',
    {
      title: 'Radar: marcar falso positivo',
      description: 'Marca a oportunidade como falso positivo e registra o motivo como evidência.',
      inputSchema: {
        opportunity_id: z.string().uuid(),
        reason: z.string().describe('Por que não é uma oportunidade real.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    async (args) =>
      guarded(async () => {
        const repo = await ctx.getRepository();
        const opp = await repo.updateOpportunity(args.opportunity_id, { status: 'false_positive' });
        await repo.createEvidence({
          opportunity_id: args.opportunity_id,
          evidence_type: 'false_positive_reason',
          excerpt: args.reason,
        });
        return ok({ success: true, opportunity_id: opp.id, status: opp.status });
      }),
  );

  // ========================================================= schedule_recheck
  server.registerTool(
    'radar_schedule_recheck',
    {
      title: 'Radar: agendar reavaliação',
      description:
        'Registra um job de reavaliação futura. O Radar não possui scheduler próprio nesta fase: ' +
        'o job fica pendente para ser consumido por quem orquestra (Rufas ou operação humana).',
      inputSchema: {
        opportunity_id: z.string().uuid(),
        recheck_at: z.string().describe('ISO 8601 da data desejada.'),
        note: z.string().optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    },
    async (args) =>
      guarded(async () => {
        const repo = await ctx.getRepository();
        const job = await repo.createJob({
          job_type: 'recheck_opportunity',
          input: { opportunity_id: args.opportunity_id, note: args.note ?? null },
          scheduled_for: args.recheck_at,
        });
        await repo.updateOpportunity(args.opportunity_id, { status: 'recheck_scheduled' });
        return ok({
          success: true,
          job_id: job.id,
          status: job.status,
          scheduled_for: job.scheduled_for,
          note: 'Sem scheduler automático nesta fase — o job aguarda consumo externo.',
        });
      }),
  );
}
