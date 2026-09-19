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

create unique index if not exists profiles_email_lower_idx on public.profiles (lower(email));

alter table public.profiles enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select"
  on public.profiles for select to authenticated
  using (
    auth.uid() = id
    or lower(coalesce(auth.jwt() ->> 'email', '')) = lower('DavidAlejandroRoblesMarquez@gmail.com')
  );

drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert"
  on public.profiles for insert to authenticated
  with check (
    auth.uid() = id
    and (
      role = 'unassigned'
      or lower(email) = lower('DavidAlejandroRoblesMarquez@gmail.com')
    )
  );

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update"
  on public.profiles for update to authenticated
  using (
    auth.uid() = id
    or lower(coalesce(auth.jwt() ->> 'email', '')) = lower('DavidAlejandroRoblesMarquez@gmail.com')
  )
  with check (
    lower(coalesce(auth.jwt() ->> 'email', '')) = lower('DavidAlejandroRoblesMarquez@gmail.com')
    or (
      auth.uid() = id
      and role is not distinct from (select p.role from public.profiles p where p.id = auth.uid())
    )
  );

drop policy if exists "profiles_delete" on public.profiles;
create policy "profiles_delete"
  on public.profiles for delete to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) = lower('DavidAlejandroRoblesMarquez@gmail.com')
  );

alter table public.profiles replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.profiles;
  exception when duplicate_object then
    null;
  end;
end $$;
