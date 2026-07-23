import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSeasonStore } from '@/store/seasonStore';
import {
  flushScheduledSeasonSave,
  loadSeasonProgress,
  scheduleSeasonSave,
} from '@/lib/seasonSync';

/**
 * Sincroniza el pase de temporada con Supabase (best-effort):
 * - Al iniciar sesión carga el progreso del servidor y lo fusiona con el
 *   local (mayor XP gana; claims y premium se unen).
 * - Ante cada cambio del store programa un guardado con debounce de 5s.
 * - Offline: Zustand/localStorage sigue mandando; el próximo guardado
 *   exitoso pisa el servidor.
 */
export function useSeasonSync() {
  const { user, isLoading } = useAuth();
  const userId = user?.id ?? null;
  const hydratedRef = useRef(false);

  // Carga + merge del progreso del servidor una vez por sesión
  useEffect(() => {
    if (isLoading || !userId || hydratedRef.current) return;
    hydratedRef.current = true;
    loadSeasonProgress(userId)
      .then((row) => {
        if (row) {
          useSeasonStore.getState().hydrateFromServer(row);
        }
        // Publica el estado fusionado (o el local si no había fila)
        flushScheduledSeasonSave(userId, () => useSeasonStore.getState());
      })
      .catch((err) => {
        console.error('[useSeasonSync] Failed to load season progress:', err);
      });
  }, [isLoading, userId]);

  // Suscripción a cambios del store → guardado debounced (5s)
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = useSeasonStore.subscribe(() => {
      scheduleSeasonSave(userId, () => useSeasonStore.getState());
    });

    const flushNow = () => {
      flushScheduledSeasonSave(userId, () => useSeasonStore.getState());
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

  // Reset al cerrar sesión para que el próximo login vuelva a hidratar
  useEffect(() => {
    if (!isLoading && !userId) {
      hydratedRef.current = false;
    }
  }, [isLoading, userId]);
}
