/**
 * As 13 tools do namespace `radar`.
 *
 * Contrato:
 * - toda tool devolve o envelope de domínio {ok, data, warnings, meta} dentro
 *   de `structuredContent`, preservando o protocolo MCP oficial;
 * - nenhuma tool interpreta JWT, header HTTP ou aceita identidade do payload;
 * - `user_id` deriva exclusivamente do AuthContext;
 * - nenhuma tool envia e-mail, WhatsApp ou interage com LinkedIn.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { RadarRepository } from '../db/repositories.js';
import { crosscheckClassification, effectiveConfidence } from '../domain/classification.js';
import { MAX_POINTS, scoreOpportunity } from '../domain/scoring.js';
import { buildRufasPayload } from '../domain/payload.js';
import { getCapabilities } from '../capabilities.js';
import { ERROR_CODES } from '../errors.js';
import {
  failure,
  failureFromError,
  newRequestId,
  success,
  type McpToolResponse,
} from '../envelope.js';
import {
  CONSTRUCTION_STAGES,
  CONSTRUCTION_TYPES,
  OPPORTUNITY_STATUSES,
  VERIFICATION_STATUSES,
  type ContentStatus,
} from '../types.js';
import { isValidSourceUrl } from '../domain/normalize.js';

export interface ToolObserver {
  (event: {
    tool_name: string;
    duration_ms: number;
    result_status: 'ok' | 'error';
    request_id: string;
    error_code?: string;
  }): void;
}

export interface ToolContext {
  getRepository(): Promise<RadarRepository>;
  supabaseConfigured: boolean;
  /** Log estruturado. NUNCA recebe JWT, token, header ou dado pessoal. */
  observe?: ToolObserver;
}

/** Soma dos componentes ativos — 100 menos os pontos de fit, que não são redistribuídos. */
const MAXIMUM_CURRENT_SCORE = Object.values(MAX_POINTS).reduce((a, b) => a + b, 0);

/**
 * Envolve o corpo da tool com request_id, medição de duração, log seguro e
 * normalização de qualquer exceção em envelope de erro.
 */
function runTool(
  ctx: ToolContext,
  toolName: string,
  body: (requestId: string) => Promise<McpToolResponse>,
): Promise<McpToolResponse> {
  const requestId = newRequestId();
  const startedAt = Date.now();
  return body(requestId)
    .catch((err) => failureFromError(err, requestId))
    .then((response) => {
      const env = response.structuredContent as { ok?: boolean; error?: { code?: string } };
      ctx.observe?.({
        tool_name: toolName,
        duration_ms: Date.now() - startedAt,
        result_status: env?.ok ? 'ok' : 'error',
        request_id: requestId,
        ...(env?.error?.code ? { error_code: env.error.code } : {}),
      });
      return response;
    });
}

