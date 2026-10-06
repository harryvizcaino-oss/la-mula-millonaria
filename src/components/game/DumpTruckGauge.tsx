import { cn } from '@/lib/utils';

interface DumpTruckGaugeProps {
  /** Carga 0..100 (arena dentro del volquete). */
  charge: number;
  /** Multiplicador objetivo (ej. "×2"). */
  label: string;
  /** Multiplicador activo (la carga > 0 está "corriendo"). */
  active: boolean;
  /** Crece con el nivel de milestone (volcos más grandes). */
  size?: number;
  className?: string;
}

/**
 * Volquete (dump truck) que se llena de arena con cada click.
 * Sustituye a la barra THICK: la arena sube con `charge` y al 100% el volco
 * "vuelca" (lo maneja el padre, que resetea charge y activa el multiplicador).
 */
export function DumpTruckGauge({
  charge,
  label,
  active,
  size = 120,
  className,
}: DumpTruckGaugeProps) {
  const pct = Math.max(0, Math.min(100, charge));
  // Nivel de arena (0..1) que define la altura del relleno en la caja.
  const fill = pct / 100;

  // Caja del volquete (coordenadas relativas al viewBox 120x90).
  const box = { x: 30, y: 18, w: 62, h: 36 };

  return (
    <div
      className={cn('relative inline-flex flex-col items-center select-none', className)}
      style={{ width: size, height: size }}
      aria-label={`Volquete ${label} al ${pct}%`}
    >
      <svg viewBox="0 0 120 90" width={size} height={size} className="drop-shadow-[0_6px_14px_rgba(0,0,0,0.45)]">
        <defs>
          <linearGradient id="dump-sand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="dump-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
          <clipPath id="dump-box-clip">
            <path d={`M ${box.x} ${box.y} h ${box.w} l -8 ${box.h} h -${box.w - 8} z`} />
          </clipPath>
        </defs>

        {/* Arena dentro de la caja (sube con charge) */}
        <g clipPath="url(#dump-box-clip)">
          <rect
            x={box.x}
            y={box.y + box.h * (1 - fill)}
            width={box.w}
            height={box.h * fill}
            fill="url(#dump-sand)"
          />
        </g>

        {/* Caja del volquete (trapecio) */}
        <path
          d={`M ${box.x} ${box.y} h ${box.w} l -8 ${box.h} h -${box.w - 8} z`}
          fill="none"
          stroke="#B45309"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Marco superior de la caja */}
        <line x1={box.x} y1={box.y} x2={box.x + box.w} y2={box.y} stroke="#B45309" strokeWidth="2.5" />

        {/* Chasis y cabina */}
        <rect x="10" y="60" width="100" height="8" rx="3" fill="#92400E" />
        <rect x="10" y="52" width="18" height="16" rx="3" fill="#F59E0B" />
        <rect x="13" y="55" width="12" height="8" rx="2" fill="#7C2D12" opacity="0.6" />

        {/* Ruedas */}
        <circle cx="30" cy="72" r="7" fill="#1F2937" />
        <circle cx="30" cy="72" r="3" fill="#94A3B8" />
        <circle cx="88" cy="72" r="7" fill="#1F2937" />
        <circle cx="88" cy="72" r="3" fill="#94A3B8" />

        {/* Brillo de carga activa */}
        {active && (
          <circle cx="55" cy="30" r="3" fill="#FFD700">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
          </circle>
        )}
      </svg>

      {/* Etiqueta del multiplicador objetivo */}
      <div
        className={cn(
          'mt-1 px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider',
          active ? 'bg-[#F59E0B] text-[#0D0E14]' : 'bg-white/10 text-[#F59E0B] border border-[#F59E0B]/30'
        )}
      >
        {label}
      </div>
    </div>
  );
}
