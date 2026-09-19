-- Ejecuta este archivo en Supabase → SQL Editor (una vez).
-- Hace que fincas, incidencias, contabilidad, nómina y catálogo SOFER
-- se guarden en el servidor y lleguen a todos en tiempo real.

create table if not exists public.app_shared (
  key text primary key,
  payload jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);

alter table public.app_shared enable row level security;

drop policy if exists "app_shared_select" on public.app_shared;
create policy "app_shared_select"
  on public.app_shared for select to authenticated
  using (true);

drop policy if exists "app_shared_insert" on public.app_shared;
create policy "app_shared_insert"
  on public.app_shared for insert to authenticated
  with check (true);

drop policy if exists "app_shared_update" on public.app_shared;
create policy "app_shared_update"
  on public.app_shared for update to authenticated
  using (true)
  with check (true);

alter table public.app_shared replica identity full;

grant select, insert, update on public.app_shared to authenticated;

create or replace function public.upsert_app_shared(p_key text, p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_shared (key, payload, updated_at)
  values (p_key, coalesce(p_payload, '[]'::jsonb), now())
  on conflict (key) do update
    set payload = excluded.payload,
        updated_at = now();
end;
$$;

grant execute on function public.upsert_app_shared(text, jsonb) to authenticated, anon;

do $$
begin
  begin
    alter publication supabase_realtime add table public.app_shared;
  exception when duplicate_object then
    null;
  end;
  begin
    alter publication supabase_realtime add table public.app_notifications;
  exception when duplicate_object then
    null;
  end;
  begin
    alter publication supabase_realtime add table public.profiles;
  exception when duplicate_object then
    null;
  end;
end $$;
