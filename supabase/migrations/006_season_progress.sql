-- ============================================================================
-- La Mula Millonaria — 006_season_progress.sql
-- Feature "Pase de temporada" (F6, Wave 2): progreso del pase por usuario.
--
-- Qué hace:
--   1. Crea `season_progress` (una fila por usuario + temporada) con la XP
--      acumulada, el flag de premium y los niveles reclamados (gratis y
--      premium).
--   2. RLS: cada usuario lee/inserta/actualiza únicamente sus propias filas.
--
-- Aplicar con: pegar este archivo en el SQL Editor del dashboard de Supabase
-- (o `supabase db push`). Es idempotente: se puede correr más de una vez.
-- El sync del frontend es best-effort (src/lib/seasonSync.ts): Zustand +
-- localStorage siguen siendo la fuente de verdad en tiempo real.
-- ============================================================================

create table if not exists public.season_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  season_id text not null,
  xp bigint not null default 0,
  premium boolean not null default false,
  claimed_levels integer[] not null default '{}',
  claimed_premium integer[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, season_id)
);

alter table public.season_progress enable row level security;

-- Lectura: solo el dueño de la fila.
drop policy if exists "season_progress_select_own" on public.season_progress;
create policy "season_progress_select_own"
  on public.season_progress for select
  using (auth.uid() = user_id);

-- Insert: solo filas propias.
drop policy if exists "season_progress_insert_own" on public.season_progress;
create policy "season_progress_insert_own"
  on public.season_progress for insert
  with check (auth.uid() = user_id);

-- Update: solo filas propias.
drop policy if exists "season_progress_update_own" on public.season_progress;
create policy "season_progress_update_own"
  on public.season_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
