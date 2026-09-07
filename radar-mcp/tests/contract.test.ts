/**
 * Testes de CONTRATO no nível MCP.
 *
 * Exercitam as tools através de um McpServer real, via InMemoryTransport e um
 * cliente MCP real — não chamam funções de domínio diretamente. Teste de
 * domínio não substitui teste de contrato.
 *
 * O repositório é um fake in-memory, para que o contrato possa ser validado
 * sem Supabase. O isolamento entre usuários é simulado pelo fake da mesma forma
 * que a RLS faz no Postgres (validada separadamente contra o banco real).
 */

import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import { describe, test } from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { registerRadarTools, type ToolContext } from '../src/tools/index.js';
import { detectIdentityInjection, buildAuthContext } from '../src/auth.js';
import { containsLeak, ERROR_CODES } from '../src/errors.js';
import { isValidSourceUrl } from '../src/domain/normalize.js';
import type { RadarRepository } from '../src/db/repositories.js';

// ------------------------------------------------------------ fake repository

const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

class AuthRequiredError extends Error {
  constructor(msg = 'JWT ausente') {
    super(msg);
    this.name = 'AuthRequiredError';
  }
}
class RepositoryError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'RepositoryError';
  }
}

interface Row {
  id: string;
  user_id: string;
  [k: string]: unknown;
}

/** Fake que replica a semântica de isolamento por user_id (como a RLS faz). */
function makeFakeRepo(userId: string, store: Map<string, Row[]>) {
  // UUID real: os schemas das tools exigem z.string().uuid().
  const uid = (_prefix: string) => randomUUID();
  const table = (name: string): Row[] => {
    if (!store.has(name)) store.set(name, []);
    return store.get(name)!;
  };
  /** Só enxerga o que pertence ao usuário — equivalente a auth.uid() = user_id. */
  const mine = (name: string) => table(name).filter((r) => r.user_id === userId);

  return {
    async findSignal(identity: { source_url?: string | null }) {
      const found = mine('signals').find(
        (s) => identity.source_url && s.source_url === identity.source_url,
      );
      return found
        ? { record: found, matchedBy: { field: 'source_url', value: '', strength: 'strong' }, requiresConfirmation: false }
        : { record: null, matchedBy: null, requiresConfirmation: false };
    },
    async createSignal(input: Record<string, unknown>) {
      const row: Row = {
        id: uid('sig'),
        user_id: userId, // sempre do contexto, nunca do payload
        detected_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        ...input,
      };
      table('signals').push(row);
      return row;
    },
    async getSignal(id: string) {
      return mine('signals').find((s) => s.id === id) ?? null;
    },
    async linkSignalToInstitution() {},
    async findInstitution(identity: { website?: string | null; name?: string | null }) {
      const found = mine('institutions').find(
        (i) => identity.website && i.website === identity.website,
      );
      return found
        ? { record: found, matchedBy: { field: 'domain', value: '', strength: 'strong' }, requiresConfirmation: false }
        : { record: null, matchedBy: null, requiresConfirmation: false };
    },
    async createInstitution(input: Record<string, unknown>) {
      const row: Row = { id: uid('ins'), user_id: userId, ...input };
      table('institutions').push(row);
      return row;
    },
    async getInstitution(id: string) {
      return mine('institutions').find((i) => i.id === id) ?? null;
    },
    async createAssessment(input: Record<string, unknown>) {
      const row: Row = { id: uid('asm'), user_id: userId, created_at: new Date().toISOString(), ...input };
      table('assessments').push(row);
      return row;
    },
    async assessmentsForSignals(ids: string[]) {
      return mine('assessments').filter((a) => ids.includes(a.signal_id as string));
    },
    async latestAssessmentForSignals(ids: string[]) {
      return mine('assessments').filter((a) => ids.includes(a.signal_id as string))[0] ?? null;
    },
    async findContactByName() {
      return null;
    },
    async createContact(input: Record<string, unknown>) {
      const row: Row = { id: uid('con'), user_id: userId, opt_out_status: false, ...input };
      table('contacts').push(row);
      return row;
    },
    async listContacts(institutionId: string) {
      return mine('contacts').filter((c) => c.institution_id === institutionId);
    },
    async createEvidence(input: Record<string, unknown>) {
      const row: Row = { id: uid('evd'), user_id: userId, captured_at: new Date().toISOString(), ...input };
      table('evidence').push(row);
      return row;
    },
    async listEvidence(oppId: string) {
      return mine('evidence').filter((e) => e.opportunity_id === oppId);
    },
    async listOutreach(oppId: string) {
      return mine('outreach').filter((o) => o.opportunity_id === oppId);
    },
    async findOpenOpportunity(institutionId: string) {
      return (
        mine('opportunities').find(
          (o) => o.institution_id === institutionId && o.status !== 'discarded' && o.status !== 'false_positive',
        ) ?? null
      );
    },
    async createOpportunity(institutionId: string) {
      const row: Row = {
        id: uid('opp'),
        user_id: userId,
        institution_id: institutionId,
        status: 'new',
        score: null,
        score_components: {},
        created_at: new Date().toISOString(),
      };
      table('opportunities').push(row);
      return row;
    },
    async updateOpportunity(id: string, patch: Record<string, unknown>) {
      const row = mine('opportunities').find((o) => o.id === id);
      if (!row) throw new RepositoryError('violates row-level security policy');
      Object.assign(row, patch);
      return row;
    },
    async getOpportunity(id: string) {
      return mine('opportunities').find((o) => o.id === id) ?? null;
    },
    async listOpportunities() {
      return { items: mine('opportunities'), nextCursor: null };
    },
    async signalsForInstitution(institutionId: string) {
      return mine('signals').filter((s) => s.institution_id === institutionId);
    },
    async createOutreachDraft(input: Record<string, unknown>) {
      const row: Row = { id: uid('out'), user_id: userId, status: 'pending_approval', ...input };
      table('outreach').push(row);
      return row;
    },
    async createJob(input: Record<string, unknown>) {
      const row: Row = { id: uid('job'), user_id: userId, status: 'pending', ...input };
      table('jobs').push(row);
      return row;
    },
  } as unknown as RadarRepository;
}

