import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';
import { getBrandTier, type SponsorPower } from '@/data/sponsorPowers';
import { ProductBadge } from '@/components/game/ProductBadge';

function formatFull(n: number): string {
  return Math.floor(n).toLocaleString('es-CO');
}

/** Formato compacto para el costo (15.2K, 3.9M, 2.0B...). */
function formatCompact(n: number): string {
  if (n < 1000) return Math.floor(n).toLocaleString('es-CO');
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}K`;
  if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(n < 10_000_000 ? 2 : 1)}M`;
  if (n < 1_000_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  return `${(n / 1_000_000_000_000).toFixed(2)}T`;
}

/** Mezcla un color hex con blanco (pct > 0) o negro (pct < 0) para derivar light/dark. */
export function shadeHex(hex: string, pct: number): string {
  const m = hex.replace('#', '');
  if (m.length !== 6) return hex;
  const num = parseInt(m, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const target = pct > 0 ? 255 : 0;
  const p = Math.abs(pct);
  const mix = (c: number) => Math.round(c + (target - c) * p);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

/** Texto legible sobre un badge pintado con el color del tier. */
function contrastTextColor(hex: string): string {
  const m = hex.replace('#', '');
  if (m.length !== 6) return '#FFFFFF';
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum >= 0.55 ? '#1a1a2e' : '#FFFFFF';
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
 * Tarjeta de poder patrocinado V8 — HORIZONTAL glossy (90px):
 * - Fondo gradiente #FAFBFC → #F0F2F5, radius 16px, sombra suave.
 * - 5 elementos: badge glossy circular 56px (ProductBadge + colores del tier)
 *   | título del poder 14px bold #1a1a2e | MARCA HERO 22px 900 uppercase
 *   (TEXT_BADGE con el color del tier — los logos de marca NO existen como
 *   imágenes) | stats "+N verdes" (verde Space Mono) + costo compacto |
 *   botón BUY glossy circular verde 48px ("+").
 * - Al subir de tier: gold flash 300ms → marca escribe letra por letra →
 *   transición de color del badge → confetti dorado → toast (padre, onTierUp).
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
  const prevTierRef = useRef(getBrandTier(power, level));
  const timersRef = useRef<number[]>([]);

  const tier = getBrandTier(power, level);

  useEffect(
    () => () => {
      timersRef.current.forEach((t) => clearTimeout(t));
    },
    []
  );

  // Detecta el cambio de tier y dispara la secuencia completa de celebración
  useEffect(() => {
    const prev = prevTierRef.current;
    if (level > 0 && tier.tier > prev.tier) {
      // 1) Gold flash 300ms
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

      // 3) Confetti dorado desde la tarjeta
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

      // 4) Toast "Nueva marca desbloqueada" (en el padre)
      const pctGain = Math.round((tier.multiplier / prev.multiplier - 1) * 100);
      onTierUp(power, tier.brand, pctGain);
    }
    prevTierRef.current = tier;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  const shownBrand = typedBrand ?? tier.brand;
  const perLevelCps = power.baseCPS * tier.multiplier;
  const perLevelText = Number.isInteger(perLevelCps)
    ? formatFull(perLevelCps)
    : perLevelCps.toLocaleString('es-CO', { maximumFractionDigits: 1 });

  return (
    <div
      ref={cardRef}
      className={cn(
        'sponsor-card-v8 relative overflow-hidden',
        canAfford && !isMaxed && 'affordable-glow'
      )}
      style={{
        ['--product-color' as string]: tier.color,
        ['--product-color-light' as string]: shadeHex(tier.color, 0.45),
        ['--product-color-dark' as string]: shadeHex(tier.color, -0.35),
      }}
    >
      {/* Gold flash 300ms al cambiar de tier */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0.85 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute inset-0 z-20 pointer-events-none rounded-2xl bg-gradient-to-br from-[#FFF7CC] to-[#FDE047]"
          />
        )}
      </AnimatePresence>

      {/* 1) Badge glossy circular 56px con el icono del producto */}
      <div className="sponsor-v8-badge">
        <ProductBadge index={badgeIndex} size={38} />
      </div>

      {/* 2-4) Título + MARCA HERO + stats */}
      <div className="sponsor-v8-center">
        <h3 className="sponsor-v8-title">{power.name}</h3>
        <span
          className="brand-hero-badge"
          style={{ backgroundColor: tier.color, color: contrastTextColor(tier.color) }}
          title={`Marca patrocinadora · Tier ${tier.tier}/10 · x${tier.multiplier}`}
        >
          {shownBrand}
          {typedBrand !== null && <span className="type-cursor">▍</span>}
        </span>
        <div className="sponsor-v8-stats">
          <span className="sponsor-v8-gain">+{perLevelText}</span>
          <span className="sponsor-v8-gain-label">verdes</span>
          <span className="sponsor-v8-cost">{isMaxed ? 'MAX' : formatCompact(cost)}</span>
        </div>
      </div>

      {/* 5) Botón BUY glossy circular verde 48px */}
      <button
        onClick={(e) => onBuy(power.id, e.currentTarget as HTMLElement)}
        disabled={!canAfford || isMaxed}
        className="buy-btn-circle buy-btn-circle--v8"
        aria-label={isMaxed ? `${power.name} al nivel máximo` : `Comprar nivel ${level + 1} de ${power.name}`}
        title={isMaxed ? 'Nivel máximo' : `Comprar nivel ${level + 1} · ${formatCompact(cost)}`}
      >
        {isMaxed ? '✓' : '+'}
      </button>
    </div>
  );
}
