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
  level: number;
  cost: number;
  canAfford: boolean;
  isMaxed: boolean;
  onBuy: (id: string, el: HTMLElement) => void;
  onTierUp: (power: SponsorPower, brand: string, pctGain: number) => void;
}

/**
 * Tarjeta de poder patrocinado (SECTION D / V4 + V6):
 * - La MARCA es el título hero (18px, font-weight 900); el poder es subtítulo.
 * - Franja izquierda de 4px con el color de la marca (transición 500ms).
 * - Al subir de tier: white flash 300ms → marca escribe letra por letra →
 *   transición de color de borde → count-up del multiplicador → confetti
 *   dorado → toast (lo dispara el padre vía onTierUp).
 */
export function SponsorPowerCard({
  power,
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

  return (
    <div
      ref={cardRef}
      className={cn(
        'brand-card building-card-v2 relative w-full rounded-2xl p-3 overflow-hidden',
        canAfford && !isMaxed && 'affordable-glow'
      )}
      style={{ borderLeft: `4px solid ${tier.color}` }}
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

      <div className="flex items-center gap-3">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 border-2 shadow-inner transition-colors duration-500"
          style={{ backgroundColor: `${tier.color}25`, borderColor: `${tier.color}70` }}
        >
          {power.emoji}
        </div>

        <div className="flex-1 min-w-0">
          {/* MARCA como título hero (18px / 900) */}
          <h3
            className="truncate leading-tight transition-colors duration-500"
            style={{ fontSize: 18, fontWeight: 900, color: brandColor }}
          >
            {shownBrand}
            {typedBrand !== null && <span className="type-cursor">▍</span>}
          </h3>
          {/* Nombre del poder como subtítulo */}
          <p className="text-slate-300 text-xs truncate">
            {power.name} · Tier {tier.tier}/10
          </p>
          <p className="text-slate-400 text-[11px] mt-0.5">
            {level > 0 ? (
              <>
                Aporta <span className="text-[#4ADE80] font-bold">{formatFull(cpsNow)} CPS</span>
                {' · '}
              </>
            ) : (
              <>Base +{formatFull(power.baseCPS)} CPS/nivel · </>
            )}
            Nv {level}
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

        {/* Multiplicador de marca con count-up */}
        <div className="flex flex-col items-center flex-shrink-0 w-12">
          <span
            className="font-fredoka font-black text-lg leading-none transition-colors duration-500"
            style={{ color: brandColor }}
          >
            x{shownMult.toFixed(1)}
          </span>
          <span className="text-[8px] uppercase tracking-wider text-slate-400 mt-0.5">marca</span>
        </div>
      </div>

      {/* Botón de compra glossy verde */}
      <button
        onClick={(e) => onBuy(power.id, e.currentTarget as HTMLElement)}
        disabled={!canAfford || isMaxed}
        className={cn(
          'buy-btn-glossy mt-2.5 w-full py-2.5 rounded-xl font-black text-sm tracking-wide',
          (!canAfford || isMaxed) && 'buy-btn-glossy--disabled'
        )}
      >
        {isMaxed ? 'NIVEL MÁXIMO' : `COMPRAR NIVEL ${level + 1} · ${formatFull(cost)} CPS`}
      </button>
    </div>
  );
}