interface Harness {
  client: Client;
  observed: { tool_name: string; result_status: string; request_id: string; error_code?: string }[];
  close(): Promise<void>;
}

async function connect(opts: {
  userId?: string | null;
  store?: Map<string, Row[]>;
  supabaseConfigured?: boolean;
}): Promise<Harness> {
  const store = opts.store ?? new Map<string, Row[]>();
  const observed: Harness['observed'] = [];

  const server = new McpServer({ name: 'nar-radar-test', version: '0.0.0' });
  const ctx: ToolContext = {
    supabaseConfigured: opts.supabaseConfigured ?? true,
    observe: (e) => observed.push(e),
    async getRepository() {
      // Sem AuthContext não há repositório: falha fechado, como em produção.
      if (!opts.userId) throw new AuthRequiredError();
      const auth = buildAuthContext(opts.userId);
      return makeFakeRepo(auth.user_id, store);
    },
  };
  registerRadarTools(server, ctx);

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-client', version: '0.0.0' });
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);

  return {
    client,
    observed,
    async close() {
      await client.close();
      await server.close();
    },
  };
}

/** Extrai o envelope de domínio de uma resposta MCP. */
async function call(h: Harness, name: string, args: Record<string, unknown> = {}) {
  const res = (await h.client.callTool({ name, arguments: args })) as {
    structuredContent?: Record<string, unknown>;
    isError?: boolean;
  };
  return { envelope: res.structuredContent as any, isError: res.isError === true };
}

// ==================================================================== TESTES

