-- 004_leaderboard_cron.sql
-- Programa los resets del leaderboard semanal/mensual con pg_cron.
-- Requiere la extensión pg_cron habilitada (Dashboard → Database → Extensions).
-- Idempotente: reprograma el job si ya existía con el mismo nombre.
--
--   Semanal: lunes 00:00 UTC    → cps_week = 0
--   Mensual: día 1, 00:00 UTC   → cps_month = 0
--
-- Verificar:      select * from cron.job;
-- Desprogramar:   select cron.unschedule('reset-leaderboard-week');

do $$
begin
  if exists (select 1 from cron.job where jobname = 'reset-leaderboard-week') then
    perform cron.unschedule('reset-leaderboard-week');
  end if;
  if exists (select 1 from cron.job where jobname = 'reset-leaderboard-month') then
    perform cron.unschedule('reset-leaderboard-month');
  end if;
end $$;

select cron.schedule('reset-leaderboard-week',  '0 0 * * 1', $job$update public.leaderboard_global set cps_week = 0$job$);
select cron.schedule('reset-leaderboard-month', '0 0 1 * *', $job$update public.leaderboard_global set cps_month = 0$job$);
