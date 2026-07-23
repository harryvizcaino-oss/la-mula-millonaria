import { useEffect, useRef } from 'react';
import { useMillas } from '@/providers/MillasProvider';
import { useClickerStore } from '@/store/clickerStore';

export function ClickerEngine() {
  const { addMillas } = useMillas();
  const tick = useClickerStore((s) => s.tick);
  const offlineEarnings = useClickerStore((s) => s.offlineEarnings);
  const clearOfflineEarnings = useClickerStore((s) => s.clearOfflineEarnings);
  const appliedOfflineRef = useRef(false);

  // Apply offline earnings once on mount
  useEffect(() => {
    if (!appliedOfflineRef.current && offlineEarnings > 0) {
      appliedOfflineRef.current = true;
      addMillas(Math.floor(offlineEarnings));
      clearOfflineEarnings();
    }
  }, [offlineEarnings, addMillas, clearOfflineEarnings]);

  // Continuous production loop (kept for compatibility; per-click economy means earned is 0)
  useEffect(() => {
    const interval = setInterval(() => {
      const earned = tick(0.2);
      if (earned > 0) {
        addMillas(Math.floor(earned));
      }
    }, 200);
    return () => clearInterval(interval);
  }, [tick, addMillas]);

  return null;
}
