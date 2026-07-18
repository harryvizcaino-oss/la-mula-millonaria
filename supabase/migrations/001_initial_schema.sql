-- ============================================================================
-- La Mula Millonaria — 001_initial_schema.sql
-- Esquema inicial: profiles, game_state, leaderboard_global, transactions,
-- friends + RLS + triggers (perfil automático, leaderboard, updated_at).
--
-- Aplicar con: `supabase db push` (Supabase CLI) o pegando este archivo en
-- el SQL Editor del dashboard de Supabase.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  avatar_url text,
  level integer not null default 1 check (level >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- game_state — una fila por usuario con el snapshot del clicker
-- Columnas núcleo pedidas: cps, cps_total, golden_tickets, power_levels,
-- fleet_unlocked, active_fleet_id, streak_days, last_claim_date,
-- multiplier_target, bar_fill_percent, current_multiplier.
-- Columnas extra requeridas por el store de Zustand existente (regla de
-- compatibilidad): upgrades, total_clicks, total_earned, stars, ascensions,
-- autoclick_level, last_tick_at, millas.
-- ----------------------------------------------------------------------------
create table if not exists public.game_state (
  id uuid primary key references auth.users (id) on delete cascade,
  cps double precision not null default 0,              -- cpsBalance (gastable)
  cps_total double precision not null default 0,        -- histórico, NUNCA baja (ranking)
  golden_tickets integer not null default 0,
  power_levels jsonb not null default '{}'::jsonb,
  fleet_unlocked jsonb not null default '["chevrolet"]'::jsonb,
  active_fleet_id text not null default 'chevrolet',
  streak_days integer not null default 0,
  last_claim_date date,
  multiplier_target double precision,
  bar_fill_percent double precision not null default 0,
  current_multiplier double precision not null default 1,
  -- extras del store existente
  upgrades jsonb not null default '{}'::jsonb,
  total_clicks bigint not null default 0,
  total_earned double precision not null default 0,
  stars integer not null default 0,
  ascensions integer not null default 0 check (ascensions between 0 and 50),
  autoclick_level integer not null default 0,
  last_tick_at bigint not null default 0,
  millas bigint not null default 0,                     -- TicaMillas (MillasProvider)
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- leaderboard_global — ranking materializado, actualizado desde game_state
-- ----------------------------------------------------------------------------
create table if not exists public.leaderboard_global (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text,
  cps_total double precision not null default 0,
  level integer not null default 1,
  avatar_url text,
  rank integer,
  updated_at timestamptz not null default now()
);

create index if not exists leaderboard_global_cps_total_idx
  on public.leaderboard_global (cps_total desc);

-- ----------------------------------------------------------------------------
-- transactions
-- ----------------------------------------------------------------------------
create table if not exists public.transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  amount numeric not null,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_id_idx
  on public.transactions (user_id, created_at desc);

-- ----------------------------------------------------------------------------
-- friends
-- ----------------------------------------------------------------------------
create table if not exists public.friends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  friend_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  invite_code text,
  created_at timestamptz not null default now(),
  unique (user_id, friend_id)
);

-- ----------------------------------------------------------------------------
-- updated_at automático
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_game_state_updated_at on public.game_state;
create trigger set_game_state_updated_at
  before update on public.game_state
  for each row execute function public.set_updated_at();

drop trigger if exists set_leaderboard_global_updated_at on public.leaderboard_global;
create trigger set_leaderboard_global_updated_at
  before update on public.leaderboard_global
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Perfil + game_state automáticos al registrarse (Supabase Auth)
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', new.email),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;

  insert into public.game_state (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- update_leaderboard(): reconstruye leaderboard_global desde game_state ⋈
-- profiles y recalcula los ranks. Ejecutable también vía RPC.
-- ----------------------------------------------------------------------------
create or replace function public.update_leaderboard()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.leaderboard_global (user_id, username, cps_total, level, avatar_url)
  select
    gs.id,
    coalesce(p.username, 'Jugador'),
    gs.cps_total,
    coalesce(p.level, 1),
    p.avatar_url
  from public.game_state gs
  left join public.profiles p on p.id = gs.id
  on conflict (user_id) do update
    set username = excluded.username,
        -- el ranking nunca baja: conserva el mayor cps_total conocido
        cps_total = greatest(public.leaderboard_global.cps_total, excluded.cps_total),
        level = excluded.level,
        avatar_url = excluded.avatar_url;

  with ranked as (
    select user_id, row_number() over (order by cps_total desc, user_id) as r
    from public.leaderboard_global
  )
  update public.leaderboard_global lb
    set rank = ranked.r
    from ranked
    where lb.user_id = ranked.user_id
      and lb.rank is distinct from ranked.r;
end;
$$;

-- Mantiene la fila del usuario al día en cada guardado de game_state y
-- recalcula los ranks (el guardado ya viene debounced a 5s desde el cliente).
create or replace function public.sync_leaderboard_on_game_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.update_leaderboard();
  return new;
end;
$$;

drop trigger if exists on_game_state_leaderboard on public.game_state;
create trigger on_game_state_leaderboard
  after insert or update of cps_total on public.game_state
  for each row execute function public.sync_leaderboard_on_game_state();

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.game_state enable row level security;
alter table public.leaderboard_global enable row level security;
alter table public.transactions enable row level security;
alter table public.friends enable row level security;

-- profiles: lectura pública (leaderboard/perfiles), escritura solo el dueño
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all"
  on public.profiles for select
  using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- game_state: solo el dueño lee/escribe su fila
drop policy if exists "game_state_select_own" on public.game_state;
create policy "game_state_select_own"
  on public.game_state for select
  using (auth.uid() = id);

drop policy if exists "game_state_insert_own" on public.game_state;
create policy "game_state_insert_own"
  on public.game_state for insert
  with check (auth.uid() = id);

drop policy if exists "game_state_update_own" on public.game_state;
create policy "game_state_update_own"
  on public.game_state for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- leaderboard_global: lectura pública (incluye anónimos); escritura solo
-- vía update_leaderboard() (security definer), sin policies de escritura
drop policy if exists "leaderboard_select_all" on public.leaderboard_global;
create policy "leaderboard_select_all"
  on public.leaderboard_global for select
  using (true);

-- transactions: el dueño lee e inserta las suyas
drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own"
  on public.transactions for select
  using (auth.uid() = user_id);

drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own"
  on public.transactions for insert
  with check (auth.uid() = user_id);

-- friends: participantes leen; el emisor crea/actualiza/borra
drop policy if exists "friends_select_participant" on public.friends;
create policy "friends_select_participant"
  on public.friends for select
  using (auth.uid() = user_id or auth.uid() = friend_id);

drop policy if exists "friends_insert_own" on public.friends;
create policy "friends_insert_own"
  on public.friends for insert
  with check (auth.uid() = user_id);

drop policy if exists "friends_update_participant" on public.friends;
create policy "friends_update_participant"
  on public.friends for update
  using (auth.uid() = user_id or auth.uid() = friend_id)
  with check (auth.uid() = user_id or auth.uid() = friend_id);

drop policy if exists "friends_delete_own" on public.friends;
create policy "friends_delete_own"
  on public.friends for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Realtime para el leaderboard
-- ----------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.leaderboard_global;
exception
  when duplicate_object then null;
end $$;
