/**
 * Payload estruturado para o Rufas notificar no Telegram.
 *
 * O Radar NÃO envia Telegram. Ele devolve este objeto; o Rufas renderiza.
 * Nenhuma infraestrutura de rede é criada aqui.
 */

import type {
  ConstructionAssessment,
  Contact,
  Institution,
  Opportunity,
  RecommendedAction,
} from '../types.js';

export interface RufasContactPayload {
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  verification_status: Contact['verification_status'];
}

export interface RufasNotificationPayload {
  opportunity_id: string;
  institution_name: string;
  city: string | null;
  state: string | null;
  score: number | null;
  construction_type: string | null;
  construction_stage: string | null;
  confidence: number | null;
  evidence_summary: string;
  contacts: RufasContactPayload[];
  source_urls: string[];
  recommended_actions: RecommendedAction[];
  /** Sempre presente: deixa explícito que fit é hipótese não calculada. */
  fit_status: {
    eduinfo_fit: null;
    ecoclear_fit: null;
    reason: 'insufficient_service_catalog';
  };
}

export interface BuildPayloadInput {
  opportunity: Opportunity;
  institution: Institution;
  assessment: ConstructionAssessment | null;
  contacts: Contact[];
  sourceUrls: string[];
}

export function buildRufasPayload(input: BuildPayloadInput): RufasNotificationPayload {
  const { opportunity, institution, assessment, contacts, sourceUrls } = input;

  const evidenceParts: string[] = [];
  if (assessment) {
    evidenceParts.push(
      assessment.construction_detected
        ? `Obra detectada: ${assessment.construction_type}, estágio ${assessment.construction_stage}.`
        : 'Nenhuma obra confirmada a partir do sinal analisado.',
    );
    if (assessment.description) evidenceParts.push(assessment.description);
    if (assessment.reasoning_summary) evidenceParts.push(assessment.reasoning_summary);
    const dis = assessment.lexical_crosscheck?.disagreements ?? [];
    if (dis.length) {
      evidenceParts.push(`Ressalvas da contraprova léxica: ${dis.join('; ')}.`);
    }
  } else {
    evidenceParts.push('Sinal ainda não classificado.');
  }

  return {
    opportunity_id: opportunity.id,
    institution_name: institution.name,
    city: institution.city,
    state: institution.state,
    score: opportunity.score,
    construction_type: assessment?.construction_type ?? null,
    construction_stage: assessment?.construction_stage ?? null,
    confidence: assessment?.confidence ?? null,
    evidence_summary: evidenceParts.join(' '),
    contacts: contacts
      // Contato sem qualquer fonte de contato utilizável não é acionável.
      .filter((c) => !c.opt_out_status)
      .map((c) => ({
        name: c.name,
        role: c.role,
        email: c.email,
        phone: c.phone,
        linkedin_url: c.linkedin_url,
        verification_status: c.verification_status,
      })),
    source_urls: [...new Set(sourceUrls.filter(Boolean))],
    recommended_actions: [
      'investigate',
      'convert_to_lead',
      'prepare_outreach',
      'discard',
      'recheck',
    ],
    fit_status: {
      eduinfo_fit: null,
      ecoclear_fit: null,
      reason: 'insufficient_service_catalog',
    },
  };
}
