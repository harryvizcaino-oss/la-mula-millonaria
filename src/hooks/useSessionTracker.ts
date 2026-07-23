import { useEffect } from 'react';
import { useSessionRewardStore } from '@/store/sessionRewardStore';
import { useCosmeticPassStore } from '@/store/cosmeticPassStore';
import { useGlobalChallengeStore } from '@/store/globalChallengeStore';

/**
 * Latido global de sesión (1s): mientras la pestaña está visible acumula el
 * tiempo activo de las recompensas de sesión (F13), suma 1 estrella del pase
 * cosmético por minuto activo (F16) y consolida el progreso pasivo de los
 * desafíos globales (F15, horneado internamente cada 30s).
 */
export function useSessionTracker() {
  useEffect(() => {
    let starCarryMs = 0;
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      useSessionRewardStore.getState().tick(1000);
      useGlobalChallengeStore.getState().syncPassive();
      starCarryMs += 1000;
      if (starCarryMs >= 60_000) {
        starCarryMs -= 60_000;
        useCosmeticPassStore.getState().addStars(1);
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);
}
