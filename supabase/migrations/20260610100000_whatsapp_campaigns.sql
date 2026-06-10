-- Templates de mensagem reutilizáveis para envio individual e em campanha
create table public.whatsapp_message_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.whatsapp_message_templates enable row level security;

create policy "whatsapp_message_templates_select_own"
  on public.whatsapp_message_templates for select
  using (auth.uid() = user_id);

create policy "whatsapp_message_templates_insert_own"
  on public.whatsapp_message_templates for insert
  with check (auth.uid() = user_id);

create policy "whatsapp_message_templates_update_own"
  on public.whatsapp_message_templates for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "whatsapp_message_templates_delete_own"
  on public.whatsapp_message_templates for delete
  using (auth.uid() = user_id);

-- Campanhas de WhatsApp em lote
create table public.whatsapp_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  message_template text not null,
  link text,
  status text not null default 'draft'
    check (status in ('draft', 'running', 'paused', 'completed', 'cancelled')),
  filters jsonb,
  batch_size integer not null default 10,
  delay_between_messages_seconds integer not null default 5,
  delay_between_batches_seconds integer not null default 60,
  total_recipients integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index whatsapp_campaigns_user_id_idx on public.whatsapp_campaigns (user_id);

alter table public.whatsapp_campaigns enable row level security;

create policy "whatsapp_campaigns_select_own"
  on public.whatsapp_campaigns for select
  using (auth.uid() = user_id);

create policy "whatsapp_campaigns_insert_own"
  on public.whatsapp_campaigns for insert
  with check (auth.uid() = user_id);

create policy "whatsapp_campaigns_update_own"
  on public.whatsapp_campaigns for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "whatsapp_campaigns_delete_own"
  on public.whatsapp_campaigns for delete
  using (auth.uid() = user_id);

-- Destinatários de cada campanha (um por lead)
create table public.whatsapp_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.whatsapp_campaigns(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  phone text not null,
  message_content text,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed', 'skipped')),
  error_message text,
  evolution_message_id text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index whatsapp_campaign_recipients_campaign_id_idx on public.whatsapp_campaign_recipients (campaign_id);
create index whatsapp_campaign_recipients_status_idx on public.whatsapp_campaign_recipients (campaign_id, status);
create index whatsapp_campaign_recipients_lead_id_idx on public.whatsapp_campaign_recipients (lead_id);

alter table public.whatsapp_campaign_recipients enable row level security;

create policy "whatsapp_campaign_recipients_select_own"
  on public.whatsapp_campaign_recipients for select
  using (auth.uid() = user_id);

create policy "whatsapp_campaign_recipients_insert_own"
  on public.whatsapp_campaign_recipients for insert
  with check (auth.uid() = user_id);

create policy "whatsapp_campaign_recipients_update_own"
  on public.whatsapp_campaign_recipients for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "whatsapp_campaign_recipients_delete_own"
  on public.whatsapp_campaign_recipients for delete
  using (auth.uid() = user_id);

-- Anexos enviados (individual ou de campanha), armazenados no bucket whatsapp-attachments
create table public.whatsapp_message_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid references public.whatsapp_campaigns(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_type text not null check (file_type in ('image', 'video', 'document', 'audio')),
  mime_type text not null,
  file_size bigint not null,
  created_at timestamptz not null default now()
);

create index whatsapp_message_attachments_campaign_id_idx on public.whatsapp_message_attachments (campaign_id);

alter table public.whatsapp_message_attachments enable row level security;

create policy "whatsapp_message_attachments_select_own"
  on public.whatsapp_message_attachments for select
  using (auth.uid() = user_id);

create policy "whatsapp_message_attachments_insert_own"
  on public.whatsapp_message_attachments for insert
  with check (auth.uid() = user_id);

create policy "whatsapp_message_attachments_delete_own"
  on public.whatsapp_message_attachments for delete
  using (auth.uid() = user_id);

-- Extensão de whatsapp_messages: link, anexo, campanha e template de origem
alter table public.whatsapp_messages
  add column if not exists link text,
  add column if not exists attachment_id uuid references public.whatsapp_message_attachments(id) on delete set null,
  add column if not exists campaign_id uuid references public.whatsapp_campaigns(id) on delete set null,
  add column if not exists template_id uuid references public.whatsapp_message_templates(id) on delete set null;

create index if not exists whatsapp_messages_campaign_id_idx on public.whatsapp_messages (campaign_id);

-- Bucket de Storage para anexos (privado; URLs assinadas são geradas sob demanda)
insert into storage.buckets (id, name, public)
values ('whatsapp-attachments', 'whatsapp-attachments', false)
on conflict (id) do nothing;

-- Cada usuário só acessa seus próprios arquivos, organizados em {user_id}/...
drop policy if exists "whatsapp_attachments_select_own" on storage.objects;
create policy "whatsapp_attachments_select_own"
  on storage.objects for select
  using (bucket_id = 'whatsapp-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "whatsapp_attachments_insert_own" on storage.objects;
create policy "whatsapp_attachments_insert_own"
  on storage.objects for insert
  with check (bucket_id = 'whatsapp-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "whatsapp_attachments_delete_own" on storage.objects;
create policy "whatsapp_attachments_delete_own"
  on storage.objects for delete
  using (bucket_id = 'whatsapp-attachments' and (storage.foldername(name))[1] = auth.uid()::text);
