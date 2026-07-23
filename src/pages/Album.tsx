import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Lock, Package, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';
import {
  COLLECTIBLE_SETS,
  COLLECTIBLES,
  RARITY_COLORS,
  RARITY_LABELS,
  collectiblesOfSet,
  computeAlbumBonus,
  isSetComplete,
} from '@/data/collectibles';
import { useCollectibleStore, type CollectibleDrop } from '@/store/collectibleStore';
import { useClickerStore } from '@/store/clickerStore';
import { useMillas } from '@/providers/MillasProvider';

/** Costos del sobre de coleccionable aleatorio. */
export const PACK_COST_CPS = 100_000;
export const PACK_COST_TICKETS = 25;
/** Consolación en millas cuando el sobre sale duplicado. */
const DUPLICATE_MILLAS = 500;

function formatNumber(n: number): string {
  if (n < 1000) return n.toLocaleString('es-CO', { maximumFractionDigits: 0 });
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}K`;
  if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(n < 10_000_000 ? 2 : 1)}M`;
  return `${(n / 1_000_000_000).toFixed(2)}B`;
}

export default function Album() {
  const navigate = useNavigate();
  const owned = useCollectibleStore((s) => s.owned);
  const grantRandom = useCollectibleStore((s) => s.grantRandom);
  const cpsBalance = useClickerStore((s) => s.cpsBalance);
  const goldenTickets = useClickerStore((s) => s.goldenTickets);
  const { addMillas } = useMillas();

  const [lastDrop, setLastDrop] = useState<CollectibleDrop | null>(null);

  const bonusPct = Math.round((computeAlbumBonus(owned) - 1) * 100);
  const completedSets = COLLECTIBLE_SETS.filter((s) => isSetComplete(s.id, owned)).length;

  const handleDropResult = (drop: CollectibleDrop) => {
    setLastDrop(drop);
    if (!drop.isNew) addMillas(DUPLICATE_MILLAS);
    if (drop.isNew) {
      confetti({
        particleCount: drop.setCompleted ? 90 : 40,
        spread: 70,
        origin: { y: 0.4 },
        colors: ['#FFD700', '#F59E0B', RARITY_COLORS[drop.def.rarity]],
      });
    }
  };

  const handleBuyPackCps = () => {
    if (!useClickerStore.getState().redeemCps(PACK_COST_CPS).success) return;
    handleDropResult(grantRandom());
  };

  const handleBuyPackTickets = () => {
    if (!useClickerStore.getState().spendGoldenTickets(PACK_COST_TICKETS).success) return;
    handleDropResult(grantRandom());
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
              <h1 className="font-fredoka font-black text-2xl text-white">Álbum de Coleccionables</h1>
              <p className="text-slate-400 text-xs">
                {owned.length}/{COLLECTIBLES.length} coleccionables · {completedSets}/
                {COLLECTIBLE_SETS.length} sets completos
              </p>
            </div>
            {bonusPct > 0 && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 text-[#0D0E14] text-xs font-black">
                <Sparkles size={12} /> +{bonusPct}% CPS
              </span>
            )}
          </div>

          {/* Comprar sobres */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 flex items-center gap-3">
            <Package size={24} className="text-[#F59E0B] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-fredoka font-black text-white text-sm">Sobre sorpresa</p>
              <p className="text-slate-400 text-[11px]">
                1 coleccionable aleatorio (duplicado = +{DUPLICATE_MILLAS} M)
              </p>
            </div>
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <button
                onClick={handleBuyPackCps}
                disabled={cpsBalance < PACK_COST_CPS}
                className={cn(
                  'px-3 py-1.5 rounded-xl font-black text-[11px] border-b-2 transition-all',
                  cpsBalance >= PACK_COST_CPS
                    ? 'bg-gradient-to-b from-[#FACC15] to-[#D97706] text-[#451a03] border-[#92400E] active:translate-y-0.5 active:border-b-0'
                    : 'bg-slate-700/60 text-slate-400 border-transparent cursor-not-allowed'
                )}
              >
                {formatNumber(PACK_COST_CPS)} ⚡
              </button>
              <button
                onClick={handleBuyPackTickets}
                disabled={goldenTickets < PACK_COST_TICKETS}
                className={cn(
                  'px-3 py-1.5 rounded-xl font-black text-[11px] border-b-2 transition-all',
                  goldenTickets >= PACK_COST_TICKETS
                    ? 'bg-gradient-to-b from-[#F472B6] to-[#DB2777] text-white border-[#9D174D] active:translate-y-0.5 active:border-b-0'
                    : 'bg-slate-700/60 text-slate-400 border-transparent cursor-not-allowed'
                )}
              >
                {PACK_COST_TICKETS} 🎟️
              </button>
            </div>
          </div>

          {/* Último drop */}
          <AnimatePresence>
            {lastDrop && (
              <motion.div
                key={`${lastDrop.def.id}-${lastDrop.isNew}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 rounded-2xl border border-[#F59E0B]/40 bg-white/5 p-3 flex items-center gap-3"
              >
                <span className="text-3xl">{lastDrop.def.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold truncate">
                    {lastDrop.isNew ? `¡Nuevo: ${lastDrop.def.name}!` : `Duplicado: ${lastDrop.def.name}`}
                  </p>
                  <p className="text-[11px] font-semibold" style={{ color: RARITY_COLORS[lastDrop.def.rarity] }}>
                    {RARITY_LABELS[lastDrop.def.rarity]}
                    {lastDrop.setCompleted && ' · ¡Set completado! +5 ⭐ pase'}
                    {!lastDrop.isNew && ` · +${DUPLICATE_MILLAS} M`}
                  </p>
                </div>
                <button
                  onClick={() => setLastDrop(null)}
                  className="text-slate-500 text-xs font-bold px-2"
                >
                  OK
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Sets */}
      <div className="px-4 mt-5 space-y-5">
        {COLLECTIBLE_SETS.map((set) => {
          const items = collectiblesOfSet(set.id);
          const ownedInSet = items.filter((c) => owned.includes(c.id)).length;
          const complete = isSetComplete(set.id, owned);
          return (
            <div key={set.id}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="font-fredoka font-bold text-lg text-slate-900">
                    {set.emoji} {set.name}
                  </h2>
                  <p className="text-slate-500 text-[11px]">{set.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span
                    className={cn(
                      'text-xs font-black',
                      complete ? 'text-emerald-600' : 'text-slate-500'
                    )}
                  >
                    {ownedInSet}/{items.length}
                  </span>
                  <p className="text-[#F59E0B] text-[10px] font-bold">+{set.bonusPct}% CPS</p>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mb-2">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    complete
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      : 'bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]'
                  )}
                  style={{ width: `${(ownedInSet / items.length) * 100}%` }}
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {items.map((c) => {
                  const isOwned = owned.includes(c.id);
                  return (
                    <div
                      key={c.id}
                      className={cn(
                        'rounded-2xl border p-2 flex flex-col items-center text-center bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]',
                        isOwned ? 'border-[#F59E0B]/50' : 'border-slate-200 opacity-60'
                      )}
                    >
                      <span className="text-2xl">{isOwned ? c.emoji : '❓'}</span>
                      <p className="text-slate-900 text-[10px] font-bold leading-tight mt-1 truncate w-full">
                        {isOwned ? c.name : '???'}
                      </p>
                      <p
                        className="text-[9px] font-semibold"
                        style={{ color: isOwned ? RARITY_COLORS[c.rarity] : '#94A3B8' }}
                      >
                        {isOwned ? RARITY_LABELS[c.rarity] : <Lock size={9} className="inline" />}
                      </p>
                      {complete && isOwned && <Check size={10} className="text-emerald-500 mt-0.5" />}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
