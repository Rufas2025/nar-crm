/**
 * Tipos de domínio do Radar. Espelham exatamente os enums da migration
 * 20260907120000_radar_core.sql — qualquer divergência quebra a persistência.
 */

export const CONSTRUCTION_TYPES = [
  'renovation',
  'expansion',
  'new_building',
  'new_block',
  'new_unit',
  'modernization',
  'maintenance',
  'unknown',
] as const;
export type ConstructionType = (typeof CONSTRUCTION_TYPES)[number];

export const CONSTRUCTION_STAGES = [
  'S0_VAGUE_SIGNAL',
  'S1_ANNOUNCED',
  'S2_STARTED',
  'S3_CONSTRUCTION_IN_PROGRESS',
  'S4_FINISHING',
  'S5_OPENING_SOON',
  'S6_COMPLETED',
] as const;
export type ConstructionStage = (typeof CONSTRUCTION_STAGES)[number];

export const VERIFICATION_STATUSES = [
  'verified',
  'public_source',
  'inferred',
  'unverified',
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const OPPORTUNITY_STATUSES = [
  'new',
  'investigating',
  'lead',
  'outreach_prepared',
  'discarded',
  'false_positive',
  'recheck_scheduled',
] as const;
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export const OUTREACH_CHANNELS = ['email', 'whatsapp', 'linkedin', 'phone'] as const;
export type OutreachChannel = (typeof OUTREACH_CHANNELS)[number];

export const OUTREACH_STATUSES = [
  'draft',
  'pending_approval',
  'approved',
  'sent',
  'cancelled',
] as const;
export type OutreachStatus = (typeof OUTREACH_STATUSES)[number];

/** Estado do conteúdo de um sinal recém-registrado. */
export type ContentStatus =
  | 'content_available'
  | 'url_only'
  | 'manual_text'
  | 'fetch_failed';

/** Ações que o humano pode tomar sobre uma oportunidade notificada. */
export const RECOMMENDED_ACTIONS = [
  'investigate',
  'convert_to_lead',
  'prepare_outreach',
  'discard',
  'recheck',
] as const;
export type RecommendedAction = (typeof RECOMMENDED_ACTIONS)[number];

export interface Institution {
  id: string;
  user_id: string;
  name: string;
  normalized_name: string;
  legal_name: string | null;
  website: string | null;
  domain: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Signal {
  id: string;
  user_id: string;
  institution_id: string | null;
  source: string;
  source_url: string | null;
  source_external_id: string | null;
  raw_text: string | null;
  published_at: string | null;
  detected_at: string;
  signal_type: string | null;
  confidence: number | null;
  raw_metadata: Record<string, unknown>;
  created_at: string;
}

export interface ConstructionAssessment {
  id: string;
  user_id: string;
  signal_id: string;
  construction_detected: boolean;
  construction_type: ConstructionType;
  construction_stage: ConstructionStage;
  description: string | null;
  confidence: number;
  reasoning_summary: string | null;
  is_educational_institution: boolean | null;
  lexical_crosscheck: LexicalCrosscheck;
  created_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  institution_id: string;
  name: string;
  role: string | null;
  organization: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  verification_status: VerificationStatus;
  confidence: number | null;
  opt_out_status: boolean;
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: string;
  user_id: string;
  institution_id: string;
  status: OpportunityStatus;
  score: number | null;
  score_components: Record<string, unknown>;
  score_explanation: string | null;
  eduinfo_fit: unknown | null;
  ecoclear_fit: unknown | null;
  created_at: string;
  updated_at: string;
}

/**
 * Resultado da checagem léxica determinística. Serve como CONTRAPROVA da
 * análise semântica do agente — nunca como classificação isolada.
 */
export interface LexicalCrosscheck {
  construction_terms: string[];
  education_terms: string[];
  stage_hints: Partial<Record<ConstructionStage, string[]>>;
  type_hints: Partial<Record<ConstructionType, string[]>>;
  has_construction_lexicon: boolean;
  has_education_lexicon: boolean;
  /** Divergências entre o que o agente afirmou e o que o texto sustenta. */
  disagreements: string[];
}

export interface ScoreComponent {
  key: string;
  points: number;
  max: number;
  reason: string;
}

export interface ScoreResult {
  score: number;
  components: ScoreComponent[];
  explanation: string;
  /** Sempre null nesta fase — ver decisão G3. */
  eduinfo_fit: null;
  ecoclear_fit: null;
  fit_reason: 'insufficient_service_catalog';
}
