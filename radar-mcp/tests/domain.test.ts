/**
 * Testes do núcleo determinístico: classificação (contraprova), dedupe,
 * normalização, scoring, payload e barreiras de contato.
 *
 * Não tocam banco. A validação de RLS e persistência é feita pelos testes
 * de integração (integration.test.ts), que exigem Supabase configurado.
 */

import { strict as assert } from 'node:assert';
import { test, describe } from 'node:test';

import { crosscheckClassification, effectiveConfidence } from '../src/domain/classification.js';
import {
  contactDedupeKey,
  canAutoMerge,
  institutionDedupeKeys,
  signalDedupeKeys,
} from '../src/domain/dedupe.js';
import {
  extractDomain,
  normalizeInstagramUrl,
  normalizeInstitutionName,
  normalizeState,
  normalizeUrl,
} from '../src/domain/normalize.js';
import { scoreOpportunity, MAX_POINTS } from '../src/domain/scoring.js';
import { buildRufasPayload } from '../src/domain/payload.js';
import { getCapabilities } from '../src/capabilities.js';
import { CONTACT_FIXTURES, FIXTURES } from './fixtures.js';
import type { ConstructionAssessment, Contact, Institution, Opportunity } from '../src/types.js';

// ============================================================ CLASSIFICATION

describe('classification — contraprova léxica', () => {
  for (const fixture of FIXTURES) {
    test(`${fixture.id}: ${fixture.label}`, () => {
      const result = crosscheckClassification(fixture.raw_text, fixture.claim);
      if (fixture.expect_disagreements === 'none') {
        assert.deepEqual(
          result.disagreements,
          [],
          `esperava zero divergências, veio: ${result.disagreements.join(', ')}`,
        );
      } else {
        assert.ok(
          result.disagreements.length > 0,
          'esperava ao menos uma divergência apontada pela contraprova',
        );
      }
    });
  }

  test('f4: metáfora pedagógica é sinalizada explicitamente', () => {
    const f = FIXTURES.find((x) => x.id === 'f4_pedagogical_metaphor')!;
    const result = crosscheckClassification(f.raw_text, f.claim);
    assert.ok(
      result.disagreements.includes('metaphorical_construction_language_detected'),
      'deveria detectar linguagem metafórica de construção',
    );
    assert.equal(result.has_construction_lexicon, false);
  });

  test('f6: afirmar escola sem léxico educacional é sinalizado', () => {
    const f = FIXTURES.find((x) => x.id === 'f6_contractor_unclear_school')!;
    const result = crosscheckClassification(f.raw_text, f.claim);
    assert.ok(
      result.disagreements.includes(
        'agent_claims_educational_institution_but_no_education_lexicon_in_text',
      ),
    );
  });

  test('f8: alta confiança sem texto é sinalizada', () => {
    const f = FIXTURES.find((x) => x.id === 'f8_url_only_no_text')!;
    const result = crosscheckClassification(f.raw_text, f.claim);
    assert.ok(result.disagreements.includes('high_confidence_without_text_content'));
  });

  test('f9: estágio sem sustentação textual é sinalizado', () => {
    const f = FIXTURES.find((x) => x.id === 'f9_stage_not_supported')!;
    const result = crosscheckClassification(f.raw_text, f.claim);
    assert.ok(
      result.disagreements.some((d) => d.startsWith('claimed_stage_')),
      `esperava divergência de estágio, veio: ${result.disagreements.join(', ')}`,
    );
  });

  test('confiança efetiva só diminui, nunca aumenta', () => {
    const clean = crosscheckClassification('reforma da escola em andamento', {
      is_educational_institution: true,
      construction_detected: true,
      construction_type: 'renovation',
      construction_stage: 'S3_CONSTRUCTION_IN_PROGRESS',
      confidence: 0.9,
    });
    assert.equal(effectiveConfidence(0.9, clean), 0.9);

    const dirty = { ...clean, disagreements: ['a', 'b'] };
    assert.ok(effectiveConfidence(0.9, dirty) < 0.9);
    assert.ok(effectiveConfidence(0.1, { ...clean, disagreements: ['a', 'b', 'c'] }) >= 0);
  });
});

