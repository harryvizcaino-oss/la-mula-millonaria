interface RadialGaugeProps {
  /** Progreso 0..1. */
  progress: number;
  /** Texto central (ej. "Nv 120"). */
  centerLabel: string;
  /** Subtexto bajo el centro (ej. "de 1000"). */
  subLabel?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
}

/**
 * Gauge radial (SVG) para mostrar progreso de forma compacta.
 * Sin librerías: arco con stroke-dasharray animado por CSS transition.
 */
export function RadialGauge({
  progress,
  centerLabel,
  subLabel,
  size = 88,
  strokeWidth = 8,
  color = '#F59E0B',
  trackColor = 'rgba(148,163,184,0.25)',
}: RadialGaugeProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: `drop-shadow(0 0 6px ${color})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-fredoka font-black text-slate-900 leading-none" style={{ fontSize: size * 0.22 }}>
          {centerLabel}
        </span>
        {subLabel && (
          <span className="text-slate-400 text-[9px] mt-0.5">{subLabel}</span>
        )}
      </div>
    </div>
  );
}
