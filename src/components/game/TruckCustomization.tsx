import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Lock, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMillas } from '@/providers/MillasProvider';
import { useClickerStore } from '@/store/clickerStore';
import { useCustomizationStore } from '@/store/customizationStore';
import {
  computeCustomizationBonus,
  CUSTOM_CATEGORIES,
  getTruckVisual,
  partsByCategory,
  type CustomCategory,
  type TruckPart,
} from '@/data/truckSkins';
import { getTruckAsset } from '@/data/truckAssets';

function formatNumber(n: number): string {
  if (n < 1000) return n.toLocaleString('es-CO', { maximumFractionDigits: 0 });
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}K`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

const CURRENCY_META = {
  millas: { emoji: '💵', label: 'Millas' },
  tickets: { emoji: '🎟️', label: 'Tickets' },
  cps: { emoji: '⚡', label: 'CPS' },
} as const;

interface TruckCustomizationProps {
  onToast?: (text: string, color?: string) => void;
}

/**
 * El Taller (F8): personalización del camión por categorías. Comprar cobra
 * la moneda correspondiente (millas/tickets/CPS) y equipar aplica la pieza
 * al preview y al camión del juego.
 */
export function TruckCustomization({ onToast }: TruckCustomizationProps) {
  const { millas, addMillas } = useMillas();
  const goldenTickets = useClickerStore((s) => s.goldenTickets);
  const cpsBalance = useClickerStore((s) => s.cpsBalance);
  const selectedFleet = useClickerStore((s) => s.selectedFleet);
  const owned = useCustomizationStore((s) => s.owned);
  const equipped = useCustomizationStore((s) => s.equipped);

  const [category, setCategory] = useState<CustomCategory>('skin');

  const visual = useMemo(() => getTruckVisual(equipped), [equipped]);
  const bonusPct = Math.round((computeCustomizationBonus(equipped) - 1) * 100);
  // F16: las piezas exclusivas del pase cosmético solo se muestran si ya se ganaron
  const parts = partsByCategory(category).filter((p) => !p.passExclusive || owned.includes(p.id));

  const balanceFor = (part: TruckPart): number => {
    if (part.currency === 'millas') return millas;
    if (part.currency === 'tickets') return goldenTickets;
    return cpsBalance;
  };

  const chargePart = (part: TruckPart): boolean => {
    if (part.currency === 'millas') {
      if (millas < part.cost) return false;
      addMillas(-part.cost);
      return true;
    }
    if (part.currency === 'tickets') {
      return useClickerStore.getState().redeemGoldenTickets(part.cost).success;
    }
    return useClickerStore.getState().redeemCps(part.cost).success;
  };

  const handleBuy = (part: TruckPart) => {
    if (owned.includes(part.id)) {
      useCustomizationStore.getState().equip(part.id);
      onToast?.(`${part.name} equipado`, '#3B82F6');
      return;
    }
    if (!chargePart(part)) {
      onToast?.(`Te faltan ${CURRENCY_META[part.currency].label}`, '#EF4444');
      return;
    }
    useCustomizationStore.getState().buy(part.id);
    useCustomizationStore.getState().equip(part.id);
    onToast?.(`¡${part.name} en tu taller!`, '#16A34A');
  };

  return (
    <div className="rounded-2xl bg-white border-2 border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-fredoka font-black text-lg text-slate-900 flex items-center gap-1.5">
          <Wrench size={18} className="text-[#F59E0B]" />
          El Taller
        </h3>
        {bonusPct > 0 && (
          <span className="text-[11px] font-black text-[#16A34A] bg-[#16A34A]/10 px-2 py-1 rounded-full">
            Bonus: +{bonusPct}%
          </span>
        )}
      </div>
      <p className="text-slate-500 text-[11px] mb-3">
        Personaliza tu mula: skins, bocinas, luces, remolques y stickers.
      </p>

      {/* Preview del camión */}
      <div className="relative rounded-2xl bg-gradient-to-b from-[#1A1B26] to-[#0D0E14] border border-white/10 h-36 flex items-center justify-center overflow-hidden mb-4">
        {visual.trailerEmoji && (
          <span className="absolute right-10 bottom-4 text-4xl opacity-90">
            {visual.trailerEmoji}
          </span>
        )}
        <motion.img
          key={`${selectedFleet}-${visual.filter ?? 'base'}`}
          src={getTruckAsset(selectedFleet)}
          alt="Tu camión"
          draggable={false}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="h-24 object-contain relative z-10"
          style={visual.filter ? { filter: visual.filter } : undefined}
        />
        {visual.stickerEmoji && (
          <span className="absolute z-20 text-2xl" style={{ transform: 'translate(34px, -6px)' }}>
            {visual.stickerEmoji}
          </span>
        )}
      </div>

      {/* Categorías */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-3 custom-scrollbar">
        {CUSTOM_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={cn(
              'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-1',
              category === c.id
                ? 'bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-[#0D0E14]'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            )}
          >
            <span>{c.emoji}</span>
            {c.label}
          </button>
        ))}
      </div>

      {/* Piezas de la categoría */}
      <div className="space-y-2">
        {parts.map((part) => {
          const isOwned = owned.includes(part.id);
          const isEquipped = equipped[part.category] === part.id;
          const affordable = isOwned || balanceFor(part) >= part.cost;
          const meta = CURRENCY_META[part.currency];
          return (
            <div
              key={part.id}
              className={cn(
                'flex items-center gap-3 rounded-xl border-2 p-3 transition-all',
                isEquipped
                  ? 'border-[#F59E0B] bg-[#F59E0B]/5'
                  : 'border-slate-200 bg-white'
              )}
            >
              <div
                className={cn(
                  'w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0',
                  isEquipped ? 'bg-[#F59E0B]/20' : 'bg-slate-100'
                )}
              >
                {part.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-fredoka font-black text-sm text-slate-900 flex items-center gap-1.5">
                  {part.name}
                  {part.bonusPct ? (
                    <span className="text-[9px] font-black text-[#16A34A] bg-[#16A34A]/10 px-1.5 py-0.5 rounded-full">
                      +{part.bonusPct}%
                    </span>
                  ) : null}
                </p>
                <p className="text-slate-500 text-[11px] truncate">{part.description}</p>
                {!isOwned && (
                  <p className="text-[11px] font-black text-slate-700 mt-0.5">
                    {meta.emoji} {formatNumber(part.cost)}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleBuy(part)}
                disabled={!affordable && !isOwned}
                className={cn(
                  'flex-shrink-0 px-3 py-2 rounded-xl font-black text-[11px] tracking-wide transition-all flex items-center gap-1',
                  isEquipped
                    ? 'bg-[#16A34A] text-white cursor-default'
                    : isOwned
                      ? 'bg-gradient-to-b from-[#3B82F6] to-[#2563EB] text-white border-b-2 border-[#1E40AF] active:translate-y-0.5 active:border-b-0'
                      : affordable
                        ? 'bg-gradient-to-b from-[#22C55E] to-[#16A34A] text-white border-b-2 border-[#14532D] active:translate-y-0.5 active:border-b-0'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                )}
              >
                {isEquipped ? (
                  <>
                    <Check size={12} /> Equipado
                  </>
                ) : isOwned ? (
                  'Equipar'
                ) : affordable ? (
                  'Comprar'
                ) : (
                  <>
                    <Lock size={11} /> {formatNumber(part.cost)}
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
