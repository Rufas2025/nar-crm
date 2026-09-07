-- Radar Eduinfo + Eco Clear — núcleo relacional (Fase 2)
-- Escopo: qualificação de sinais manuais de obra em colégios particulares.
-- Sem discovery automático, sem Instagram/LinkedIn, sem envio de outreach.
--
-- Padrão de auth: idêntico ao restante do projeto — RLS por auth.uid() = user_id.

-- ============================================================ ENUMS

CREATE TYPE public.radar_construction_type AS ENUM (
  'renovation', 'expansion', 'new_building', 'new_block',
  'new_unit', 'modernization', 'maintenance', 'unknown'
);

CREATE TYPE public.radar_construction_stage AS ENUM (
  'S0_VAGUE_SIGNAL', 'S1_ANNOUNCED', 'S2_STARTED',
  'S3_CONSTRUCTION_IN_PROGRESS', 'S4_FINISHING',
  'S5_OPENING_SOON', 'S6_COMPLETED'
);

CREATE TYPE public.radar_verification_status AS ENUM (
  'verified', 'public_source', 'inferred', 'unverified'
);

CREATE TYPE public.radar_opportunity_status AS ENUM (
  'new', 'investigating', 'lead', 'outreach_prepared',
  'discarded', 'false_positive', 'recheck_scheduled'
);

CREATE TYPE public.radar_outreach_channel AS ENUM ('email', 'whatsapp', 'linkedin', 'phone');

CREATE TYPE public.radar_outreach_status AS ENUM (
  'draft', 'pending_approval', 'approved', 'sent', 'cancelled'
);

CREATE TYPE public.radar_job_status AS ENUM ('pending', 'running', 'completed', 'failed');

-- ============================================================ INSTITUTIONS

CREATE TABLE public.radar_institutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  legal_name TEXT,
  website TEXT,
  domain TEXT,
  instagram_url TEXT,
  linkedin_url TEXT,
  city TEXT,
  state TEXT,
  phone TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dedupe: domínio institucional é a chave mais forte quando existe.
CREATE UNIQUE INDEX radar_institutions_user_domain_key
  ON public.radar_institutions (user_id, domain) WHERE domain IS NOT NULL;
-- Dedupe: instagram normalizado.
CREATE UNIQUE INDEX radar_institutions_user_instagram_key
  ON public.radar_institutions (user_id, instagram_url) WHERE instagram_url IS NOT NULL;
-- Dedupe: nome normalizado + cidade + UF.
CREATE UNIQUE INDEX radar_institutions_user_name_city_state_key
  ON public.radar_institutions (user_id, normalized_name, COALESCE(city, ''), COALESCE(state, ''));

-- ============================================================ SIGNALS

CREATE TABLE public.radar_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  institution_id UUID REFERENCES public.radar_institutions(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  source_url TEXT,
  source_external_id TEXT,
  raw_text TEXT,
  published_at TIMESTAMPTZ,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  signal_type TEXT,
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  raw_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Exigência da Fase: ao menos source_url OU raw_text.
  CONSTRAINT radar_signals_content_present
    CHECK (source_url IS NOT NULL OR raw_text IS NOT NULL)
);

CREATE UNIQUE INDEX radar_signals_user_source_url_key
  ON public.radar_signals (user_id, source_url) WHERE source_url IS NOT NULL;
CREATE UNIQUE INDEX radar_signals_user_external_id_key
  ON public.radar_signals (user_id, source, source_external_id) WHERE source_external_id IS NOT NULL;
CREATE INDEX radar_signals_institution_idx ON public.radar_signals (institution_id);

-- ============================================================ OPPORTUNITIES

CREATE TABLE public.radar_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  institution_id UUID NOT NULL REFERENCES public.radar_institutions(id) ON DELETE CASCADE,
  status public.radar_opportunity_status NOT NULL DEFAULT 'new',
  score INTEGER CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  score_components JSONB NOT NULL DEFAULT '{}'::jsonb,
  score_explanation TEXT,
  -- Ficam NULL até existir catálogo comercial (decisão G3).
  eduinfo_fit JSONB,
  ecoclear_fit JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Uma oportunidade aberta por instituição; encerradas não bloqueiam nova.
CREATE UNIQUE INDEX radar_opportunities_open_per_institution_key
  ON public.radar_opportunities (user_id, institution_id)
  WHERE status NOT IN ('discarded', 'false_positive');
CREATE INDEX radar_opportunities_score_idx ON public.radar_opportunities (user_id, score DESC);

-- ============================================================ CONSTRUCTION ASSESSMENTS

