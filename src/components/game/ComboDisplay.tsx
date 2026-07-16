import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useComboStore } from '@/store/comboStore';

const TIER_COLORS = ['#FFFFFF', '#FEF08A', '#FDE047', '#FB923C', '#EF4444'];

interface BurstParticle {
  id: number;
  dx: number;
  dy: number;
}

export function ComboDisplay() {
  const comboCount = useComboStore((s) => s.comboCount);
  const comboMultiplier = useComboStore((s) => s.comboMultiplier);
  const comboTier = useComboStore((s) => s.comboTier);
  const lastClickAt = useComboStore((s) => s.lastClickAt);
  const comboActive = useComboStore((s) => s.comboActive);

  const [burst, setBurst] = useState<BurstParticle[]>([]);

  const visible = comboActive && comboCount >= 2;
  const color = TIER_COLORS[comboTier] ?? TIER_COLORS[0];

  // Burst de 20 partículas doradas cada 10 de combo
  useEffect(() => {
    if (comboCount > 0 && comboCount % 10 === 0) {
      const particles: BurstParticle[] = Array.from({ length: 20 }, (_, i) => {
        const angle = (i / 20) * Math.PI * 2 + Math.random() * 0.3;
        const dist = 50 + Math.random() * 70;
        return { id: Date.now() + i, dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist };
      });
      setBurst(particles);
      const t = setTimeout(() => setBurst([]), 650);
      return () => clearTimeout(t);
    }
  }, [comboCount]);

  const burstEls = useMemo(
    () =>
      burst.map((p) => (
        <span
          key={p.id}
          className="combo-burst-particle"
          style={{ '--dx': `${p.dx}px`, '--dy': `${p.dy}px` } as React.CSSProperties}
        />
      )),
    [burst]
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="combo-display"
          initial={{ opacity: 0, y: -12, scale: 0.7 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, rotate: -10, transition: { duration: 0.4, ease: 'easeIn' } }}
          className="combo-display"
        >
          {burstEls}
          <span
            className={comboTier >= 4 ? 'combo-mult combo-mult--max' : 'combo-mult'}
            style={{ color }}
          >
            x{comboMultiplier}
          </span>
          <span className="combo-label">COMBO</span>
          <div className="combo-timer">
            <div
              key={lastClickAt}
              className="combo-timer-fill"
              style={{ backgroundColor: color }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
