/**
 * Scoring determinístico 0–100.
 *
 * Só entram componentes VERIFICÁVEIS a partir do que foi persistido.
 * `eduinfo_fit` e `ecoclear_fit` ficam fora do score e retornam null enquanto
 * não houver catálogo comercial (decisão G3) — os 25 pontos que eles ocupariam
 * não são redistribuídos, para que o score não infle artificialmente.
 */

import type {
  ConstructionAssessment,
  ConstructionStage,
  Contact,
  ScoreComponent,
  ScoreResult,
} from '../types.js';

/** Pesos por estágio: quanto mais perto da obra real, mais relevante comercialmente. */
const STAGE_WEIGHT: Record<ConstructionStage, number> = {
  S0_VAGUE_SIGNAL: 0.1,
  S1_ANNOUNCED: 0.6,
  S2_STARTED: 0.9,
  S3_CONSTRUCTION_IN_PROGRESS: 1.0,
  S4_FINISHING: 0.85,
  S5_OPENING_SOON: 0.7,
  S6_COMPLETED: 0.2,
};

const VERIFICATION_WEIGHT: Record<Contact['verification_status'], number> = {
  verified: 1.0,
  public_source: 0.8,
  inferred: 0.3,
  unverified: 0.1,
};

export const MAX_POINTS = {
  construction_signal: 30,
  recency: 20,
  construction_stage: 15,
  institution_confidence: 20,
  contact_quality: 15,
} as const;

export interface ScoringInput {
  assessment: ConstructionAssessment | null;
  /** Data de publicação do sinal; cai para detected_at quando ausente. */
  referenceDate: string | null;
  /** Confiança de que a instituição foi resolvida corretamente (0–1). */
  institutionConfidence: number;
  contacts: Pick<Contact, 'verification_status' | 'email' | 'phone'>[];
  now?: Date;
}

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, (to.getTime() - from.getTime()) / 86_400_000);
}

export function scoreOpportunity(input: ScoringInput): ScoreResult {
  const now = input.now ?? new Date();
  const components: ScoreComponent[] = [];

  // ---- 1. Força da evidência de obra (30) ----
  const a = input.assessment;
  if (!a || !a.construction_detected) {
    components.push({
      key: 'construction_signal',
      points: 0,
      max: MAX_POINTS.construction_signal,
      reason: a
        ? 'nenhuma obra detectada na avaliação do sinal'
        : 'sinal ainda não classificado',
    });
  } else {
    const penalty = a.lexical_crosscheck?.disagreements?.length ?? 0;
    const quality = Math.max(0, a.confidence - penalty * 0.1);
    const pts = Math.round(quality * MAX_POINTS.construction_signal);
    components.push({
      key: 'construction_signal',
      points: pts,
      max: MAX_POINTS.construction_signal,
      reason:
        penalty > 0
          ? `obra detectada (confiança ${a.confidence}), reduzida por ${penalty} divergência(s) léxica(s)`
          : `obra detectada com confiança ${a.confidence} e evidência textual consistente`,
    });
  }

  // ---- 2. Recência (20) ----
  if (!input.referenceDate) {
    components.push({
      key: 'recency',
      points: 0,
      max: MAX_POINTS.recency,
      reason: 'sem data de publicação ou detecção',
    });
  } else {
    const age = daysBetween(new Date(input.referenceDate), now);
    let ratio: number;
    let label: string;
    if (age <= 30) { ratio = 1.0; label = 'até 30 dias'; }
    else if (age <= 90) { ratio = 0.7; label = 'entre 31 e 90 dias'; }
    else if (age <= 180) { ratio = 0.4; label = 'entre 91 e 180 dias'; }
    else if (age <= 365) { ratio = 0.2; label = 'entre 181 e 365 dias'; }
    else { ratio = 0.05; label = 'mais de 365 dias'; }
    components.push({
      key: 'recency',
      points: Math.round(ratio * MAX_POINTS.recency),
      max: MAX_POINTS.recency,
      reason: `sinal com ${Math.round(age)} dia(s) — ${label}`,
    });
  }

  // ---- 3. Estágio comercialmente relevante (15) ----
  if (!a || !a.construction_detected) {
    components.push({
      key: 'construction_stage',
      points: 0,
      max: MAX_POINTS.construction_stage,
      reason: 'estágio indeterminado sem obra confirmada',
    });
  } else {
    const w = STAGE_WEIGHT[a.construction_stage];
    components.push({
      key: 'construction_stage',
      points: Math.round(w * MAX_POINTS.construction_stage),
      max: MAX_POINTS.construction_stage,
      reason: `estágio ${a.construction_stage} (peso ${w})`,
    });
  }

  // ---- 4. Confiança na identificação da instituição (20) ----
  const ic = Math.max(0, Math.min(1, input.institutionConfidence));
  components.push({
    key: 'institution_confidence',
    points: Math.round(ic * MAX_POINTS.institution_confidence),
    max: MAX_POINTS.institution_confidence,
    reason: `instituição identificada com confiança ${ic.toFixed(2)}`,
  });

  // ---- 5. Qualidade dos contatos (15) ----
  const usable = input.contacts.filter((c) => c.email || c.phone);
  if (usable.length === 0) {
    components.push({
      key: 'contact_quality',
      points: 0,
      max: MAX_POINTS.contact_quality,
      reason: 'nenhum contato com e-mail ou telefone',
    });
  } else {
    const best = Math.max(...usable.map((c) => VERIFICATION_WEIGHT[c.verification_status]));
    const volume = Math.min(1, usable.length / 3);
    const ratio = best * (0.7 + 0.3 * volume);
    components.push({
      key: 'contact_quality',
      points: Math.round(ratio * MAX_POINTS.contact_quality),
      max: MAX_POINTS.contact_quality,
      reason: `${usable.length} contato(s) utilizável(is), melhor verificação com peso ${best}`,
    });
  }

  const score = components.reduce((sum, c) => sum + c.points, 0);

  const explanation = [
    `score ${score}/100`,
    ...components.map((c) => `- ${c.key}: ${c.points}/${c.max} — ${c.reason}`),
    '- eduinfo_fit e ecoclear_fit: fora do score (insufficient_service_catalog)',
  ].join('\n');

  return {
    score,
    components,
    explanation,
    eduinfo_fit: null,
    ecoclear_fit: null,
    fit_reason: 'insufficient_service_catalog',
  };
}