// ============================================================ NORMALIZAÇÃO

describe('normalização', () => {
  test('nome institucional ignora acento, caixa e pontuação', () => {
    assert.equal(
      normalizeInstitutionName('Colégio São José - Unidade Centro'),
      normalizeInstitutionName('colegio sao jose unidade centro'),
    );
  });

  test('domínio remove www, protocolo e porta', () => {
    assert.equal(extractDomain('https://www.Colegio.com.br/contato'), 'colegio.com.br');
    assert.equal(extractDomain('colegio.com.br'), 'colegio.com.br');
    assert.equal(extractDomain('não é url'), null);
    assert.equal(extractDomain(null), null);
  });

  test('instagram normaliza handle, URL e ignora rota de post', () => {
    const expected = 'https://instagram.com/colegioexemplo';
    assert.equal(normalizeInstagramUrl('@colegioexemplo'), expected);
    assert.equal(normalizeInstagramUrl('instagram.com/colegioexemplo/'), expected);
    assert.equal(normalizeInstagramUrl('https://www.instagram.com/colegioexemplo?hl=pt'), expected);
    assert.equal(normalizeInstagramUrl('https://instagram.com/p/ABC123'), null);
  });

  test('URL remove utm e hash', () => {
    assert.equal(
      normalizeUrl('https://exemplo.com/post?utm_source=ig&id=5#top'),
      'https://exemplo.com/post?id=5',
    );
  });

  test('UF aceita sigla e nome por extenso', () => {
    assert.equal(normalizeState('sp'), 'SP');
    assert.equal(normalizeState('São Paulo'), 'SP');
    assert.equal(normalizeState('Rio de Janeiro'), 'RJ');
    assert.equal(normalizeState('desconhecido'), null);
  });
});

// ================================================================== DEDUPE

describe('dedupe', () => {
  test('domínio e instagram são chaves fortes; nome+cidade+UF é fraca', () => {
    const keys = institutionDedupeKeys({
      name: 'Colégio Exemplo',
      website: 'https://colegioexemplo.com.br',
      instagram_url: '@colegioexemplo',
      city: 'Campinas',
      state: 'SP',
    });
    const byField = Object.fromEntries(keys.map((k) => [k.field, k]));
    assert.equal(byField.domain?.strength, 'strong');
    assert.equal(byField.instagram_url?.strength, 'strong');
    assert.equal(byField.normalized_name_city_state?.strength, 'weak');
  });

  test('merge automático só é permitido em chave forte', () => {
    assert.equal(canAutoMerge({ field: 'domain', value: 'x', strength: 'strong' }), true);
    assert.equal(
      canAutoMerge({ field: 'normalized_name_city_state', value: 'x', strength: 'weak' }),
      false,
    );
    assert.equal(canAutoMerge(null), false);
  });

  test('sinal duplicado pela mesma URL gera a mesma chave (f7)', () => {
    const a = signalDedupeKeys({ source_url: 'https://exemplo.com/post/1' });
    const b = signalDedupeKeys({ source_url: 'https://exemplo.com/post/1?utm_source=x' });
    assert.equal(a[0]?.value, b[0]?.value);
    assert.equal(a[0]?.strength, 'strong');
  });

  test('contato deduplica por nome normalizado dentro da instituição', () => {
    const a = contactDedupeKey('inst-1', 'Maria Souza');
    const b = contactDedupeKey('inst-1', 'maria  souza');
    assert.equal(a?.value, b?.value);
    assert.equal(contactDedupeKey('inst-1', '   '), null);
  });
});

// ================================================================= SCORING

const baseAssessment = (over: Partial<ConstructionAssessment> = {}): ConstructionAssessment => ({
  id: 'a1',
  user_id: 'u1',
  signal_id: 's1',
  construction_detected: true,
  construction_type: 'new_block',
  construction_stage: 'S3_CONSTRUCTION_IN_PROGRESS',
  description: null,
  confidence: 0.9,
  reasoning_summary: null,
  is_educational_institution: true,
  lexical_crosscheck: {
    construction_terms: ['obra'],
    education_terms: ['colégio'],
    stage_hints: {},
    type_hints: {},
    has_construction_lexicon: true,
    has_education_lexicon: true,
    disagreements: [],
  },
  created_at: new Date().toISOString(),
  ...over,
});