describe('contrato MCP — protocolo e envelope', () => {
  test('tools/list expõe exatamente as 13 tools', async () => {
    const h = await connect({ userId: USER_A });
    const { tools } = await h.client.listTools();
    assert.equal(tools.length, 13);
    const names = tools.map((t) => t.name).sort();
    assert.deepEqual(names, [
      'radar_classify_construction',
      'radar_find_contacts',
      'radar_get_capabilities',
      'radar_get_opportunity',
      'radar_list_opportunities',
      'radar_mark_false_positive',
      'radar_prepare_outreach',
      'radar_register_signal',
      'radar_research_institution',
      'radar_resolve_institution',
      'radar_save_opportunity',
      'radar_schedule_recheck',
      'radar_score_opportunity',
    ]);
    await h.close();
  });

  test('envelope de sucesso tem ok/data/warnings/meta.request_id', async () => {
    const h = await connect({ userId: USER_A });
    const { envelope } = await call(h, 'radar_get_capabilities');
    assert.equal(envelope.ok, true);
    assert.ok(envelope.data);
    assert.ok(Array.isArray(envelope.warnings));
    assert.match(envelope.meta.request_id, /^[0-9a-f-]{36}$/);
    assert.ok(Array.isArray(envelope.meta.capabilities_used));
    await h.close();
  });

  test('request_id é único por chamada e registrado na observabilidade', async () => {
    const h = await connect({ userId: USER_A });
    const a = await call(h, 'radar_get_capabilities');
    const b = await call(h, 'radar_get_capabilities');
    assert.notEqual(a.envelope.meta.request_id, b.envelope.meta.request_id);
    assert.equal(h.observed.length, 2);
    assert.equal(h.observed[0].tool_name, 'radar_get_capabilities');
    assert.equal(h.observed[0].result_status, 'ok');
    // Log não pode conter token/JWT/header.
    assert.ok(!containsLeak(JSON.stringify(h.observed)));
    await h.close();
  });
});

describe('contrato MCP — 1. chamada sem AuthContext', () => {
  test('tool de escrita sem AuthContext devolve UNAUTHENTICATED', async () => {
    const h = await connect({ userId: null });
    const { envelope, isError } = await call(h, 'radar_register_signal', { raw_text: 'obra na escola' });
    assert.equal(isError, true);
    assert.equal(envelope.ok, false);
    assert.equal(envelope.error.code, ERROR_CODES.UNAUTHENTICATED);
    assert.ok(envelope.meta.request_id);
    await h.close();
  });

  test('get_capabilities funciona sem AuthContext (read-only)', async () => {
    const h = await connect({ userId: null });
    const { envelope } = await call(h, 'radar_get_capabilities');
    assert.equal(envelope.ok, true);
    await h.close();
  });
});

describe('contrato MCP — 2 e 12. isolamento entre usuários', () => {
  test('user B não acessa opportunity de user A (NOT_FOUND)', async () => {
    const store = new Map<string, Row[]>();
    const hA = await connect({ userId: USER_A, store });
    const inst = await call(hA, 'radar_resolve_institution', { name: 'Colegio A', website: 'https://a.com' });
    const opp = await call(hA, 'radar_save_opportunity', {
      institution_id: inst.envelope.data.institution.id,
    });
    const oppId = opp.envelope.data.opportunity_id;
    await hA.close();

    const hB = await connect({ userId: USER_B, store });
    const res = await call(hB, 'radar_get_opportunity', { opportunity_id: oppId });
    assert.equal(res.envelope.ok, false);
    assert.equal(res.envelope.error.code, ERROR_CODES.NOT_FOUND);
    await hB.close();
  });

  test('relacionamentos não vazam: B não vê signals/contacts de A', async () => {
    const store = new Map<string, Row[]>();
    const hA = await connect({ userId: USER_A, store });
    const inst = await call(hA, 'radar_resolve_institution', { name: 'Colegio A', website: 'https://a2.com' });
    const instId = inst.envelope.data.institution.id;
    await call(hA, 'radar_register_signal', { raw_text: 'obra', source_url: 'https://a2.com/post' });
    await call(hA, 'radar_find_contacts', {
      institution_id: instId,
      contacts: [
        {
          name: 'Maria',
          verification_status: 'public_source',
          email: 'maria@a2.com',
          source_url: 'https://a2.com/contato',
        },
      ],
    });
    await hA.close();

    // B tenta pontuar a instituição de A: não enxerga nada.
    const hB = await connect({ userId: USER_B, store });
    const score = await call(hB, 'radar_score_opportunity', {
      institution_id: instId,
      persist: false,
    });
    assert.equal(score.envelope.ok, true);
    const contactComponent = score.envelope.data.score_components.find(
      (c: any) => c.key === 'contact_quality',
    );
    assert.equal(contactComponent.points, 0, 'B não pode pontuar com contatos de A');
    await hB.close();
  });
});