export function registerRadarTools(server: McpServer, ctx: ToolContext): void {
  const caps = () => getCapabilities({ supabaseConfigured: ctx.supabaseConfigured });

  // ======================================================= get_capabilities
  server.registerTool(
    'radar_get_capabilities',
    {
      title: 'Radar: capacidades reais',
      description:
        'Fonte de verdade operacional: o que o Radar consegue fazer AGORA, separado em ' +
        'available / unavailable / planned. Roadmap nunca aparece como available. ' +
        'Consulte antes de assumir qualquer integração.',
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () =>
      runTool(ctx, 'radar_get_capabilities', async (requestId) => {
        const c = caps();
        const entries = Object.entries(c).filter(([, v]) => typeof v === 'boolean') as [string, boolean][];
        return success(
          {
            capabilities: c,
            available: entries.filter(([, v]) => v).map(([k]) => k),
            unavailable: entries.filter(([, v]) => !v).map(([k]) => k),
            // Roadmap explicitamente separado — nunca contado como available.
            planned: [
              'instagram_post_read',
              'instagram_discovery',
              'instagram_monitoring',
              'linkedin_company_lookup',
              'linkedin_people_search',
              'composio_connected',
              'email_send',
            ],
            web_research_mode: c.web_research_mode,
          },
          { requestId, capabilitiesUsed: [] },
        );
      }),
  );

  // ========================================================= register_signal
  server.registerTool(
    'radar_register_signal',
    {
      title: 'Radar: registrar sinal',
      description:
        'Persiste um sinal bruto ANTES de qualquer processamento. Exige source_url ou raw_text. ' +
        'Idempotente por dedupe forte: a segunda chamada com a mesma URL/id externo devolve ' +
        'existing=true e não cria um segundo sinal.',
      inputSchema: {
        source_url: z.string().optional().describe('URL do post/notícia. Opcional se raw_text for enviado.'),
        raw_text: z.string().optional().describe('Texto da publicação, colado manualmente.'),
        source: z.string().default('manual').describe('Origem: manual, rufas, instagram_url, news...'),
        source_external_id: z.string().optional().describe('ID externo, quando existir.'),
        published_at: z.string().datetime().optional().describe('ISO 8601 UTC da publicação original.'),
        institution_id: z.string().uuid().optional().describe('Instituição, se já conhecida.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    async (args) =>
      runTool(ctx, 'radar_register_signal', async (requestId) => {
        if (!args.source_url && !args.raw_text) {
          return failure(ERROR_CODES.INVALID_INPUT, 'É obrigatório enviar source_url ou raw_text.', {
            requestId,
            hint: 'Cole o texto da publicação em raw_text quando a URL não puder ser lida.',
          });
        }

        const repo = await ctx.getRepository();
        const existing = await repo.findSignal({
          source: args.source,
          source_url: args.source_url,
          source_external_id: args.source_external_id,
        });

        if (existing.record) {
          return success(
            {
              signal_id: existing.record.id,
              existing: true,
              matched_by: existing.matchedBy?.field ?? null,
              content_status: (existing.record.raw_text ? 'content_available' : 'url_only') as ContentStatus,
              next_action: 'signal_already_registered_use_classify_construction',
            },
            {
              requestId,
              warnings: ['DUPLICATE_SIGNAL: sinal já existia; nenhum registro novo foi criado.'],
              capabilitiesUsed: ['supabase_storage'],
            },
          );
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
        const warnings: string[] = [];
        if (args.raw_text && args.source_url) {
          contentStatus = 'content_available';
          nextAction = 'call_radar_resolve_institution_then_classify_construction';
        } else if (args.raw_text) {
          contentStatus = 'manual_text';
          nextAction = 'call_radar_resolve_institution_then_classify_construction';
        } else {
          contentStatus = 'url_only';
          nextAction = 'fetch_content_with_your_own_tools_then_classify_with_raw_text_override';
          warnings.push(
            'Sinal salvo apenas com URL: o servidor não lê páginas (web_research=agent_delegated).',
          );
        }

        return success(
          {
            signal_id: signal.id,
            existing: false,
            content_status: contentStatus,
            next_action: nextAction,
          },
          { requestId, warnings, capabilitiesUsed: ['supabase_storage'] },
        );
      }),
  );

  // ===================================================== resolve_institution
  server.registerTool(
    'radar_resolve_institution',
    {
      title: 'Radar: resolver instituição',
      description:
        'Encontra ou cria a instituição com dedupe. resolution_status: resolved (chave forte ou ' +
        'criação), ambiguous (candidato de baixa confiança — exige confirm_weak_match) ou ' +
        'not_found. Baixa confiança NUNCA vira resolved silenciosamente.',
      inputSchema: {
        name: z.string().min(1).describe('Nome do colégio como aparece na fonte.'),
        website: z.string().optional(),
        instagram_url: z.string().optional(),
        linkedin_url: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional().describe('UF ou nome do estado.'),
        phone: z.string().optional(),
        legal_name: z.string().optional(),
        signal_id: z.string().uuid().optional().describe('Vincula o sinal à instituição resolvida.'),
        create_if_missing: z.boolean().default(true).describe('Criar quando não houver candidato.'),
        confirm_weak_match: z
          .boolean()
          .default(false)
          .describe('Confirma explicitamente o uso de um candidato de baixa confiança.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    async (args) =>
      runTool(ctx, 'radar_resolve_institution', async (requestId) => {
        const repo = await ctx.getRepository();
        const match = await repo.findInstitution({
          name: args.name,
          website: args.website,
          instagram_url: args.instagram_url,
          city: args.city,
          state: args.state,
        });

        // Candidato fraco sem confirmação: ambíguo, jamais resolvido em silêncio.
        if (match.record && match.requiresConfirmation && !args.confirm_weak_match) {
          return success(
            {
              resolution_status: 'ambiguous' as const,
              confidence: 0.4,
              institution: null,
              candidate_matches: [
                {
                  id: match.record.id,
                  name: match.record.name,
                  city: match.record.city,
                  state: match.record.state,
                  website: match.record.website,
                  matched_by: match.matchedBy?.field ?? null,
                  match_strength: match.matchedBy?.strength ?? null,
                },
              ],
              next_action:
                'confirme com confirm_weak_match=true, ou informe website/instagram para dedupe forte',
            },
            {
              requestId,
              warnings: [`${ERROR_CODES.CONFLICT_REQUIRES_REVIEW}: match de baixa confiança exige revisão.`],
              capabilitiesUsed: ['supabase_storage'],
            },
          );
        }

        if (!match.record && !args.create_if_missing) {
          return success(
            {
              resolution_status: 'not_found' as const,
              confidence: 0,
              institution: null,
              candidate_matches: [],
              next_action: 'chame novamente com create_if_missing=true para criar a instituição',
            },
            { requestId, capabilitiesUsed: ['supabase_storage'] },
          );
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

        if (args.signal_id) await repo.linkSignalToInstitution(args.signal_id, institution.id);

        // Confiança: chave forte > criação nova > confirmação manual de chave fraca.
        const confidence = match.matchedBy?.strength === 'strong' ? 0.95 : created ? 0.7 : 0.6;

        return success(
          {
            resolution_status: 'resolved' as const,
            confidence,
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
            candidate_matches: [],
            next_action: 'call_radar_classify_construction',
          },
          { requestId, capabilitiesUsed: ['supabase_storage'] },
        );
      }),
  );

  // ==================================================== research_institution
  server.registerTool(
    'radar_research_institution',
    {
      title: 'Radar: plano de pesquisa pública',
      description:
        'O SERVIDOR NÃO faz busca web (web_research=agent_delegated). Devolve um plano de consultas ' +
        'para VOCÊ executar e trazer de volta. Achados persistidos exigem proveniência (source_url). ' +
        'Nunca afirme que um dado veio de Instagram ou LinkedIn sem ter acessado.',
      inputSchema: {
        institution_id: z.string().uuid(),
        focus: z
          .array(z.enum(['website', 'location', 'phone', 'public_email', 'news', 'construction']))
          .default(['website', 'location', 'phone', 'public_email', 'news', 'construction']),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) =>
      runTool(ctx, 'radar_research_institution', async (requestId) => {
        const repo = await ctx.getRepository();
        const inst = await repo.getInstitution(args.institution_id);
        if (!inst) {
          return failure(ERROR_CODES.NOT_FOUND, 'Instituição não encontrada.', { requestId });
        }

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

        return success(
          {
            research_mode: 'agent_delegated' as const,
            server_performs_search: false,
            institution: { id: inst.id, name: inst.name, city: inst.city, state: inst.state, website: inst.website },
            research_plan: plan,
            // Taxonomia obrigatória ao devolver achados.
            result_classification: {
              fact: 'dado verificável, com source_url obrigatório',
              hypothesis: 'leitura plausível, não confirmada — nunca persistir como fato',
              unverified: 'encontrado sem fonte confiável — não persistir',
            },
            rules: [
              'Somente fontes públicas legítimas.',
              'Todo fato persistido exige source_url (proveniência).',
              'Nunca fabricar e-mail nem inferir padrão de e-mail como confirmado.',
              'Instagram e LinkedIn indisponíveis: não atribua dados a essas fontes.',
            ],
            next_action: 'execute_plan_with_your_tools_then_call_radar_find_contacts',
          },
          { requestId, capabilitiesUsed: [] },
        );
      }),
  );

  // =================================================== classify_construction
  server.registerTool(
    'radar_classify_construction',
    {
      title: 'Radar: classificar obra',
      description:
        'Persiste SUA avaliação semântica (agent_assessment) e roda uma contraprova determinística ' +
        '(lexical_support) — que NÃO é análise semântica. Conflito não substitui sua avaliação em ' +
        'silêncio: ele é sinalizado em conflict_flag e, se forte, review_recommended=true. ' +
        'Envie reasoning_summary curto — nunca raciocínio interno completo.',
      inputSchema: {
        signal_id: z.string().uuid(),
        is_educational_institution: z.boolean().describe('O sinal é de instituição de ensino?'),
        construction_detected: z.boolean().describe('Há evidência de obra física?'),
        construction_type: z.enum(CONSTRUCTION_TYPES).default('unknown'),
        construction_stage: z.enum(CONSTRUCTION_STAGES).default('S0_VAGUE_SIGNAL'),
        confidence: z.number().min(0).max(1).describe('Sua confiança na análise (0–1).'),
        description: z.string().max(2000).optional().describe('Descrição objetiva do encontrado.'),
        reasoning_summary: z
          .string()
          .max(600)
          .optional()
          .describe('Resumo curto e auditável (máx. 600 chars). Não é chain-of-thought.'),
        raw_text_override: z.string().optional().describe('Texto lido por você, quando o sinal só tinha URL.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    },
    async (args) =>
      runTool(ctx, 'radar_classify_construction', async (requestId) => {
        const repo = await ctx.getRepository();
        const signal = await repo.getSignal(args.signal_id);
        if (!signal) {
          return failure(ERROR_CODES.NOT_FOUND, 'Sinal não encontrado.', { requestId });
        }

        const text = args.raw_text_override ?? signal.raw_text;
        const agentAssessment = {
          is_educational_institution: args.is_educational_institution,
          construction_detected: args.construction_detected,
          construction_type: args.construction_type,
          construction_stage: args.construction_stage,
          confidence: args.confidence,
        };

        const lexical = crosscheckClassification(text, agentAssessment);
        const finalConfidence = effectiveConfidence(args.confidence, lexical);
        const conflictFlag = lexical.disagreements.length > 0;
        // Conflito forte: duas ou mais divergências, ou negação direta da premissa.
        const strongConflict =
          lexical.disagreements.length >= 2 ||
          lexical.disagreements.includes('metaphorical_construction_language_detected');

        const assessment = await repo.createAssessment({
          signal_id: args.signal_id,
          construction_detected: args.construction_detected,
          construction_type: args.construction_type,
          construction_stage: args.construction_stage,
          description: args.description ?? null,
          confidence: finalConfidence,
          reasoning_summary: args.reasoning_summary ?? null,
          is_educational_institution: args.is_educational_institution,
          lexical_crosscheck: lexical,
        });

        let evidenceSupport: { source_url: string; excerpt: string | null } | null = null;
        if (signal.source_url) {
          await repo.createEvidence({
            signal_id: signal.id,
            evidence_type: 'construction_signal',
            source_url: signal.source_url,
            source_name: signal.source,
            excerpt: (text ?? '').slice(0, 500) || null,
          });
          evidenceSupport = { source_url: signal.source_url, excerpt: (text ?? '').slice(0, 500) || null };
        }

        return success(
          {
            assessment_id: assessment.id,
            agent_assessment: agentAssessment,
            lexical_support: {
              construction_terms: lexical.construction_terms,
              education_terms: lexical.education_terms,
              has_construction_lexicon: lexical.has_construction_lexicon,
              has_education_lexicon: lexical.has_education_lexicon,
              disagreements: lexical.disagreements,
              note: 'Contraprova determinística por vocabulário. NÃO é análise semântica.',
            },
            evidence_support: evidenceSupport,
            conflict_flag: conflictFlag,
            review_recommended: strongConflict,
            final_persisted_assessment: {
              construction_detected: assessment.construction_detected,
              construction_type: assessment.construction_type,
              construction_stage: assessment.construction_stage,
              // A avaliação do agente é preservada; apenas a confiança é penalizada.
              claimed_confidence: args.confidence,
              effective_confidence: finalConfidence,
            },
            next_action: strongConflict
              ? 'revise_a_classificacao_ou_traga_texto_que_sustente_a_afirmacao'
              : 'call_radar_find_contacts_or_radar_score_opportunity',
          },
          {
            requestId,
            warnings: conflictFlag
              ? [`${ERROR_CODES.CONFLICT_REQUIRES_REVIEW}: ${lexical.disagreements.join('; ')}`]
              : [],
            capabilitiesUsed: ['supabase_storage'],
          },
        );
      }),
  );

  // ============================================================ find_contacts
  server.registerTool(
    'radar_find_contacts',
    {
      title: 'Radar: registrar contatos públicos',
      description:
        'Grava contatos encontrados em fontes PÚBLICAS. Lista vazia é resposta VÁLIDA quando não ' +
        'há fonte confiável — nunca invente contato. Exige source_url por contato. ' +
        'verification_status=verified é rejeitado sem e-mail ou telefone real; e-mail inferido ' +
        'permanece inferred.',
      inputSchema: {
        institution_id: z.string().uuid(),
        opportunity_id: z.string().uuid().optional(),
        contacts: z
          .array(
            z.object({
              name: z.string().min(1),
              role: z.string().optional(),
              organization: z.string().optional(),
              email: z.string().email().optional(),
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
          // Lista vazia é legítima: "nenhuma fonte confiável encontrada".
          .default([]),
        no_reliable_source: z
          .boolean()
          .default(false)
          .describe('Declare true quando a pesquisa não encontrou fonte confiável.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    async (args) =>
      runTool(ctx, 'radar_find_contacts', async (requestId) => {
        const repo = await ctx.getRepository();

        if (args.contacts.length === 0) {
          return success(
            {
              created_count: 0,
              contacts: [],
              duplicates: [],
              rejected: [],
              no_reliable_source: args.no_reliable_source,
              next_action: 'call_radar_score_opportunity',
            },
            {
              requestId,
              warnings: [
                `${ERROR_CODES.INSUFFICIENT_EVIDENCE}: nenhum contato público confiável foi encontrado.`,
              ],
              capabilitiesUsed: ['supabase_storage'],
            },
          );
        }

        const created: unknown[] = [];
        const rejected: unknown[] = [];
        const duplicates: unknown[] = [];

        for (const c of args.contacts) {
          if (!isValidSourceUrl(c.source_url)) {
            rejected.push({ name: c.name, reason: 'source_url_invalido_ou_ausente' });
            continue;
          }
          if (c.verification_status === 'verified' && !c.email && !c.phone) {
            rejected.push({ name: c.name, reason: 'verified_exige_email_ou_telefone_real' });
            continue;
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

          // Proveniência obrigatória para todo dado factual persistido.
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

        return success(
          {
            created_count: created.length,
            contacts: created,
            duplicates,
            rejected,
            no_reliable_source: false,
            next_action: 'call_radar_score_opportunity',
          },
          {
            requestId,
            warnings: rejected.length ? [`${rejected.length} contato(s) rejeitado(s) por falta de proveniência ou verificação.`] : [],
            capabilitiesUsed: ['supabase_storage'],
          },
        );
      }),
  );

  // ======================================================= score_opportunity
  server.registerTool(
    'radar_score_opportunity',
    {
      title: 'Radar: pontuar oportunidade',
      description:
        'Score determinístico a partir do que está persistido. Componentes ativos: ' +
        'construction_signal, recency, construction_stage, institution_confidence, contact_quality. ' +
        'eduinfo_fit e ecoclear_fit ficam null e FORA do score; os pontos ausentes NÃO são redistribuídos.',
      inputSchema: {
        institution_id: z.string().uuid(),
        institution_confidence: z.number().min(0).max(1).default(0.5),
        persist: z.boolean().default(true),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    async (args) =>
      runTool(ctx, 'radar_score_opportunity', async (requestId) => {
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

        return success(
          {
            opportunity_id: opportunityId,
            score: result.score,
            // Teto real dos componentes ativos. Sem normalização implícita.
            maximum_current_score: MAXIMUM_CURRENT_SCORE,
            score_normalized: false,
            score_components: result.components,
            score_explanation: result.explanation,
            eduinfo_fit: null,
            ecoclear_fit: null,
            fit_reason: result.fit_reason,
            next_action: 'call_radar_get_opportunity',
          },
          {
            requestId,
            warnings: assessment ? [] : [`${ERROR_CODES.INSUFFICIENT_EVIDENCE}: nenhuma avaliação de obra persistida.`],
            capabilitiesUsed: ['supabase_storage'],
          },
        );
      }),
  );

  // ======================================================== save_opportunity
  server.registerTool(
    'radar_save_opportunity',
    {
      title: 'Radar: salvar/atualizar oportunidade',
      description:
        'Cria ou atualiza a oportunidade da instituição. Aceita APENAS transição de status — ' +
        'não é escrita de JSON arbitrário: user_id, created_at, score e proveniência não são ' +
        'sobrescrevíveis por esta tool.',
      inputSchema: {
        institution_id: z.string().uuid(),
        status: z.enum(OPPORTUNITY_STATUSES).optional().describe('Único campo mutável aqui.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    async (args) =>
      runTool(ctx, 'radar_save_opportunity', async (requestId) => {
        const repo = await ctx.getRepository();
        let opp = await repo.findOpenOpportunity(args.institution_id);
        if (!opp) opp = await repo.createOpportunity(args.institution_id);
        // Somente `status` é propagado: campos protegidos jamais entram no patch.
        if (args.status) opp = await repo.updateOpportunity(opp.id, { status: args.status });

        return success(
          {
            opportunity_id: opp.id,
            status: opp.status,
            score: opp.score,
            protected_fields: ['user_id', 'created_at', 'institution_id', 'score_components'],
            next_action: 'call_radar_get_opportunity',
          },
          { requestId, capabilitiesUsed: ['supabase_storage'] },
        );
      }),
  );

  // ========================================================= get_opportunity
  server.registerTool(
    'radar_get_opportunity',
    {
      title: 'Radar: detalhe da oportunidade',
      description:
        'Retorna a oportunidade com todas as relações (institution, signals, assessments, contacts, ' +
        'evidence, outreach, score_components) e o payload estruturado para o Rufas. ' +
        'O Radar NÃO envia Telegram.',
      inputSchema: { opportunity_id: z.string().uuid() },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) =>
      runTool(ctx, 'radar_get_opportunity', async (requestId) => {
        const repo = await ctx.getRepository();
        const opp = await repo.getOpportunity(args.opportunity_id);
        // RLS não distingue "não existe" de "é de outro usuário": ambos NOT_FOUND.
        if (!opp) {
          return failure(ERROR_CODES.NOT_FOUND, 'Oportunidade não encontrada.', { requestId });
        }

        const institution = await repo.getInstitution(opp.institution_id);
        if (!institution) {
          return failure(ERROR_CODES.NOT_FOUND, 'Instituição vinculada não encontrada.', { requestId });
        }

        const signals = await repo.signalsForInstitution(opp.institution_id);
        const assessment = await repo.latestAssessmentForSignals(signals.map((s) => s.id));
        const assessments = await repo.assessmentsForSignals(signals.map((s) => s.id));
        const contacts = await repo.listContacts(opp.institution_id);
        const evidence = await repo.listEvidence(opp.id);
        const outreach = await repo.listOutreach(opp.id);

        const payload = buildRufasPayload({
          opportunity: opp,
          institution,
          assessment,
          contacts,
          sourceUrls: signals.map((s) => s.source_url).filter((u): u is string => Boolean(u)),
        });

        return success(
          {
            opportunity: opp,
            institution,
            signals,
            construction_assessments: assessments,
            contacts,
            evidence,
            outreach,
            score_components: opp.score_components,
            rufas_payload: payload,
            delivery: { telegram_direct: false, note: 'Entregue o payload ao Rufas; ele renderiza.' },
          },
          { requestId, capabilitiesUsed: ['supabase_storage'] },
        );
      }),
  );

  // ======================================================= list_opportunities
  server.registerTool(
    'radar_list_opportunities',
    {
      title: 'Radar: listar oportunidades',
      description:
        'Lista oportunidades do usuário. Paginação keyset por cursor (created_at+id), não offset. ' +
        'Filtros por construction_type/stage e por UF não existem nesta fase (exigiriam join ou ' +
        'desnormalização) — use radar_get_opportunity para inspecionar cada item.',
      inputSchema: {
        status: z.enum(OPPORTUNITY_STATUSES).optional(),
        min_score: z.number().min(0).max(100).optional(),
        created_after: z.string().datetime().optional().describe('ISO 8601 UTC.'),
        limit: z.number().int().min(1).max(100).default(25),
        cursor: z.string().optional().describe('next_cursor da página anterior (keyset).'),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) =>
      runTool(ctx, 'radar_list_opportunities', async (requestId) => {
        const repo = await ctx.getRepository();
        const page = await repo.listOpportunities({
          status: args.status,
          minScore: args.min_score,
          createdAfter: args.created_after,
          limit: args.limit,
          cursor: args.cursor,
        });

        return success(
          {
            count: page.items.length,
            opportunities: page.items,
            next_cursor: page.nextCursor,
            has_more: page.nextCursor !== null,
            unsupported_filters: {
              construction_type: 'DEFERRED: vive em radar_construction_assessments; exigiria join.',
              construction_stage: 'DEFERRED: idem.',
              state: 'DEFERRED: vive em radar_institutions; exigiria join.',
            },
          },
          { requestId, capabilitiesUsed: ['supabase_storage'] },
        );
      }),
  );

  // ======================================================== prepare_outreach
  server.registerTool(
    'radar_prepare_outreach',
    {
      title: 'Radar: preparar rascunho de abordagem',
      description:
        'Cria um RASCUNHO com status pending_approval. NUNCA envia e-mail, NUNCA envia WhatsApp, ' +
        'NUNCA interage com LinkedIn. Não existe caminho de execução que chame envio real: ' +
        'o envio exige aprovação humana e acontece fora do Radar.',
      inputSchema: {
        opportunity_id: z.string().uuid(),
        contact_id: z.string().uuid().optional(),
        channel: z.enum(['email', 'whatsapp', 'linkedin', 'phone']).default('email'),
        subject: z.string().max(300).optional(),
        body: z.string().min(1).max(10000).describe('Corpo do rascunho, escrito por você.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    },
    async (args) =>
      runTool(ctx, 'radar_prepare_outreach', async (requestId) => {
        const repo = await ctx.getRepository();
        const draft = await repo.createOutreachDraft({
          opportunity_id: args.opportunity_id,
          contact_id: args.contact_id ?? null,
          channel: args.channel,
          draft: { subject: args.subject ?? null, body: args.body },
        });
        await repo.updateOpportunity(args.opportunity_id, { status: 'outreach_prepared' });

        return success(
          {
            outreach_id: draft.id,
            status: draft.status,
            sent: false,
            send_attempted: false,
            approval_required: true,
            note: 'Rascunho criado. Nenhum envio foi realizado nem agendado pelo Radar.',
          },
          {
            requestId,
            warnings: [`${ERROR_CODES.APPROVAL_REQUIRED}: o envio depende de aprovação humana fora do Radar.`],
            capabilitiesUsed: ['supabase_storage', 'gmail_draft'],
          },
        );
      }),
  );

  // ====================================================== mark_false_positive
  server.registerTool(
    'radar_mark_false_positive',
    {
      title: 'Radar: marcar falso positivo',
      description:
        'Marca a oportunidade como falso positivo e registra o motivo datado como evidência. ' +
        'Não apaga o sinal nem a avaliação original — a trilha de auditoria é preservada.',
      inputSchema: {
        opportunity_id: z.string().uuid(),
        reason: z.string().min(1).max(2000).describe('Por que não é uma oportunidade real.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    async (args) =>
      runTool(ctx, 'radar_mark_false_positive', async (requestId) => {
        const repo = await ctx.getRepository();
        const opp = await repo.updateOpportunity(args.opportunity_id, { status: 'false_positive' });
        const markedAt = new Date().toISOString();
        const ev = await repo.createEvidence({
          opportunity_id: args.opportunity_id,
          evidence_type: 'false_positive_reason',
          excerpt: args.reason,
          metadata: { marked_at: markedAt },
        });

        return success(
          {
            opportunity_id: opp.id,
            status: opp.status,
            reason: args.reason,
            marked_at: markedAt,
            evidence_id: ev.id,
            preserved: ['signals', 'construction_assessments', 'evidence'],
          },
          { requestId, capabilitiesUsed: ['supabase_storage'] },
        );
      }),
  );

  // ========================================================= schedule_recheck
  server.registerTool(
    'radar_schedule_recheck',
    {
      title: 'Radar: agendar reavaliação',
      description:
        'Persiste um job de reavaliação. O Radar não possui scheduler próprio nesta fase e NÃO ' +
        'depende de Google Calendar: o job fica pendente para consumo por quem orquestra.',
      inputSchema: {
        opportunity_id: z.string().uuid(),
        recheck_at: z.string().datetime().describe('ISO 8601 UTC.'),
        note: z.string().max(1000).optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    },
    async (args) =>
      runTool(ctx, 'radar_schedule_recheck', async (requestId) => {
        const repo = await ctx.getRepository();
        const job = await repo.createJob({
          job_type: 'recheck_opportunity',
          input: { opportunity_id: args.opportunity_id, note: args.note ?? null },
          scheduled_for: args.recheck_at,
        });
        await repo.updateOpportunity(args.opportunity_id, { status: 'recheck_scheduled' });

        return success(
          {
            job_id: job.id,
            status: job.status,
            scheduled_for: job.scheduled_for,
            scheduler_available: false,
            depends_on_calendar: false,
          },
          {
            requestId,
            warnings: ['Sem scheduler automático nesta fase — o job aguarda consumo externo.'],
            capabilitiesUsed: ['supabase_storage'],
          },
        );
      }),
  );
}
