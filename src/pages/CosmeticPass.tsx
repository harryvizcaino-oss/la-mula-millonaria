import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Crown, Gift, Lock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  COSMETIC_PASS_MAX_LEVEL,
  COSMETIC_PASS_PREMIUM_COST_TICKETS,
  COSMETIC_PASS_STARS_PER_LEVEL,
  COSMETIC_PASS_TRACK,
  getCurrentCosmeticSeason,
  levelForStars,
  type CosmeticReward,
} from '@/data/cosmeticPass';
import { getTruckPart } from '@/data/truckSkins';
import { useCosmeticPassStore } from '@/store/cosmeticPassStore';
import { useClickerStore } from '@/store/clickerStore';
import { useCollectibleStore } from '@/store/collectibleStore';
import { useCustomizationStore } from '@/store/customizationStore';
import { useMillas } from '@/providers/MillasProvider';

function formatNumber(n: number): string {
  if (n < 1000) return n.toLocaleString('es-CO', { maximumFractionDigits: 0 });
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}K`;
  if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(n < 10_000_000 ? 2 : 1)}M`;
  return `${(n / 1_000_000_000).toFixed(2)}B`;
}

function rewardLabel(r: CosmeticReward): string {
  switch (r.kind) {
    case 'millas':
      return `+${formatNumber(r.amount)} M`;
    case 'cps':
      return `+${formatNumber(r.amount)} ⚡`;
    case 'tickets':
      return `+${r.amount} 🎟️`;
    case 'collectible':
      return '🎁 Coleccionable';
    case 'cosmetic': {
      const part = getTruckPart(r.partId);
      return part ? `${part.emoji} ${part.name}` : '✨ Cosmético';
    }
  }
}

