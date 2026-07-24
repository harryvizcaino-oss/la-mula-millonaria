-- ============================================================================
-- La Mula Millonaria — 008_leaderboard_realtime.sql
-- Leaderboard Diario mundial y en tiempo real.
--
-- Qué hace:
--   1. REPLICA IDENTITY FULL en `leaderboard_global` para que Supabase
--      Realtime emita el estado completo de la fila en cada UPDATE/INSERT.
--   2. Programa el reset diario de `cps_day` con pg_cron (00:00 UTC).
--   3. Comentarios sobre cómo habilitar Realtime en el dashboard.
--
-- NOTA IMPORTANTE:
--   Después de aplicar esta migración, ve al dashboard de Supabase:
--     Database → Replication → Realtime → Tables
--   y habilita `leaderboard_global` para que el frontend reciba
--   `postgres_changes` en vivo.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. REPLICA IDENTITY FULL (requerido para Realtime)
-- ----------------------------------------------------------------------------
alter table public.leaderboard_global
  replica identity full;

-- ----------------------------------------------------------------------------
-- 2. Reset diario con pg_cron
-- ----------------------------------------------------------------------------
-- Idempotente: reprograma el job si ya existía.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'reset-leaderboard-day') then
    perform cron.unschedule('reset-leaderboard-day');
  end if;
end $$;

select cron.schedule('reset-leaderboard-day', '0 0 * * *', $job$update public.leaderboard_global set cps_day = 0$job$);

-- ----------------------------------------------------------------------------
-- 3. Cómo funciona el tiempo real mundial
-- ----------------------------------------------------------------------------
--   Cada jugador sincroniza su `game_state` cada 5s (debounce en el cliente).
--   El trigger `on_game_state_leaderboard` ejecuta `update_leaderboard()`,
--   que acumula el delta en `cps_day` y recalcula el ranking.
--   Supabase Realtime emite `postgres_changes` a todos los clientes suscritos,
--   y `Leaderboard.tsx` recarga la lista ordenada por `cps_day desc`.
--
--   Para ver los eventos en vivo:
--     Dashboard → Database → Replication → Realtime → leaderboard_global → ON
--
--   Verificar cron:      select * from cron.job;
--   Desprogramar:        select cron.unschedule('reset-leaderboard-day');
-- ----------------------------------------------------------------------------
