-- ============================================================================
-- La Mula Millonaria — 007_leaderboard_daily.sql
-- Leaderboard Diario: contador de CPS ganados hoy + reset programado.
--
-- Qué hace:
--   1. Agrega `cps_day` (BIGINT) a `leaderboard_global`.
--   2. Actualiza `update_leaderboard()` para acumular el delta de `cps_total`
--      también en `cps_day` (INSERT inicial cuenta el total completo).
--   3. Crea índice por `cps_day desc`.
--
-- PASO MANUAL REQUERIDO (reset diario con pg_cron):
--   Habilita pg_cron en Database → Extensions, luego corre en SQL Editor:
--     select cron.schedule('reset-leaderboard-day', '0 0 * * *', $job$update public.leaderboard_global set cps_day = 0$job$);
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Columna diaria
-- ----------------------------------------------------------------------------
alter table public.leaderboard_global
  add column if not exists cps_day bigint not null default 0;

create index if not exists leaderboard_global_cps_day_idx
  on public.leaderboard_global (cps_day desc);

-- ----------------------------------------------------------------------------
-- 2. update_leaderboard() con acumulación de delta diario
-- ----------------------------------------------------------------------------
create or replace function public.update_leaderboard()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.leaderboard_global (user_id, username, cps_total, cps_day, cps_week, cps_month, level, avatar_url)
  select
    gs.id,
    coalesce(p.username, 'Jugador'),
    gs.cps_total,
    gs.cps_total::bigint,   -- INSERT inicial: el delta diario es el total completo
    gs.cps_total::bigint,
    gs.cps_total::bigint,
    coalesce(p.level, 1),
    p.avatar_url
  from public.game_state gs
  left join public.profiles p on p.id = gs.id
  on conflict (user_id) do update
    set username = excluded.username,
        -- delta del día: nuevo cps_total - anterior; ignora deltas <= 0
        cps_day = public.leaderboard_global.cps_day
          + greatest((excluded.cps_total - public.leaderboard_global.cps_total)::bigint, 0),
        cps_week = public.leaderboard_global.cps_week
          + greatest((excluded.cps_total - public.leaderboard_global.cps_total)::bigint, 0),
        cps_month = public.leaderboard_global.cps_month
          + greatest((excluded.cps_total - public.leaderboard_global.cps_total)::bigint, 0),
        -- el ranking global nunca baja: conserva el mayor cps_total conocido
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

-- ----------------------------------------------------------------------------
-- 3. Reset diario — PASO MANUAL (ver encabezado). NO ejecutar aquí:
--    Una vez habilitada la extensión pg_cron en el dashboard, descomenta y
--    corre esta línea en el SQL Editor:
--
-- select cron.schedule('reset-leaderboard-day', '0 0 * * *', $job$update public.leaderboard_global set cps_day = 0$job$);
--
--    Diario: 00:00 UTC.
-- ----------------------------------------------------------------------------