describe('scoring', () => {
  test('score fica em 0–100 e fit permanece null', () => {
    const r = scoreOpportunity({
      assessment: baseAssessment(),
      referenceDate: new Date().toISOString(),
      institutionConfidence: 1,
      contacts: [{ verification_status: 'public_source', email: 'contato@x.com', phone: null }],
    });
    assert.ok(r.score >= 0 && r.score <= 100);
    assert.equal(r.eduinfo_fit, null);
    assert.equal(r.ecoclear_fit, null);
    assert.equal(r.fit_reason, 'insufficient_service_catalog');
    assert.match(r.explanation, /insufficient_service_catalog/);
  });

  test('sinal sem obra detectada zera evidência e estágio', () => {
    const r = scoreOpportunity({
      assessment: baseAssessment({ construction_detected: false }),
      referenceDate: new Date().toISOString(),
      institutionConfidence: 1,
      contacts: [],
    });
    const byKey = Object.fromEntries(r.components.map((c) => [c.key, c.points]));
    assert.equal(byKey.construction_signal, 0);
    assert.equal(byKey.construction_stage, 0);
  });

  test('sinal antigo pontua menos que sinal recente', () => {
    const common = { assessment: baseAssessment(), institutionConfidence: 1, contacts: [] };
    const recent = scoreOpportunity({ ...common, referenceDate: new Date().toISOString() });
    const old = scoreOpportunity({
      ...common,
      referenceDate: new Date(Date.now() - 400 * 86_400_000).toISOString(),
    });
    assert.ok(recent.score > old.score);
  });

  test('divergências léxicas reduzem os pontos de evidência', () => {
    const dirty = baseAssessment();
    dirty.lexical_crosscheck.disagreements = ['x', 'y'];
    const clean = scoreOpportunity({
      assessment: baseAssessment(),
      referenceDate: new Date().toISOString(),
      institutionConfidence: 1,
      contacts: [],
    });
    const penalized = scoreOpportunity({
      assessment: dirty,
      referenceDate: new Date().toISOString(),
      institutionConfidence: 1,
      contacts: [],
    });
    assert.ok(penalized.score < clean.score);
  });

  test('contato sem e-mail nem telefone não pontua', () => {
    const r = scoreOpportunity({
      assessment: baseAssessment(),
      referenceDate: new Date().toISOString(),
      institutionConfidence: 1,
      contacts: [{ verification_status: 'verified', email: null, phone: null }],
    });
    const contact = r.components.find((c) => c.key === 'contact_quality')!;
    assert.equal(contact.points, 0);
    assert.equal(contact.max, MAX_POINTS.contact_quality);
  });

  test('estágio S6 (concluído) vale menos que S3 (em andamento)', () => {
    const mk = (stage: ConstructionAssessment['construction_stage']) =>
      scoreOpportunity({
        assessment: baseAssessment({ construction_stage: stage }),
        referenceDate: new Date().toISOString(),
        institutionConfidence: 1,
        contacts: [],
      }).score;
    assert.ok(mk('S3_CONSTRUCTION_IN_PROGRESS') > mk('S6_COMPLETED'));
  });
});

// ================================================================= PAYLOAD