export default function CosmeticPass() {
  const navigate = useNavigate();
  const season = getCurrentCosmeticSeason();
  const stars = useCosmeticPassStore((s) => s.stars);
  const premium = useCosmeticPassStore((s) => s.premium);
  const claimedFree = useCosmeticPassStore((s) => s.claimedFree);
  const claimedPremium = useCosmeticPassStore((s) => s.claimedPremium);
  const goldenTickets = useClickerStore((s) => s.goldenTickets);
  const { addMillas } = useMillas();

  const level = levelForStars(stars);
  const starsIntoLevel = stars - level * COSMETIC_PASS_STARS_PER_LEVEL;
  const starsProgress =
    level >= COSMETIC_PASS_MAX_LEVEL ? 100 : (starsIntoLevel / COSMETIC_PASS_STARS_PER_LEVEL) * 100;
  // Días restantes: se calcula al montar (Date.now no es puro en render)
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  useEffect(() => {
    const id = setTimeout(() => {
      setDaysLeft(Math.max(0, Math.ceil((season.endAt - Date.now()) / 86_400_000)));
    }, 0);
    return () => clearTimeout(id);
  }, [season.endAt]);
  const canAffordPremium = goldenTickets >= COSMETIC_PASS_PREMIUM_COST_TICKETS;

  const claimableCount = useMemo(() => {
    let count = 0;
    for (const l of COSMETIC_PASS_TRACK) {
      if (l.level > level) break;
      const freePending = !claimedFree.includes(l.level);
      const premiumPending = premium && !claimedPremium.includes(l.level);
      if (freePending || premiumPending) count += 1;
    }
    return count;
  }, [level, claimedFree, claimedPremium, premium]);

  const applyReward = (r: CosmeticReward) => {
    const clicker = useClickerStore.getState();
    switch (r.kind) {
      case 'millas':
        addMillas(r.amount);
        break;
      case 'cps':
        clicker.addEarnings(r.amount);
        break;
      case 'tickets':
        clicker.addGoldenTickets(r.amount);
        break;
      case 'collectible':
        useCollectibleStore.getState().grantRandom();
        break;
      case 'cosmetic':
        useCustomizationStore.getState().buy(r.partId);
        break;
    }
  };

  const handleClaim = (lvl: number) => {
    const result = useCosmeticPassStore.getState().claimLevel(lvl);
    if (result.success) result.rewards.forEach(applyReward);
  };

  const handleUnlockPremium = () => {
    if (!canAffordPremium) return;
    const result = useClickerStore
      .getState()
      .spendGoldenTickets(COSMETIC_PASS_PREMIUM_COST_TICKETS);
    if (result.success) useCosmeticPassStore.getState().unlockPremium();
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
              <h1 className="font-fredoka font-black text-2xl text-white">
                {season.name} <span className="text-[#F472B6]">✨</span>
              </h1>
              <p className="text-slate-400 text-xs">
                Pase cosmético · quedan {daysLeft ?? '…'} días
              </p>
            </div>
            {premium && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-[#F472B6] to-[#DB2777] text-white text-xs font-black">
                <Crown size={12} /> PREMIUM
              </span>
            )}
          </div>

          {/* Nivel + estrellas */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F472B6] to-[#DB2777] flex flex-col items-center justify-center border-2 border-[#F9A8D4] shadow-lg flex-shrink-0">
              <span className="text-[9px] font-black text-white/80 uppercase">Nivel</span>
              <span className="font-fredoka font-black text-xl text-white leading-none">
                {level}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1">
                <span>⭐ {formatNumber(stars)} estrellas</span>
                <span>
                  {level >= COSMETIC_PASS_MAX_LEVEL
                    ? '¡Pase completado!'
                    : `${starsIntoLevel}/${COSMETIC_PASS_STARS_PER_LEVEL} ⭐ al nivel ${level + 1}`}
                </span>
              </div>
              <div className="h-3 rounded-full bg-black/40 overflow-hidden border border-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#F472B6] to-[#F9A8D4]"
                  animate={{ width: `${starsProgress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <p className="text-slate-500 text-[10px] mt-1">
                Gana ⭐: 1 por minuto de sesión, +10 por ascensión, +5 por set del álbum.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Premium upsell */}
      {!premium && (
        <div className="mx-4 mt-4 rounded-2xl p-4 border-2 border-[#F472B6]/50 bg-gradient-to-br from-[#500F35] via-[#831843] to-[#500F35] flex items-center gap-3">
          <Crown size={28} className="text-[#F9A8D4] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-fredoka font-black text-white text-sm">Premium Glamour</p>
            <p className="text-[#FBCFE8] text-[11px]">
              10 cosméticos exclusivos: estelas, marcos de avatar, luces y skins. Sin bonus de CPS.
            </p>
          </div>
          <button
            onClick={handleUnlockPremium}
            disabled={!canAffordPremium}
            className={cn(
              'flex-shrink-0 px-3 py-2 rounded-xl font-black text-xs border-b-4 transition-all',
              canAffordPremium
                ? 'bg-gradient-to-b from-[#F9A8D4] to-[#DB2777] text-white border-[#9D174D] active:translate-y-0.5 active:border-b-0'
                : 'bg-slate-700/60 text-slate-400 border-transparent cursor-not-allowed'
            )}
          >
            {COSMETIC_PASS_PREMIUM_COST_TICKETS} 🎟️
          </button>
        </div>
      )}

      {/* Track de niveles (horizontal) */}
      <div className="mt-5">
        <div className="flex items-center justify-between px-4 mb-2">
          <h2 className="font-fredoka font-bold text-lg text-slate-900">Track de recompensas</h2>
          {claimableCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-[#16A34A] text-white text-[10px] font-black">
              {claimableCount} por reclamar
            </span>
          )}
        </div>
        <div className="flex gap-3 overflow-x-auto px-4 pb-4 custom-scrollbar">
          {COSMETIC_PASS_TRACK.map((l) => {
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
                    ? 'bg-white border-[#F472B6]/60 shadow-[0_2px_12px_rgba(244,114,182,0.15)]'
                    : 'bg-slate-100 border-slate-200'
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center font-fredoka font-black text-xs',
                      reached ? 'bg-[#F472B6] text-white' : 'bg-slate-300 text-slate-500'
                    )}
                  >
                    {l.level}
                  </span>
                  {reached ? (
                    freeClaimed && (!premium || premiumClaimed) ? (
                      <Check size={16} className="text-[#16A34A]" />
                    ) : (
                      <Star size={16} className="text-[#F472B6]" />
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
                    'rounded-xl px-2 py-1.5 text-center text-[10px] font-black flex items-center justify-center gap-1 leading-tight',
                    premiumClaimed
                      ? 'bg-slate-100 text-slate-400 line-through'
                      : premium && reached
                        ? 'bg-[#F472B6]/15 text-[#BE185D]'
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
                      ? 'bg-gradient-to-b from-[#F9A8D4] to-[#DB2777] text-white border-b-2 border-[#9D174D] active:translate-y-0.5 active:border-b-0'
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
