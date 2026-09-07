/**
 * CONTRAPROVA léxica da classificação.
 *
 * Regra de arquitetura: a decisão semântica ("é escola?", "há obra?", "qual
 * estágio?") é do AGENTE, que a envia como input de `radar.classify_construction`.
 * Este módulo não decide — ele confere. Ele extrai evidência textual concreta e
 * lista divergências entre o que o agente afirmou e o que o texto sustenta.
 *
 * Isso atende "não depender somente de keyword" sem fingir que regex faz
 * julgamento semântico.
 */

import {
  CONSTRUCTION_TERMS,
  EDUCATION_TERMS,
  METAPHOR_TERMS,
  STAGE_HINTS,
  TYPE_HINTS,
} from './vocabulary.js';
import { foldText } from './normalize.js';
import type {
  ConstructionStage,
  ConstructionType,
  LexicalCrosscheck,
} from '../types.js';

/** Termos do vocabulário efetivamente presentes no texto. */
function matchTerms(folded: string, terms: readonly string[]): string[] {
  return terms.filter((term) => folded.includes(foldText(term)));
}

export interface AgentClaim {
  is_educational_institution: boolean;
  construction_detected: boolean;
  construction_type: ConstructionType;
  construction_stage: ConstructionStage;
  confidence: number;
}

/**
 * Confere a afirmação do agente contra o texto bruto.
 * Nunca sobrescreve a decisão do agente — apenas registra o que não se sustenta.
 */
export function crosscheckClassification(
  rawText: string | null | undefined,
  claim: AgentClaim,
): LexicalCrosscheck {
  const folded = foldText(rawText ?? '');
  const disagreements: string[] = [];

  const educationTerms = matchTerms(folded, EDUCATION_TERMS);
  const metaphorTerms = matchTerms(folded, METAPHOR_TERMS);

  const stageHints: Partial<Record<ConstructionStage, string[]>> = {};
  for (const [stage, terms] of Object.entries(STAGE_HINTS)) {
    const hits = matchTerms(folded, terms);
    if (hits.length) stageHints[stage as ConstructionStage] = hits;
  }

  const typeHints: Partial<Record<ConstructionType, string[]>> = {};
  for (const [type, terms] of Object.entries(TYPE_HINTS)) {
    const hits = matchTerms(folded, terms);
    if (hits.length) typeHints[type as ConstructionType] = hits;
  }

  // Evidência de intervenção física = vocabulário principal de obra UNIDO às
  // pistas de tipo. Sem essa união, um caso legítimo de `maintenance`
  // ("pintura das salas", "pequenos reparos") seria acusado de não ter léxico
  // de obra, já que esses termos vivem apenas em TYPE_HINTS.
  const constructionTerms = [
    ...new Set([
      ...matchTerms(folded, CONSTRUCTION_TERMS),
      ...Object.values(typeHints).flat(),
    ]),
  ];

  const hasText = folded.trim().length > 0;

  // Divergência 1: afirma obra sem nenhum termo de obra no texto.
  if (claim.construction_detected && hasText && constructionTerms.length === 0) {
    disagreements.push(
      'agent_claims_construction_but_no_construction_lexicon_in_text',
    );
  }

  // Divergência 2: afirma escola sem nenhum termo educacional no texto.
  if (claim.is_educational_institution && hasText && educationTerms.length === 0) {
    disagreements.push(
      'agent_claims_educational_institution_but_no_education_lexicon_in_text',
    );
  }

  // Divergência 3: uso metafórico de "construir" com obra afirmada e sem
  // termo físico de obra. É o caso "projeto pedagógico de construir cidadania".
  if (
    claim.construction_detected &&
    metaphorTerms.length > 0 &&
    constructionTerms.length === 0
  ) {
    disagreements.push('metaphorical_construction_language_detected');
  }

  // Divergência 4: estágio afirmado sem qualquer pista textual, quando o texto
  // traz pistas de OUTRO estágio.
  const claimedStageHasHint = Boolean(stageHints[claim.construction_stage]?.length);
  const someOtherStageHasHint = Object.keys(stageHints).length > 0;
  if (claim.construction_detected && !claimedStageHasHint && someOtherStageHasHint) {
    disagreements.push(
      `claimed_stage_${claim.construction_stage}_not_supported_by_text_hints`,
    );
  }

  // Divergência 5: tipo afirmado sem pista, havendo pista de outro tipo.
  const claimedTypeHasHint = Boolean(typeHints[claim.construction_type]?.length);
  const someOtherTypeHasHint = Object.keys(typeHints).length > 0;
  if (
    claim.construction_detected &&
    claim.construction_type !== 'unknown' &&
    !claimedTypeHasHint &&
    someOtherTypeHasHint
  ) {
    disagreements.push(
      `claimed_type_${claim.construction_type}_not_supported_by_text_hints`,
    );
  }

  // Divergência 6: alta confiança declarada sobre texto ausente.
  if (!hasText && claim.confidence > 0.5) {
    disagreements.push('high_confidence_without_text_content');
  }

  return {
    construction_terms: constructionTerms,
    education_terms: educationTerms,
    stage_hints: stageHints,
    type_hints: typeHints,
    has_construction_lexicon: constructionTerms.length > 0,
    has_education_lexicon: educationTerms.length > 0,
    disagreements,
  };
}

/**
 * Confiança efetiva persistida: a do agente, penalizada por cada divergência.
 * Nunca aumenta a confiança do agente — só reduz.
 */
export function effectiveConfidence(
  claimed: number,
  crosscheck: LexicalCrosscheck,
): number {
  const penalty = crosscheck.disagreements.length * 0.15;
  const value = Math.max(0, Math.min(1, claimed - penalty));
  return Number(value.toFixed(3));
}
