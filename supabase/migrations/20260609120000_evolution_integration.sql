-- Configuração da Evolution API por usuário
create table public.evolution_config (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  base_url text not null,
  api_key text not null,
  instance_name text not null,
  last_test_status text,
  last_test_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.evolution_config enable row level security;

create policy "evolution_config_select_own"
  on public.evolution_config for select
  using (auth.uid() = user_id);

create policy "evolution_config_insert_own"
  on public.evolution_config for insert
  with check (auth.uid() = user_id);

create policy "evolution_config_update_own"
  on public.evolution_config for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "evolution_config_delete_own"
  on public.evolution_config for delete
  using (auth.uid() = user_id);

-- Log de mensagens WhatsApp (enviadas agora; recebidas no futuro via webhook)
create table public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  direction text not null check (direction in ('outbound', 'inbound')),
  phone text not null,
  message text,
  status text not null default 'sent',
  evolution_message_id text,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create index whatsapp_messages_lead_id_idx on public.whatsapp_messages (lead_id);
create index whatsapp_messages_evolution_message_id_idx on public.whatsapp_messages (evolution_message_id);

alter table public.whatsapp_messages enable row level security;

create policy "whatsapp_messages_select_own"
  on public.whatsapp_messages for select
  using (auth.uid() = user_id);

create policy "whatsapp_messages_insert_own"
  on public.whatsapp_messages for insert
  with check (auth.uid() = user_id);
