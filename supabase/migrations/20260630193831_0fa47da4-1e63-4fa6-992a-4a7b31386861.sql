
-- Email templates (saved drafts/templates)
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  template_type TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;
GRANT ALL ON public.email_templates TO service_role;

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own email templates"
  ON public.email_templates FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for email-assets bucket
-- Authenticated users can manage files under their own folder (userId/...)
CREATE POLICY "Auth users can upload to own folder in email-assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'email-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Auth users can read own folder in email-assets"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'email-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Auth users can update own folder in email-assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'email-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Auth users can delete own folder in email-assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'email-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
