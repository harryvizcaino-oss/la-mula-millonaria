import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';
import {
  getBrandTier,
  getSponsorPowerCPS,
  getTierProgress,
  LEVELS_PER_TIER,
  type SponsorPower,
} from '@/data/sponsorPowers';
import { ProductBadge } from '@/components/game/ProductBadge';

function formatFull(n: number): string {
  return Math.floor(n).toLocaleString('es-CO');
}

/** Aclara colores de marca muy oscuros para que el título hero sea legible. */
function readableBrandColor(hex: string): string {
  const m = hex.replace('#', '');
  if (m.length !== 6) return hex;
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (lum >= 0.28) return hex;
  const mix = (c: number) => Math.round(c * 255 + (255 - c * 255) * 0.6);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

interface SponsorPowerCardProps {
  power: SponsorPower;
  badgeIndex: number; // 1..10 → badge único del spritesheet de productos
  level: number;
  cost: number;
  canAfford: boolean;
  isMaxed: boolean;
  onBuy: (id: string, el: HTMLElement) => void;
  onTierUp: (power: SponsorPower, brand: string, pctGain: number) => void;
}

/**
 * Tarjeta de poder patrocinado (SECTION D / V4 + V6 + UI FIX 1-2):
 * - El PODER es el título principal (17px bold blanco); la MARCA es un
 *   tag pill top-right con el color del tier.
 * - Franja izquierda de 4px con el color de la marca (transición 500ms).
 * - Botón de compra circular compacto ("+") con el precio a su izquierda.
 * - Al subir de tier: white flash 300ms → marca escribe letra por letra →
 *   transición de color de borde → count-up del multiplicador → confetti
 *   dorado → toast (lo dispara el padre vía onTierUp).
 */
export function SponsorPowerCard({
  power,
  badgeIndex,
  level,
  cost,
  canAfford,
  isMaxed,
  onBuy,
  onTierUp,
}: SponsorPowerCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [flash, setFlash] = useState(false);
  const [typedBrand, setTypedBrand] = useState<string | null>(null);
  const [displayMult, setDisplayMult] = useState<number | null>(null);
  const prevTierRef = useRef(getBrandTier(power, level));
  const timersRef = useRef<number[]>([]);
  const rafRef = useRef(0);

  const tier = getBrandTier(power, level);
  const cpsNow = getSponsorPowerCPS(power, level);
  const brandColor = readableBrandColor(tier.color);
  const tierProgress = getTierProgress(level);
  const nextTier = tier.tier < power.tiers.length ? power.tiers[tier.tier] : null;

  useEffect(
    () => () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      cancelAnimationFrame(rafRef.current);
    },
    []
  );

  // Detecta el cambio de tier y dispara la secuencia completa de celebración
  useEffect(() => {
    const prev = prevTierRef.current;
    if (level > 0 && tier.tier > prev.tier) {
      // 1) White flash 300ms
      setFlash(true);
      timersRef.current.push(window.setTimeout(() => setFlash(false), 300));

      // 2) La nueva marca se escribe letra por letra (tras el flash)
      setTypedBrand('');
      const brandName = tier.brand;
      for (let i = 0; i < brandName.length; i++) {
        timersRef.current.push(
          window.setTimeout(() => setTypedBrand(brandName.slice(0, i + 1)), 300 + i * 45)
        );
      }
      timersRef.current.push(
        window.setTimeout(() => setTypedBrand(null), 300 + brandName.length * 45 + 1200)
      );

      // 4) Count-up del multiplicador (500ms)
      const from = prev.multiplier;
      const to = tier.multiplier;
      const start = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / 500);
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplayMult(from + (to - from) * eased);
        if (p < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          timersRef.current.push(window.setTimeout(() => setDisplayMult(null), 1500));
        }
      };
      rafRef.current = requestAnimationFrame(step);

      // 5) Confetti dorado desde la tarjeta
      const rect = cardRef.current?.getBoundingClientRect();
      if (rect) {
        confetti({
          particleCount: 45,
          spread: 70,
          startVelocity: 28,
          origin: {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
          },
          colors: ['#FFD700', '#F59E0B', '#FFF7CC', '#D4AF37'],
          scalar: 0.9,
          ticks: 120,
        });
      }

      // 6) Toast "New brand unlocked" (en el padre)
      const pctGain = Math.round((to / from - 1) * 100);
      onTierUp(power, tier.brand, pctGain);
    }
    prevTierRef.current = tier;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  const shownBrand = typedBrand ?? tier.brand;
  const shownMult = displayMult ?? tier.multiplier;
  const perLevelCps = power.baseCPS * tier.multiplier;
  const perLevelText = Number.isInteger(perLevelCps)
    ? formatFull(perLevelCps)
    : perLevelCps.toLocaleString('es-CO', { maximumFractionDigits: 1 });

  return (
    <div
      ref={cardRef}
      className={cn(
        'building-card-v2 sponsor-card relative w-full overflow-hidden',
        canAfford && !isMaxed && 'affordable-glow'
      )}
      style={{ ['--tier-color' as string]: tier.color }}
    >
      {/* White flash 300ms al cambiar de tier */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0.95 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute inset-0 bg-white z-20 pointer-events-none rounded-2xl"
          />
        )}
      </AnimatePresence>

      {/* MARCA como tag pill top-right */}
      <div className="brand-tag" title={`Marca patrocinadora · Tier ${tier.tier}/10`}>
        {shownBrand}
        {typedBrand !== null && <span className="type-cursor">▍</span>}
      </div>

      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border-2 shadow-inner transition-colors duration-500"
          style={{ backgroundColor: `${tier.color}25`, borderColor: `${tier.color}70` }}
        >
          <ProductBadge index={badgeIndex} size={40} />
        </div>

        <div className="flex-1 min-w-0 pr-20">
          {/* POWER TYPE como título principal + badge verde +baseCPS */}
          <div className="flex items-center gap-2">
            <h3 className="sponsor-card-title truncate leading-tight">{power.name}</h3>
            <span className="power-cps-badge" title="CPS base por nivel">
              +{formatFull(power.baseCPS)}
            </span>
          </div>
          <p className="text-slate-300 text-[11px] mt-0.5 truncate">
            +{perLevelText} CPS/nivel · Nivel {level}
            {isMaxed ? ' MAX' : ''}
          </p>
          {/* Progreso hacia la próxima marca */}
          {!isMaxed && nextTier && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(tierProgress / LEVELS_PER_TIER) * 100}%`,
                    backgroundColor: tier.color,
                  }}
                />
              </div>
              <span className="text-[9px] text-slate-400 whitespace-nowrap">
                {tierProgress}/{LEVELS_PER_TIER} → {nextTier.brand}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer: total CPS + multiplicador | precio + botón circular */}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="font-fredoka font-black text-base leading-none transition-colors duration-500"
            style={{ color: brandColor }}
            title="Multiplicador de la marca actual"
          >
            x{shownMult.toFixed(1)}
          </span>
          <span className="text-slate-400 text-[11px] truncate">
            {level > 0 ? (
              <>
                Aporta <span className="text-[#4ADE80] font-bold">{formatFull(cpsNow)} CPS</span>
              </>
            ) : (
              'Sin niveles aún'
            )}
          </span>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <span className="sponsor-card-price">
            {isMaxed ? 'MAX' : `💵 ${formatFull(cost)} CPS`}
          </span>
          <button
            onClick={(e) => onBuy(power.id, e.currentTarget as HTMLElement)}
            disabled={!canAfford || isMaxed}
            className="buy-btn-circle"
            aria-label={isMaxed ? `${power.name} al nivel máximo` : `Comprar nivel ${level + 1} de ${power.name}`}
            title={isMaxed ? 'Nivel máximo' : `Comprar nivel ${level + 1}`}
          >
            {isMaxed ? '✓' : '+'}
          </button>
        </div>
      </div>
    </div>
  );
}
