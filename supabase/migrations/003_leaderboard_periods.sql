-- ============================================================================
-- La Mula Millonaria — 003_leaderboard_periods.sql
-- Leaderboard Semanal/Mensual (T6): contadores de período en
-- `leaderboard_global` + resets programados con pg_cron.
--
-- Qué hace:
--   1. Agrega `cps_week` y `cps_month` (BIGINT) a `leaderboard_global`.
--   2. Reemplaza `update_leaderboard()` para acumular en esos contadores el
--      delta de `cps_total` en cada upsert (delta = nuevo - anterior; se
--      ignoran deltas <= 0; en el INSERT inicial cuenta el total completo).
--      `cps_total` sigue sin bajar nunca (`greatest()`).
--
-- PASO MANUAL REQUERIDO (resets de período con pg_cron):
--   pg_cron no se puede habilitar desde SQL migratorio — actívalo en el
--   dashboard: Database → Extensions → pg_cron → Enable. Después ejecuta
--   manualmente (SQL Editor) las dos líneas `cron.schedule` del bloque
--   comentado al final de este archivo. Sin ese paso todo funciona igual,
--   solo que Semanal/Mensual acumulan sin resetearse.
--
-- Aplicar con: pegar este archivo en el SQL Editor del dashboard de Supabase
-- (o `supabase db push`). Idempotente; NO falla si pg_cron no existe.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Columnas de período
-- ----------------------------------------------------------------------------
alter table public.leaderboard_global
  add column if not exists cps_week bigint not null default 0;

alter table public.leaderboard_global
  add column if not exists cps_month bigint not null default 0;

create index if not exists leaderboard_global_cps_week_idx
  on public.leaderboard_global (cps_week desc);

create index if not exists leaderboard_global_cps_month_idx
  on public.leaderboard_global (cps_month desc);

-- ----------------------------------------------------------------------------
-- 2. update_leaderboard() con acumulación de deltas por período
-- ----------------------------------------------------------------------------
create or replace function public.update_leaderboard()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.leaderboard_global (user_id, username, cps_total, cps_week, cps_month, level, avatar_url)
  select
    gs.id,
    coalesce(p.username, 'Jugador'),
    gs.cps_total,
    gs.cps_total::bigint,   -- INSERT inicial: el delta es el total completo
    gs.cps_total::bigint,
    coalesce(p.level, 1),
    p.avatar_url
  from public.game_state gs
  left join public.profiles p on p.id = gs.id
  on conflict (user_id) do update
    set username = excluded.username,
        -- delta del período: nuevo cps_total - anterior; ignora deltas <= 0
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
-- 3. Resets de período — PASO MANUAL (ver encabezado). NO ejecutar aquí:
--    si pg_cron no está habilitado, `cron.schedule` no existe y la migración
--    fallaría. Una vez habilitada la extensión en el dashboard, descomenta y
--    corre estas dos líneas en el SQL Editor:
--
-- select cron.schedule('reset-leaderboard-week',  '0 0 * * 1', $job$update public.leaderboard_global set cps_week = 0$job$);
-- select cron.schedule('reset-leaderboard-month', '0 0 1 * *', $job$update public.leaderboard_global set cps_month = 0$job$);
--
--    Semanal: lunes 00:00 UTC. Mensual: día 1, 00:00 UTC.
--    Para verificar:  select * from cron.job;
--    Para desprogramar: select cron.unschedule('reset-leaderboard-week');
-- ----------------------------------------------------------------------------