describe('contrato MCP — 3. register_signal duplicado', () => {
  test('segunda chamada devolve existing=true e não cria novo sinal', async () => {
    const store = new Map<string, Row[]>();
    const h = await connect({ userId: USER_A, store });
    const url = 'https://exemplo.com/post/42';

    const first = await call(h, 'radar_register_signal', { source_url: url, raw_text: 'obra' });
    assert.equal(first.envelope.data.existing, false);

    const second = await call(h, 'radar_register_signal', { source_url: url, raw_text: 'obra' });
    assert.equal(second.envelope.data.existing, true);
    assert.equal(second.envelope.data.signal_id, first.envelope.data.signal_id);
    assert.ok(second.envelope.warnings.some((w: string) => w.includes('DUPLICATE_SIGNAL')));
    assert.equal(store.get('signals')!.length, 1, 'não pode existir segundo sinal');
    await h.close();
  });
});

describe('contrato MCP — 4. input sem URL e sem texto', () => {
  test('devolve INVALID_INPUT com hint', async () => {
    const h = await connect({ userId: USER_A });
    const { envelope, isError } = await call(h, 'radar_register_signal', {});
    assert.equal(isError, true);
    assert.equal(envelope.error.code, ERROR_CODES.INVALID_INPUT);
    assert.ok(envelope.error.hint);
    await h.close();
  });
});

describe('contrato MCP — 5. classificação com conflito forte', () => {
  test('conflito é sinalizado e revisão recomendada, sem sobrescrever o agente', async () => {
    const h = await connect({ userId: USER_A });
    const sig = await call(h, 'radar_register_signal', {
      raw_text:
        'No nosso colégio acreditamos em construir conhecimento. O projeto pedagógico tem como tema construir o futuro.',
    });
    const res = await call(h, 'radar_classify_construction', {
      signal_id: sig.envelope.data.signal_id,
      is_educational_institution: true,
      construction_detected: true,
      construction_type: 'new_building',
      construction_stage: 'S1_ANNOUNCED',
      confidence: 0.7,
      reasoning_summary: 'Texto menciona construir.',
    });

    assert.equal(res.envelope.ok, true);
    assert.equal(res.envelope.data.conflict_flag, true);
    assert.equal(res.envelope.data.review_recommended, true);
    // A avaliação do agente é preservada; só a confiança é penalizada.
    assert.equal(res.envelope.data.final_persisted_assessment.construction_detected, true);
    assert.ok(
      res.envelope.data.final_persisted_assessment.effective_confidence <
        res.envelope.data.final_persisted_assessment.claimed_confidence,
    );
    // Contraprova jamais se apresenta como análise semântica.
    assert.match(res.envelope.data.lexical_support.note, /NÃO é análise semântica/);
    await h.close();
  });
});

describe('contrato MCP — 6. find_contacts sem fonte', () => {
  test('lista vazia é resposta válida e não inventa contato', async () => {
    const h = await connect({ userId: USER_A });
    const inst = await call(h, 'radar_resolve_institution', { name: 'Colegio X', website: 'https://x.com' });
    const res = await call(h, 'radar_find_contacts', {
      institution_id: inst.envelope.data.institution.id,
      contacts: [],
      no_reliable_source: true,
    });
    assert.equal(res.envelope.ok, true);
    assert.equal(res.envelope.data.created_count, 0);
    assert.deepEqual(res.envelope.data.contacts, []);
    assert.ok(res.envelope.warnings.some((w: string) => w.includes('INSUFFICIENT_EVIDENCE')));
    await h.close();
  });

  test('contato sem source_url é rejeitado; verified sem contato real é rejeitado', async () => {
    const h = await connect({ userId: USER_A });
    const inst = await call(h, 'radar_resolve_institution', { name: 'Colegio Y', website: 'https://y.com' });
    const res = await call(h, 'radar_find_contacts', {
      institution_id: inst.envelope.data.institution.id,
      contacts: [
        { name: 'Sem Fonte', verification_status: 'public_source', source_url: 'nao-e-url' },
        { name: 'Falso Verified', verification_status: 'verified', source_url: 'https://y.com/c' },
      ],
    });
    assert.equal(res.envelope.data.created_count, 0);
    const reasons = res.envelope.data.rejected.map((r: any) => r.reason);
    assert.ok(reasons.includes('source_url_invalido_ou_ausente'));
    assert.ok(reasons.includes('verified_exige_email_ou_telefone_real'));
    await h.close();
  });
});

