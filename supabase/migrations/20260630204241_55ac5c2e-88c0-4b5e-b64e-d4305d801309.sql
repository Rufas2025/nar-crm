
-- gmail_connections
CREATE TABLE public.gmail_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  email text not null,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  scope text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, UPDATE, DELETE ON public.gmail_connections TO authenticated;
GRANT ALL ON public.gmail_connections TO service_role;
ALTER TABLE public.gmail_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own gmail conn select" ON public.gmail_connections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own gmail conn delete" ON public.gmail_connections FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_gmail_conn_updated BEFORE UPDATE ON public.gmail_connections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- gmail_drafts
CREATE TABLE public.gmail_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lead_id uuid,
  campaign_id text,
  gmail_draft_id text,
  to_email text not null,
  subject text not null,
  template_type text,
  status text not null default 'created',
  error_message text,
  is_test boolean not null default false,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gmail_drafts TO authenticated;
GRANT ALL ON public.gmail_drafts TO service_role;
ALTER TABLE public.gmail_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own gmail drafts" ON public.gmail_drafts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_gmail_drafts_campaign ON public.gmail_drafts(user_id, campaign_id);

-- gmail_test_approvals
CREATE TABLE public.gmail_test_approvals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  campaign_id text not null,
  approved_at timestamptz not null default now(),
  unique (user_id, campaign_id)
);
GRANT SELECT, INSERT, DELETE ON public.gmail_test_approvals TO authenticated;
GRANT ALL ON public.gmail_test_approvals TO service_role;
ALTER TABLE public.gmail_test_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own gmail approvals" ON public.gmail_test_approvals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
