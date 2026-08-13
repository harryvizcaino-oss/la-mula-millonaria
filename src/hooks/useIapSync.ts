import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useIapStore } from '@/store/iapStore';
import {
  flushScheduledIapSave,
  loadIapEntitlements,
  scheduleIapSave,
} from '@/lib/iapSync';

/**
 * Sincroniza entitlements IAP (ad-free / starter) con Supabase (best-effort):
 * - Al iniciar sesión carga `ad_free_until` / `starter_iap_bought` y los
 *   fusiona en iapStore.
 * - Ante cada cambio del store programa un guardado parcial con debounce de 5s.
 * - Si las columnas no existen, iapSync no-op y el estado local sigue mandando.
 */
export function useIapSync() {
  const { user, isLoading } = useAuth();
  const userId = user?.id ?? null;
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (isLoading || !userId || hydratedRef.current) return;
    hydratedRef.current = true;
    loadIapEntitlements(userId)
      .then(() => {
        flushScheduledIapSave(userId);
      })
      .catch((err) => {
        console.error('[useIapSync] Failed to load entitlements:', err);
      });
  }, [isLoading, userId]);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = useIapStore.subscribe(() => {
      scheduleIapSave(userId);
    });

    const flushNow = () => {
      flushScheduledIapSave(userId);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushNow();
    };

    window.addEventListener('beforeunload', flushNow);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', flushNow);
      document.removeEventListener('visibilitychange', onVisibility);
      flushNow();
    };
  }, [userId]);

  useEffect(() => {
    if (!isLoading && !userId) {
      hydratedRef.current = false;
    }
  }, [isLoading, userId]);
}
