import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, Minus, Timer, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';
import {
  DIVISION_COUNT,
  divisionRewards,
  getNextWeekStart,
  leagueOfDivision,
  promotionThreshold,
  tierOfDivision,
} from '@/data/leagues';
import { useLeagueStore } from '@/store/leagueStore';
import { useClickerStore } from '@/store/clickerStore';
import { useMillas } from '@/providers/MillasProvider';
import { mockPlayers } from '@/data/mockLeaderboard';
import { notifyLeagueReward } from '@/lib/pushNotifications';

const formatNumber = (num: number): string => Math.floor(num).toLocaleString('es-CO');

function formatCountdown(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/**
 * Wave 3 (F9) — Panel de liga semanal dentro de /leaderboard (scope "Liga").
 * Local primero: el mini leaderboard mezcla jugadores mock con tu CPS semanal;
 * la tabla `league_progress` (migración 005) queda para un futuro sync.
 */
export function LeaguePanel() {
  const { addMillas } = useMillas();
  const division = useLeagueStore((s) => s.division);
  const weeklyCpsTotal = useLeagueStore((s) => s.weeklyCpsTotal);
  const pendingReward = useLeagueStore((s) => s.pendingReward);
  const claimReward = useLeagueStore((s) => s.claimReward);
  const store = useClickerStore();

  const [now, setNow] = useState(Date.now());
  const [claimed, setClaimed] = useState<string | null>(null);

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(iv);
  }, []);

  // Aviso push cuando hay recompensa de liga lista para reclamar
  useEffect(() => {
    if (pendingReward) notifyLeagueReward();
  }, [pendingReward]);

  const league = leagueOfDivision(division);
  const tier = tierOfDivision(division);
  const threshold = promotionThreshold(division);
  const progress = Math.min(100, (weeklyCpsTotal / threshold) * 100);
  const rewards = divisionRewards(division);
  const msLeft = getNextWeekStart().getTime() - now;

  // Mini leaderboard de la semana (local): mocks + tú
  const weeklyBoard = useMemo(() => {
    const rows = mockPlayers.map((p) => ({ name: p.name, avatar: p.avatar, weekly: p.score, me: false }));
    rows.push({ name: 'Tu', avatar: mockPlayers[0]?.avatar ?? '', weekly: Math.floor(weeklyCpsTotal), me: true });
    return rows.sort((a, b) => b.weekly - a.weekly).slice(0, 10);
  }, [weeklyCpsTotal]);

  const handleClaim = () => {
    const reward = claimReward();
    if (!reward) return;
    addMillas(reward.millas);
    store.addEarnings(reward.cps);
    store.addGoldenTickets(reward.tickets);
    setClaimed(reward.weekKey);
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#F59E0B', '#FFF7CC'],
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-4 mx-4 space-y-4"
    >
      {/* Recompensa de la semana anterior */}
      {pendingReward && claimed !== pendingReward.weekKey && (
        <div className="rounded-2xl p-4 border-2 border-[#F59E0B]/40 bg-gradient-to-r from-[#1A1B26] to-[#232433] text-center">
          <p className="font-fredoka font-bold text-lg text-[#F59E0B]">
            {pendingReward.outcome === 'up'
              ? '¡Ascendiste de liga!'
              : pendingReward.outcome === 'down'
                ? 'Bajaste de división'
                : 'Semana completada'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {leagueOfDivision(pendingReward.division).emoji}{' '}
            {leagueOfDivision(pendingReward.division).name} {tierOfDivision(pendingReward.division)} ·{' '}
            +{formatNumber(pendingReward.millas)} millas · +{formatNumber(pendingReward.cps)} ⚡ · +
            {pendingReward.tickets} 🎟️
          </p>
          <button
            onClick={handleClaim}
            className="mt-3 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-[#0D0E14] text-sm font-bold hover:shadow-lg hover:shadow-[#F59E0B]/20 transition-shadow"
          >
            Reclamar recompensa
          </button>
        </div>
      )}

      {/* Liga actual */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ backgroundColor: `${league.color}22`, border: `2px solid ${league.color}` }}
          >
            {league.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-fredoka font-bold text-lg text-slate-900">
              Liga {league.name} {tier}
            </p>
            <p className="text-xs text-slate-500">
              División {division + 1} de {DIVISION_COUNT}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1 text-slate-500 justify-end">
              <Timer size={12} />
              <span className="text-xs font-bold">{formatCountdown(msLeft)}</span>
            </div>
            <p className="text-[10px] text-slate-400">cierra el lunes</p>
          </div>
        </div>

        {/* Progreso semanal hacia el ascenso */}
        <div className="mt-4">
          <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
            <span>{formatNumber(weeklyCpsTotal)} CPS esta semana</span>
            <span>Meta: {formatNumber(threshold)}</span>
          </div>
          <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${league.color}, #F59E0B)` }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Alcanza la meta para ascender; por debajo del 15% desciendes de división.
          </p>
        </div>

        {/* Recompensas de la división actual */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { label: 'Millas', value: `+${formatNumber(rewards.millas)}` },
            { label: 'CPS', value: `+${formatNumber(rewards.cps)}` },
            { label: 'Tickets', value: `+${rewards.tickets} 🎟️` },
          ].map((r) => (
            <div key={r.label} className="bg-slate-100 rounded-xl p-2 text-center">
              <p className="font-fredoka font-bold text-sm text-slate-900">{r.value}</p>
              <p className="text-[10px] text-slate-500">{r.label} / semana</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mini leaderboard semanal (local) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_12px_rgba(0,0,0,0.2)] overflow-hidden">
        <div className="px-4 pt-4 pb-2 flex items-center gap-2">
          <Trophy size={16} className="text-[#F59E0B]" />
          <h2 className="font-fredoka font-bold text-lg text-slate-900">Semana actual</h2>
          <span className="text-[10px] text-slate-400 ml-auto">demo local</span>
        </div>
        {weeklyBoard.map((row, i) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
          return (
            <div
              key={`${row.name}-${i}`}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 last:border-b-0',
                row.me && 'bg-[#F59E0B]/8 border-l-[3px] border-l-[#F59E0B]'
              )}
            >
              <div className="w-7 text-center flex-shrink-0">
                {medal ? (
                  <span className="text-base">{medal}</span>
                ) : (
                  <span className="text-xs font-bold text-slate-500">#{i + 1}</span>
                )}
              </div>
              <img src={row.avatar} alt={row.name} className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0" />
              <p className={cn('flex-1 min-w-0 text-sm font-bold truncate', row.me ? 'text-[#F59E0B]' : 'text-slate-900')}>
                {row.name}
              </p>
              <p className="text-sm font-bold text-slate-900 flex-shrink-0">{formatNumber(row.weekly)}</p>
            </div>
          );
        })}
      </div>

      {/* Escalera de ligas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
        <h2 className="font-fredoka font-bold text-lg text-slate-900 mb-2">Escalera de ligas</h2>
        <div className="space-y-1.5">
          {Array.from({ length: DIVISION_COUNT }).map((_, d) => {
            const l = leagueOfDivision(d);
            const isCurrent = d === division;
            const isPast = d < division;
            return (
              <div
                key={d}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs',
                  isCurrent ? 'bg-[#F59E0B]/15 border border-[#F59E0B]/40' : 'bg-slate-100/60'
                )}
              >
                <span>{l.emoji}</span>
                <span className={cn('font-bold flex-1', isCurrent ? 'text-slate-900' : 'text-slate-500')}>
                  {l.name} {tierOfDivision(d)}
                </span>
                {isPast && <ChevronUp size={12} className="text-[#10B981]" />}
                {isCurrent && <Minus size={12} className="text-[#F59E0B]" />}
                {!isPast && !isCurrent && <ChevronDown size={12} className="text-slate-400" />}
                <span className="text-[10px] text-slate-400">{formatNumber(promotionThreshold(d))}</span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
