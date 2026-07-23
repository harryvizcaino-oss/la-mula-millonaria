-- ============================================================================
-- La Mula Millonaria — 005_league_progress.sql
-- Rankings semanales con ligas (Wave 3, F9): progreso de liga por usuario y
-- semana. La semana se identifica por el lunes local en formato 'YYYY-MM-DD'
-- (misma clave que genera el cliente en src/data/leagues.ts).
--
-- Qué hace:
--   1. Crea `league_progress` (user_id, season_week, weekly_cps_total,
--      league, tier, claimed) con PK compuesta (user_id, season_week).
--   2. RLS: cada usuario lee/inserta/actualiza solo sus filas.
--
-- NOTA: el cliente (src/store/leagueStore.ts) funciona 100% offline con
-- localStorage; esta tabla queda lista para un futuro sync del puntaje
-- semanal y del mini leaderboard de liga.
--
-- Aplicar con: pegar este archivo en el SQL Editor del dashboard de Supabase
-- (o `supabase db push`). Idempotente.
-- ============================================================================

create table if not exists public.league_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  season_week text not null,
  weekly_cps_total bigint not null default 0,
  league text not null default 'bronce',
  tier smallint not null default 1 check (tier between 1 and 5),
  claimed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, season_week)
);

create index if not exists league_progress_week_score_idx
  on public.league_progress (season_week, weekly_cps_total desc);

alter table public.league_progress enable row level security;

-- Lectura: cada usuario ve solo su progreso de liga
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'league_progress'
      and policyname = 'league_progress_select_own'
  ) then
    create policy league_progress_select_own
      on public.league_progress
      for select
      using (auth.uid() = user_id);
  end if;
end $$;

-- Escritura: cada usuario inserta/actualiza solo sus filas
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'league_progress'
      and policyname = 'league_progress_insert_own'
  ) then
    create policy league_progress_insert_own
      on public.league_progress
      for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'league_progress'
      and policyname = 'league_progress_update_own'
  ) then
    create policy league_progress_update_own
      on public.league_progress
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