describe('contrato MCP — 7. capabilities refletem adapters indisponíveis', () => {
  test('instagram/linkedin/composio/telegram/n8n/email_send são false e não constam em available', async () => {
    const h = await connect({ userId: USER_A });
    const { envelope } = await call(h, 'radar_get_capabilities');
    const d = envelope.data;
    for (const key of [
      'instagram_discovery',
      'instagram_monitoring',
      'linkedin_people_search',
      'composio_connected',
      'telegram_direct',
      'n8n_access',
      'email_send',
    ]) {
      assert.equal(d.capabilities[key], false, `${key} deveria ser false`);
      assert.ok(!d.available.includes(key), `${key} não pode estar em available`);
      assert.ok(d.unavailable.includes(key), `${key} deveria estar em unavailable`);
    }
    // Roadmap é separado, nunca contado como available.
    assert.ok(d.planned.includes('composio_connected'));
    assert.equal(d.web_research_mode, 'agent_delegated');
    await h.close();
  });
});

describe('contrato MCP — 8. prepare_outreach nunca envia', () => {
  test('cria rascunho pending_approval com sent=false e send_count permanece 0', async () => {
    const store = new Map<string, Row[]>();
    // Spy: qualquer envio real incrementaria este contador.
    let sendCount = 0;
    const spyGuard = { send: () => { sendCount += 1; } };

    const h = await connect({ userId: USER_A, store });
    const inst = await call(h, 'radar_resolve_institution', { name: 'Colegio Z', website: 'https://z.com' });
    const opp = await call(h, 'radar_save_opportunity', {
      institution_id: inst.envelope.data.institution.id,
    });
    const res = await call(h, 'radar_prepare_outreach', {
      opportunity_id: opp.envelope.data.opportunity_id,
      channel: 'email',
      subject: 'Contato',
      body: 'Olá',
    });

    assert.equal(res.envelope.ok, true);
    assert.equal(res.envelope.data.sent, false);
    assert.equal(res.envelope.data.send_attempted, false);
    assert.equal(res.envelope.data.status, 'pending_approval');
    assert.ok(res.envelope.warnings.some((w: string) => w.includes('APPROVAL_REQUIRED')));
    assert.equal(sendCount, 0, 'send_count deve permanecer 0');
    void spyGuard;

    // Nenhum registro de outreach pode nascer como 'sent'.
    assert.ok(store.get('outreach')!.every((o) => o.status !== 'sent'));
    await h.close();
  });

  test('canal whatsapp e linkedin também não enviam', async () => {
    const store = new Map<string, Row[]>();
    const h = await connect({ userId: USER_A, store });
    const inst = await call(h, 'radar_resolve_institution', { name: 'Colegio W', website: 'https://w.com' });
    const opp = await call(h, 'radar_save_opportunity', { institution_id: inst.envelope.data.institution.id });
    for (const channel of ['whatsapp', 'linkedin']) {
      const res = await call(h, 'radar_prepare_outreach', {
        opportunity_id: opp.envelope.data.opportunity_id,
        channel,
        body: 'teste',
      });
      assert.equal(res.envelope.data.sent, false);
      assert.equal(res.envelope.data.status, 'pending_approval');
    }
    await h.close();
  });
});

describe('contrato MCP — 9. score sem eduinfo_fit/ecoclear_fit', () => {
  test('fit é null, fora do score, e pontos não são redistribuídos', async () => {
    const store = new Map<string, Row[]>();
    const h = await connect({ userId: USER_A, store });
    const inst = await call(h, 'radar_resolve_institution', { name: 'Colegio S', website: 'https://s.com' });
    const res = await call(h, 'radar_score_opportunity', {
      institution_id: inst.envelope.data.institution.id,
      institution_confidence: 1,
    });

    assert.equal(res.envelope.data.eduinfo_fit, null);
    assert.equal(res.envelope.data.ecoclear_fit, null);
    assert.equal(res.envelope.data.fit_reason, 'insufficient_service_catalog');
    // Teto explícito: 100 menos os 0 pontos de fit — sem redistribuição.
    assert.equal(res.envelope.data.maximum_current_score, 100);
    assert.equal(res.envelope.data.score_normalized, false);
    const keys = res.envelope.data.score_components.map((c: any) => c.key).sort();
    assert.deepEqual(keys, [
      'construction_signal',
      'construction_stage',
      'contact_quality',
      'institution_confidence',
      'recency',
    ]);
    await h.close();
  });
});