describe('payload do Rufas', () => {
  const institution: Institution = {
    id: 'i1', user_id: 'u1', name: 'Colégio Exemplo',
    normalized_name: 'colegio exemplo', legal_name: null,
    website: 'https://colegioexemplo.com.br', domain: 'colegioexemplo.com.br',
    instagram_url: null, linkedin_url: null, city: 'campinas', state: 'SP',
    phone: null, metadata: {}, created_at: '', updated_at: '',
  };
  const opportunity: Opportunity = {
    id: 'o1', user_id: 'u1', institution_id: 'i1', status: 'new', score: 72,
    score_components: {}, score_explanation: null, eduinfo_fit: null,
    ecoclear_fit: null, created_at: '', updated_at: '',
  };
  const contact = (over: Partial<Contact> = {}): Contact => ({
    id: 'c1', user_id: 'u1', institution_id: 'i1', name: 'Maria Souza',
    role: 'Diretora', organization: null, email: 'maria@colegioexemplo.com.br',
    phone: null, linkedin_url: null, instagram_url: null,
    verification_status: 'public_source', confidence: 0.8,
    opt_out_status: false, created_at: '', updated_at: '', ...over,
  });

  test('inclui fit_status explícito e nunca inventa fit', () => {
    const p = buildRufasPayload({
      opportunity, institution, assessment: baseAssessment(),
      contacts: [contact()], sourceUrls: ['https://exemplo.com/post/1'],
    });
    assert.equal(p.fit_status.eduinfo_fit, null);
    assert.equal(p.fit_status.reason, 'insufficient_service_catalog');
    assert.equal(p.score, 72);
    assert.deepEqual(p.recommended_actions, [
      'investigate', 'convert_to_lead', 'prepare_outreach', 'discard', 'recheck',
    ]);
  });

  test('contato com opt-out não entra no payload', () => {
    const p = buildRufasPayload({
      opportunity, institution, assessment: baseAssessment(),
      contacts: [contact({ opt_out_status: true })], sourceUrls: [],
    });
    assert.equal(p.contacts.length, 0);
  });

  test('divergências da contraprova aparecem no resumo de evidência', () => {
    const a = baseAssessment();
    a.lexical_crosscheck.disagreements = ['metaphorical_construction_language_detected'];
    const p = buildRufasPayload({
      opportunity, institution, assessment: a, contacts: [], sourceUrls: [],
    });
    assert.match(p.evidence_summary, /Ressalvas da contraprova/);
  });

  test('URLs duplicadas são deduplicadas', () => {
    const p = buildRufasPayload({
      opportunity, institution, assessment: null, contacts: [],
      sourceUrls: ['https://a.com/1', 'https://a.com/1', ''],
    });
    assert.deepEqual(p.source_urls, ['https://a.com/1']);
  });
});

// ============================================================ CAPABILITIES

describe('capabilities refletem a realidade', () => {
  test('Instagram, LinkedIn, Composio, Telegram e n8n são false', () => {
    const c = getCapabilities({ supabaseConfigured: true });
    assert.equal(c.instagram_post_read, false);
    assert.equal(c.instagram_discovery, false);
    assert.equal(c.instagram_monitoring, false);
    assert.equal(c.linkedin_company_lookup, false);
    assert.equal(c.linkedin_people_search, false);
    assert.equal(c.linkedin_profile_read, false);
    assert.equal(c.composio_connected, false);
    assert.equal(c.telegram_direct, false);
    assert.equal(c.n8n_access, false);
  });

  test('envio de e-mail é sempre false nesta fase', () => {
    assert.equal(getCapabilities({ supabaseConfigured: true }).email_send, false);
  });

  test('supabase_storage acompanha a configuração real', () => {
    assert.equal(getCapabilities({ supabaseConfigured: false }).supabase_storage, false);
    assert.equal(getCapabilities({ supabaseConfigured: true }).supabase_storage, true);
  });
});

// ======================================================= CONTACT BOUNDARIES

describe('barreiras de verificação de contato (regras aplicadas na tool)', () => {
  test('c1: contato sem source_url válido é rejeitado', () => {
    const f = CONTACT_FIXTURES.find((x) => x.id === 'c1_no_source')!;
    assert.equal(normalizeUrl(f.contact.source_url), null);
    assert.equal(f.expect_rejected, true);
  });

  test('c2: verified sem e-mail nem telefone é rejeitado', () => {
    const f = CONTACT_FIXTURES.find((x) => x.id === 'c2_inferred_email')!;
    const invalid =
      f.contact.verification_status === 'verified' && !f.contact.email && !f.contact.phone;
    assert.equal(invalid, true);
    assert.equal(f.expect_rejected, true);
  });
});