CREATE TABLE public.radar_construction_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  signal_id UUID NOT NULL REFERENCES public.radar_signals(id) ON DELETE CASCADE,
  construction_detected BOOLEAN NOT NULL,
  construction_type public.radar_construction_type NOT NULL DEFAULT 'unknown',
  construction_stage public.radar_construction_stage NOT NULL DEFAULT 'S0_VAGUE_SIGNAL',
  description TEXT,
  confidence NUMERIC(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  -- Resumo curto e auditável. NUNCA chain-of-thought interno.
  reasoning_summary TEXT,
  is_educational_institution BOOLEAN,
  lexical_crosscheck JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX radar_assessments_signal_idx ON public.radar_construction_assessments (signal_id);

-- ============================================================ CONTACTS

CREATE TABLE public.radar_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  institution_id UUID NOT NULL REFERENCES public.radar_institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  organization TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  instagram_url TEXT,
  verification_status public.radar_verification_status NOT NULL DEFAULT 'unverified',
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  -- LGPD: preparado antes de qualquer etapa de envio.
  opt_out_status BOOLEAN NOT NULL DEFAULT false,
  opt_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Um e-mail nunca pode ser 'verified' sem ter sido realmente verificado;
  -- 'inferred' jamais pode se apresentar como confirmado.
  CONSTRAINT radar_contacts_inferred_not_verified
    CHECK (NOT (verification_status = 'verified' AND email IS NULL AND phone IS NULL))
);

CREATE UNIQUE INDEX radar_contacts_user_institution_name_key
  ON public.radar_contacts (user_id, institution_id, lower(name));
CREATE INDEX radar_contacts_institution_idx ON public.radar_contacts (institution_id);

-- ============================================================ EVIDENCE

CREATE TABLE public.radar_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  opportunity_id UUID REFERENCES public.radar_opportunities(id) ON DELETE CASCADE,
  signal_id UUID REFERENCES public.radar_signals(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.radar_contacts(id) ON DELETE SET NULL,
  evidence_type TEXT NOT NULL,
  source_url TEXT,
  source_name TEXT,
  excerpt TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX radar_evidence_opportunity_idx ON public.radar_evidence (opportunity_id);
CREATE INDEX radar_evidence_contact_idx ON public.radar_evidence (contact_id);

-- ============================================================ OUTREACH

CREATE TABLE public.radar_outreach (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  opportunity_id UUID NOT NULL REFERENCES public.radar_opportunities(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.radar_contacts(id) ON DELETE SET NULL,
  channel public.radar_outreach_channel NOT NULL,
  status public.radar_outreach_status NOT NULL DEFAULT 'draft',
  draft JSONB NOT NULL DEFAULT '{}'::jsonb,
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  external_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Barreira estrutural: nada é marcado 'sent' sem ter sido aprovado antes.
  CONSTRAINT radar_outreach_send_requires_approval
    CHECK (status <> 'sent' OR (approved_at IS NOT NULL AND sent_at IS NOT NULL))
);

CREATE INDEX radar_outreach_opportunity_idx ON public.radar_outreach (opportunity_id);

-- ============================================================ JOBS

CREATE TABLE public.radar_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_type TEXT NOT NULL,
  status public.radar_job_status NOT NULL DEFAULT 'pending',
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB,
  error TEXT,
  scheduled_for TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX radar_jobs_user_status_idx ON public.radar_jobs (user_id, status);

-- ============================================================ updated_at

CREATE OR REPLACE FUNCTION public.radar_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER radar_institutions_touch BEFORE UPDATE ON public.radar_institutions
  FOR EACH ROW EXECUTE FUNCTION public.radar_touch_updated_at();
CREATE TRIGGER radar_opportunities_touch BEFORE UPDATE ON public.radar_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.radar_touch_updated_at();
CREATE TRIGGER radar_contacts_touch BEFORE UPDATE ON public.radar_contacts
  FOR EACH ROW EXECUTE FUNCTION public.radar_touch_updated_at();
CREATE TRIGGER radar_outreach_touch BEFORE UPDATE ON public.radar_outreach
  FOR EACH ROW EXECUTE FUNCTION public.radar_touch_updated_at();

-- ============================================================ RLS
-- Mesmo padrão das tabelas existentes: auth.uid() = user_id.

ALTER TABLE public.radar_institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_construction_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_outreach ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_jobs ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'radar_institutions', 'radar_signals', 'radar_opportunities',
    'radar_construction_assessments', 'radar_contacts', 'radar_evidence',
    'radar_outreach', 'radar_jobs'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated
         USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)',
      t || '_owner_policy', t
    );
  END LOOP;
END $$;