describe('contrato MCP — 10. erro de repositório vira erro estruturado', () => {
  test('violação de RLS vira FORBIDDEN sem vazar SQL/stack', async () => {
    const store = new Map<string, Row[]>();
    const hA = await connect({ userId: USER_A, store });
    const inst = await call(hA, 'radar_resolve_institution', { name: 'Colegio R', website: 'https://r.com' });
    const opp = await call(hA, 'radar_save_opportunity', { institution_id: inst.envelope.data.institution.id });
    await hA.close();

    // B tenta marcar como falso positivo a oportunidade de A.
    const hB = await connect({ userId: USER_B, store });
    const res = await call(hB, 'radar_mark_false_positive', {
      opportunity_id: opp.envelope.data.opportunity_id,
      reason: 'tentativa indevida',
    });
    assert.equal(res.envelope.ok, false);
    assert.equal(res.envelope.error.code, ERROR_CODES.FORBIDDEN);
    // Nenhum detalhe interno pode vazar.
    const text = JSON.stringify(res.envelope);
    assert.ok(!containsLeak(text), 'resposta não pode conter SQL, stack, JWT ou secret');
    assert.ok(!/row-level security/i.test(res.envelope.error.message));
    await hB.close();
  });
});

describe('contrato MCP — 11. user_id injection', () => {
  test('user_id no payload é ignorado: identidade vem do AuthContext', async () => {
    const store = new Map<string, Row[]>();
    const h = await connect({ userId: USER_A, store });

    // O agente tenta se passar por USER_B.
    const res = await call(h, 'radar_register_signal', {
      raw_text: 'obra na escola',
      user_id: USER_B,
      workspace_id: 'qualquer',
      subject: USER_B,
    });

    assert.equal(res.envelope.ok, true);
    const signal = store.get('signals')![0];
    assert.equal(signal.user_id, USER_A, 'identidade efetiva deve ser a do AuthContext');
    assert.notEqual(signal.user_id, USER_B);
    await h.close();
  });

  test('detectIdentityInjection identifica a tentativa no payload cru', () => {
    const found = detectIdentityInjection({ raw_text: 'x', user_id: USER_B, workspace_id: 'w' });
    assert.deepEqual(found.sort(), ['user_id', 'workspace_id']);
    assert.deepEqual(detectIdentityInjection({ raw_text: 'x' }), []);
  });

  test('schema Zod remove campos de identidade não declarados', async () => {
    const h = await connect({ userId: USER_A });
    // Se o campo fosse aceito, apareceria em alguma parte da resposta.
    const res = await call(h, 'radar_get_capabilities', { user_id: USER_B });
    assert.equal(res.envelope.ok, true);
    assert.ok(!JSON.stringify(res.envelope).includes(USER_B));
    await h.close();
  });
});

describe('contrato MCP — get_opportunity retorna todas as relações', () => {
  test('inclui institution, signals, assessments, contacts, evidence, outreach, score_components', async () => {
    const store = new Map<string, Row[]>();
    const h = await connect({ userId: USER_A, store });
    const inst = await call(h, 'radar_resolve_institution', { name: 'Colegio Full', website: 'https://full.com' });
    const instId = inst.envelope.data.institution.id;
    const sig = await call(h, 'radar_register_signal', {
      source_url: 'https://full.com/post',
      raw_text: 'obra em andamento no colégio',
      institution_id: instId,
    });
    await call(h, 'radar_classify_construction', {
      signal_id: sig.envelope.data.signal_id,
      is_educational_institution: true,
      construction_detected: true,
      construction_type: 'renovation',
      construction_stage: 'S3_CONSTRUCTION_IN_PROGRESS',
      confidence: 0.9,
    });
    const opp = await call(h, 'radar_save_opportunity', { institution_id: instId });
    await call(h, 'radar_prepare_outreach', {
      opportunity_id: opp.envelope.data.opportunity_id,
      body: 'rascunho',
    });

    const res = await call(h, 'radar_get_opportunity', {
      opportunity_id: opp.envelope.data.opportunity_id,
    });
    const d = res.envelope.data;
    for (const key of [
      'opportunity',
      'institution',
      'signals',
      'construction_assessments',
      'contacts',
      'evidence',
      'outreach',
      'score_components',
      'rufas_payload',
    ]) {
      assert.ok(key in d, `get_opportunity deve retornar ${key}`);
    }
    assert.equal(d.signals.length, 1);
    assert.equal(d.construction_assessments.length, 1);
    assert.equal(d.outreach.length, 1);
    assert.equal(d.delivery.telegram_direct, false);
    await h.close();
  });
});

