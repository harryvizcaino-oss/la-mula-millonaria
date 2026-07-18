import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useClickerStore } from '@/store/clickerStore';
import { flushScheduledSave, installOnlineFlush } from '@/lib/gameSync';
import { flushPendingOps } from '@/lib/offlineQueue';

/**
 * Sincroniza el clicker store con Supabase:
 * - Al iniciar sesión carga el snapshot del servidor (loadFromSupabase).
 * - Ante cada cambio de estado programa un guardado con debounce de 5s.
 * - Offline: Zustand/localStorage sigue funcionando; los guardados fallidos
 *   se encolan y se reenvían al recuperar conexión (evento `online`).
 */
export function useClickerSync() {
  const { user, isLoading } = useAuth();
  const userId = user?.id ?? null;
  const hydratedRef = useRef(false);

  // Carga el estado del servidor una vez por sesión
  useEffect(() => {
    if (isLoading || !userId || hydratedRef.current) return;
    hydratedRef.current = true;
    useClickerStore
      .getState()
      .loadFromSupabase(userId)
      .then((hydrated) => {
        // Al volver a tener sesión, reenvía cualquier operación encolada offline
        void flushPendingOps();
        if (!hydrated) {
          // Primera vez (o sin fila en el servidor): publica el estado local
          flushScheduledSave(userId, () => useClickerStore.getState());
        }
      })
      .catch((err) => {
        console.error('[useClickerSync] Failed to load game state:', err);
      });
  }, [isLoading, userId]);

  // Suscripción a cambios del store → guardado debounced (5s)
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = useClickerStore.subscribe(() => {
      useClickerStore.getState().debouncedSave(userId);
    });

    const flushNow = () => {
      flushScheduledSave(userId, () => useClickerStore.getState());
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

  // Flush de la cola offline al recuperar internet (listener global único)
  useEffect(() => {
    installOnlineFlush();
  }, []);

  // Reset al cerrar sesión para que el próximo login vuelva a hidratar
  useEffect(() => {
    if (!isLoading && !userId) {
      hydratedRef.current = false;
    }
  }, [isLoading, userId]);
}
