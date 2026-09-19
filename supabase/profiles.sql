create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  avatar text,
  phone text,
  role text not null default 'unassigned',
  building_id text,
  building_name text,
  specialty text,
  unit_or_area text,
  provider text,
  status text default 'active',
  monthly_fee numeric,
  fee_balance numeric,
  fee_frequency text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists name text;
alter table public.profiles add column if not exists avatar text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists role text not null default 'unassigned';
alter table public.profiles add column if not exists building_id text;
alter table public.profiles add column if not exists building_name text;
alter table public.profiles add column if not exists specialty text;
alter table public.profiles add column if not exists unit_or_area text;
alter table public.profiles add column if not exists provider text;
alter table public.profiles add column if not exists status text default 'active';
alter table public.profiles add column if not exists monthly_fee numeric;
alter table public.profiles add column if not exists fee_balance numeric;
alter table public.profiles add column if not exists fee_frequency text;
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();

create unique index if not exists profiles_email_lower_idx on public.profiles (lower(email));

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and coalesce(status, 'active') is distinct from 'suspended'
  );
$$;

grant execute on function public.is_app_admin() to authenticated, anon;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select"
  on public.profiles for select to authenticated
  using (auth.uid() = id or public.is_app_admin());

drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert"
  on public.profiles for insert to authenticated
  with check (
    auth.uid() = id
    and (
      role = 'unassigned'
      or public.is_app_admin()
      or (
        role = 'admin'
        and not exists (
          select 1 from public.profiles p
          where p.role = 'admin'
            and coalesce(p.status, 'active') is distinct from 'suspended'
        )
      )
    )
  );

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update"
  on public.profiles for update to authenticated
  using (auth.uid() = id or public.is_app_admin())
  with check (
    public.is_app_admin()
    or (
      auth.uid() = id
      and role is not distinct from (select p.role from public.profiles p where p.id = auth.uid())
    )
  );

drop policy if exists "profiles_delete" on public.profiles;
create policy "profiles_delete"
  on public.profiles for delete to authenticated
  using (public.is_app_admin());

create table if not exists public.access_revocations (
  email text primary key,
  revoked_at timestamptz default now()
);

alter table public.access_revocations enable row level security;

drop policy if exists "revocations_select" on public.access_revocations;
create policy "revocations_select"
  on public.access_revocations for select to authenticated
  using (true);

drop policy if exists "revocations_write" on public.access_revocations;
create policy "revocations_write"
  on public.access_revocations for all to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

alter table public.profiles replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.profiles;
  exception when duplicate_object then
    null;
  end;
end $$;

create table if not exists public.app_notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  type text not null default 'system',
  building_id text,
  building_name text,
  ticket_id text,
  created_at timestamptz default now(),
  is_read boolean default false,
  target_roles text[] not null default array['admin']::text[]
);

alter table public.app_notifications enable row level security;

drop policy if exists "app_notifications_select" on public.app_notifications;
create policy "app_notifications_select"
  on public.app_notifications for select to authenticated
  using (true);

drop policy if exists "app_notifications_insert" on public.app_notifications;
create policy "app_notifications_insert"
  on public.app_notifications for insert to authenticated
  with check (true);

drop policy if exists "app_notifications_update" on public.app_notifications;
create policy "app_notifications_update"
  on public.app_notifications for update to authenticated
  using (true)
  with check (true);

alter table public.app_notifications replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.app_notifications;
  exception when duplicate_object then
    null;
  end;
end $$;

create or replace function public.on_profile_access_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'unassigned' then
    insert into public.app_notifications (title, message, type, target_roles)
    values (
      'Nueva solicitud de acceso',
      coalesce(new.name, new.email) || ' (' || new.email || ') espera que le asignes un rol.',
      'system',
      array['admin']::text[]
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_access_request on public.profiles;
create trigger on_profile_access_request
  after insert on public.profiles
  for each row execute function public.on_profile_access_request();
