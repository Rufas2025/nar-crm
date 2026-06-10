-- Garante que evolution_config existe com os nomes de coluna usados pela tela
-- /configuracoes e pelas Edge Functions Evolution GO: api_url, api_key,
-- instance_name, connection_status, last_tested_at (+ last_test_error).

create table if not exists public.evolution_config (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  api_url text not null,
  api_key text not null,
  instance_name text not null,
  connection_status text,
  last_tested_at timestamptz,
  last_test_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- Renomeia colunas da migration anterior, caso já tenha sido aplicada
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'evolution_config' and column_name = 'base_url'
  ) then
    alter table public.evolution_config rename column base_url to api_url;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'evolution_config' and column_name = 'last_test_status'
  ) then
    alter table public.evolution_config rename column last_test_status to connection_status;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'evolution_config' and column_name = 'last_test_at'
  ) then
    alter table public.evolution_config rename column last_test_at to last_tested_at;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'evolution_config' and column_name = 'last_test_error'
  ) then
    alter table public.evolution_config add column last_test_error text;
  end if;
end $$;

alter table public.evolution_config enable row level security;

drop policy if exists "evolution_config_select_own" on public.evolution_config;
create policy "evolution_config_select_own"
  on public.evolution_config for select
  using (auth.uid() = user_id);

drop policy if exists "evolution_config_insert_own" on public.evolution_config;
create policy "evolution_config_insert_own"
  on public.evolution_config for insert
  with check (auth.uid() = user_id);

drop policy if exists "evolution_config_update_own" on public.evolution_config;
create policy "evolution_config_update_own"
  on public.evolution_config for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "evolution_config_delete_own" on public.evolution_config;
create policy "evolution_config_delete_own"
  on public.evolution_config for delete
  using (auth.uid() = user_id);
