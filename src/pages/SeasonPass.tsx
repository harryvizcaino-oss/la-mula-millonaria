import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Crown, Gift, Lock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSeasonStore } from '@/store/seasonStore';
import { useClickerStore } from '@/store/clickerStore';
import {
  getCurrentSeason,
  levelForXp,
  SEASON_MAX_LEVEL,
  SEASON_PREMIUM_COST_TICKETS,
  SEASON_TRACK,
  SEASON_XP_PER_LEVEL,
  type SeasonReward,
} from '@/data/seasonPass';

function formatNumber(n: number): string {
  if (n < 1000) return n.toLocaleString('es-CO', { maximumFractionDigits: 0 });
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}K`;
  if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(n < 10_000_000 ? 2 : 1)}M`;
  return `${(n / 1_000_000_000).toFixed(2)}B`;
}

function rewardLabel(r: SeasonReward): string {
  return r.type === 'tickets' ? `+${r.amount} 🎟️` : `+${formatNumber(r.amount)} ⚡`;
}

export default function SeasonPass() {
  const navigate = useNavigate();
  const season = getCurrentSeason();
  const xp = useSeasonStore((s) => s.xp);
  const premium = useSeasonStore((s) => s.premium);
  const claimedFree = useSeasonStore((s) => s.claimedFree);
  const claimedPremium = useSeasonStore((s) => s.claimedPremium);
  const goldenTickets = useClickerStore((s) => s.goldenTickets);

  const level = levelForXp(xp);
  const xpIntoLevel = xp - level * SEASON_XP_PER_LEVEL;
  const xpProgress = level >= SEASON_MAX_LEVEL ? 100 : (xpIntoLevel / SEASON_XP_PER_LEVEL) * 100;
  const daysLeft = Math.max(0, Math.ceil((season.endAt - Date.now()) / 86_400_000));
  const canAffordPremium = goldenTickets >= SEASON_PREMIUM_COST_TICKETS;

  const claimableCount = useMemo(() => {
    let count = 0;
    for (const l of SEASON_TRACK) {
      if (l.level > level) break;
      const freePending = !claimedFree.includes(l.level);
      const premiumPending = premium && !claimedPremium.includes(l.level);
      if (freePending || premiumPending) count += 1;
    }
    return count;
  }, [level, claimedFree, claimedPremium, premium]);

  const handleClaim = (lvl: number) => {
    useSeasonStore.getState().claimLevel(lvl);
  };

  const handleUnlockPremium = () => {
    if (!canAffordPremium) return;
    const result = useClickerStore.getState().redeemGoldenTickets(SEASON_PREMIUM_COST_TICKETS);
    if (result.success) useSeasonStore.getState().unlockPremium();
  };

  return (
    <div className="min-h-[100dvh] bg-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden rounded-b-3xl px-4 pt-6 pb-6">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D0E14] via-[#1A1B26] to-[#0D0E14] rounded-b-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={22} className="text-white" />
            </button>
            <div className="flex-1">
              <h1 className="font-fredoka font-black text-2xl text-white">{season.name}</h1>
              <p className="text-slate-400 text-xs">
                Temporada {season.id} · quedan {daysLeft} días
              </p>
            </div>
            {premium && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-[#0D0E14] text-xs font-black">
                <Crown size={12} /> PREMIUM
              </span>
            )}
          </div>

          {/* Nivel + XP */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#F97316] flex flex-col items-center justify-center border-2 border-[#FBBF24] shadow-lg flex-shrink-0">
              <span className="text-[9px] font-black text-[#451a03] uppercase">Nivel</span>
              <span className="font-fredoka font-black text-xl text-[#0D0E14] leading-none">
                {level}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1">
                <span>{formatNumber(xp)} XP</span>
                <span>
                  {level >= SEASON_MAX_LEVEL
                    ? '¡Pase completado!'
                    : `${xpIntoLevel}/${SEASON_XP_PER_LEVEL} XP al nivel ${level + 1}`}
                </span>
              </div>
              <div className="h-3 rounded-full bg-black/40 overflow-hidden border border-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FDE047]"
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <p className="text-slate-500 text-[10px] mt-1">
                Gana XP con cada click (1 XP), rachas diarias y redenciones.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Premium upsell */}
      {!premium && (
        <div className="mx-4 mt-4 rounded-2xl p-4 border-2 border-[#F59E0B]/50 bg-gradient-to-br from-[#451a03] via-[#78350F] to-[#451a03] flex items-center gap-3">
          <Crown size={28} className="text-[#FACC15] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-fredoka font-black text-white text-sm">Pase Premium</p>
            <p className="text-[#FDE68A] text-[11px]">
              Duplica el track: recompensas premium en los {SEASON_MAX_LEVEL} niveles.
            </p>
          </div>
          <button
            onClick={handleUnlockPremium}
            disabled={!canAffordPremium}
            className={cn(
              'flex-shrink-0 px-3 py-2 rounded-xl font-black text-xs border-b-4 transition-all',
              canAffordPremium
                ? 'bg-gradient-to-b from-[#FACC15] to-[#D97706] text-[#451a03] border-[#92400E] active:translate-y-0.5 active:border-b-0'
                : 'bg-slate-700/60 text-slate-400 border-transparent cursor-not-allowed'
            )}
          >
            {SEASON_PREMIUM_COST_TICKETS} 🎟️
          </button>
        </div>
      )}

      {/* Track de niveles (horizontal) */}
      <div className="mt-5">
        <div className="flex items-center justify-between px-4 mb-2">
          <h2 className="font-fredoka font-bold text-lg text-slate-900">
            Track de recompensas
          </h2>
          {claimableCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-[#16A34A] text-white text-[10px] font-black">
              {claimableCount} por reclamar
            </span>
          )}
        </div>
        <div className="flex gap-3 overflow-x-auto px-4 pb-4 custom-scrollbar">
          {SEASON_TRACK.map((l) => {
            const reached = l.level <= level;
            const freeClaimed = claimedFree.includes(l.level);
            const premiumClaimed = claimedPremium.includes(l.level);
            const claimable = reached && (!freeClaimed || (premium && !premiumClaimed));
            return (
              <motion.div
                key={l.level}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(l.level * 0.02, 0.4) }}
                className={cn(
                  'flex-shrink-0 w-32 rounded-2xl border-2 p-3 flex flex-col gap-2',
                  reached
                    ? 'bg-white border-[#F59E0B]/60 shadow-[0_2px_12px_rgba(245,158,11,0.15)]'
                    : 'bg-slate-100 border-slate-200'
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center font-fredoka font-black text-xs',
                      reached ? 'bg-[#F59E0B] text-[#0D0E14]' : 'bg-slate-300 text-slate-500'
                    )}
                  >
                    {l.level}
                  </span>
                  {reached ? (
                    freeClaimed && (!premium || premiumClaimed) ? (
                      <Check size={16} className="text-[#16A34A]" />
                    ) : (
                      <Star size={16} className="text-[#F59E0B]" />
                    )
                  ) : (
                    <Lock size={14} className="text-slate-400" />
                  )}
                </div>

                {/* Recompensa gratis */}
                <div
                  className={cn(
                    'rounded-xl px-2 py-1.5 text-center text-[11px] font-black',
                    freeClaimed
                      ? 'bg-slate-100 text-slate-400 line-through'
                      : reached
                        ? 'bg-[#16A34A]/10 text-[#16A34A]'
                        : 'bg-slate-200/70 text-slate-500'
                  )}
                >
                  {rewardLabel(l.free)}
                </div>

                {/* Recompensa premium */}
                <div
                  className={cn(
                    'rounded-xl px-2 py-1.5 text-center text-[11px] font-black flex items-center justify-center gap-1',
                    premiumClaimed
                      ? 'bg-slate-100 text-slate-400 line-through'
                      : premium && reached
                        ? 'bg-[#F59E0B]/15 text-[#B45309]'
                        : 'bg-slate-200/70 text-slate-400'
                  )}
                >
                  <Crown size={10} />
                  {rewardLabel(l.premium)}
                </div>

                <button
                  onClick={() => handleClaim(l.level)}
                  disabled={!claimable}
                  className={cn(
                    'mt-auto w-full py-1.5 rounded-lg font-black text-[11px] tracking-wide transition-all flex items-center justify-center gap-1',
                    claimable
                      ? 'bg-gradient-to-b from-[#FACC15] to-[#D97706] text-[#451a03] border-b-2 border-[#92400E] active:translate-y-0.5 active:border-b-0'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  )}
                >
                  <Gift size={11} />
                  {freeClaimed && (!premium || premiumClaimed)
                    ? 'Reclamado'
                    : reached
                      ? 'Reclamar'
                      : `Nivel ${l.level}`}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