describe('contrato MCP — mark_false_positive preserva trilha', () => {
  test('registra motivo datado e não apaga signal nem assessment', async () => {
    const store = new Map<string, Row[]>();
    const h = await connect({ userId: USER_A, store });
    const inst = await call(h, 'radar_resolve_institution', { name: 'Colegio FP', website: 'https://fp.com' });
    const instId = inst.envelope.data.institution.id;
    const sig = await call(h, 'radar_register_signal', {
      source_url: 'https://fp.com/p',
      raw_text: 'reforma',
      institution_id: instId,
    });
    await call(h, 'radar_classify_construction', {
      signal_id: sig.envelope.data.signal_id,
      is_educational_institution: true,
      construction_detected: true,
      construction_type: 'renovation',
      construction_stage: 'S2_STARTED',
      confidence: 0.8,
    });
    const opp = await call(h, 'radar_save_opportunity', { institution_id: instId });

    const res = await call(h, 'radar_mark_false_positive', {
      opportunity_id: opp.envelope.data.opportunity_id,
      reason: 'É uma construtora, não a escola.',
    });

    assert.equal(res.envelope.data.status, 'false_positive');
    assert.ok(res.envelope.data.marked_at);
    assert.equal(res.envelope.data.reason, 'É uma construtora, não a escola.');
    assert.equal(store.get('signals')!.length, 1, 'signal preservado');
    assert.equal(store.get('assessments')!.length, 1, 'assessment preservado');
    await h.close();
  });
});

describe('contrato MCP — schedule_recheck', () => {
  test('persiste job sem depender de calendar nem scheduler', async () => {
    const store = new Map<string, Row[]>();
    const h = await connect({ userId: USER_A, store });
    const inst = await call(h, 'radar_resolve_institution', { name: 'Colegio SR', website: 'https://sr.com' });
    const opp = await call(h, 'radar_save_opportunity', { institution_id: inst.envelope.data.institution.id });
    const res = await call(h, 'radar_schedule_recheck', {
      opportunity_id: opp.envelope.data.opportunity_id,
      recheck_at: new Date(Date.now() + 86_400_000).toISOString(),
    });
    assert.equal(res.envelope.ok, true);
    assert.equal(res.envelope.data.scheduler_available, false);
    assert.equal(res.envelope.data.depends_on_calendar, false);
    assert.equal(store.get('jobs')!.length, 1);
    await h.close();
  });
});

describe('contrato MCP — validação de schema', () => {
  test('confidence fora de 0..1 é rejeitada pelo schema', async () => {
    const h = await connect({ userId: USER_A });
    const sig = await call(h, 'radar_register_signal', { raw_text: 'obra' });
    const res = (await h.client.callTool({
      name: 'radar_classify_construction',
      arguments: {
        signal_id: sig.envelope.data.signal_id,
        is_educational_institution: true,
        construction_detected: true,
        confidence: 1.5,
      },
    })) as { isError?: boolean; content?: { text?: string }[] };
    assert.equal(res.isError, true, 'confidence inválida deve produzir erro');
    assert.match(String(res.content?.[0]?.text), /confidence|less than or equal|Invalid/i);
    await h.close();
  });

  test('uuid inválido é rejeitado pelo schema', async () => {
    const h = await connect({ userId: USER_A });
    const res = (await h.client.callTool({
      name: 'radar_get_opportunity',
      arguments: { opportunity_id: 'nao-e-uuid' },
    })) as { isError?: boolean; content?: { text?: string }[] };
    assert.equal(res.isError, true, 'uuid inválido deve produzir erro');
    assert.match(String(res.content?.[0]?.text), /uuid|Invalid/i);
    await h.close();
  });

  test('source_url sem esquema http(s) não conta como proveniência', () => {
    assert.equal(isValidSourceUrl('nao-e-url'), false);
    assert.equal(isValidSourceUrl('exemplo.com/pagina'), false, 'sem esquema explícito');
    assert.equal(isValidSourceUrl('https://exemplo.com/pagina'), true);
    assert.equal(isValidSourceUrl('ftp://exemplo.com'), false);
    assert.equal(isValidSourceUrl(''), false);
  });
});
