import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface MillasBadgeProps {
  count: number;
  className?: string;
  showLabel?: boolean;
}

export default function MillasBadge({ count, className, showLabel = false }: MillasBadgeProps) {
  const [displayCount, setDisplayCount] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    const duration = 1500;
    const start = displayCount;
    const end = count;
    const diff = end - start;
    if (diff === 0) return;

    setIsPulsing(true);
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayCount(Math.round(start + diff * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(() => setIsPulsing(false), 300);
      }
    };

    requestAnimationFrame(animate);
  }, [count]);

  const formattedCount = displayCount.toLocaleString('es-CO');

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
        'bg-gradient-to-r from-[#F59E0B] to-[#F97316]',
        'shadow-glow-millas transition-transform duration-300',
        isPulsing && 'scale-115',
        className
      )}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        className="text-white flex-shrink-0"
      >
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <text
          x="12"
          y="16"
          textAnchor="middle"
          fill="currentColor"
          fontSize="10"
          fontWeight="bold"
          fontFamily="Fredoka, sans-serif"
        >
          M
        </text>
      </svg>
      <span className="text-white font-fredoka font-bold text-xs tracking-wide">
        {formattedCount}
      </span>
      {showLabel && (
        <span className="text-white/80 text-[10px] font-medium ml-0.5">
          TicaMillas
        </span>
      )}
    </div>
  );
}
