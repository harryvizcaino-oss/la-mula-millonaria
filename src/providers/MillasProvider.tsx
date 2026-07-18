import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { saveMillasNow, SAVE_DEBOUNCE_MS } from '@/lib/gameSync';

const MILLAS_STORAGE_KEY = 'truckSurfers_millas_v3';

interface MillasContextValue {
  millas: number;
  addMillas: (amount: number) => void;
  setMillas: (amount: number) => void;
  isLoading: boolean;
}

const MillasContext = createContext<MillasContextValue | null>(null);

function loadLocalMillas(): number {
  try {
    const raw = localStorage.getItem(MILLAS_STORAGE_KEY);
    if (raw) {
      const parsed = parseInt(raw, 10);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
  } catch {
    // ignore
  }
  return 0;
}

/**
 * Balance de TicaMillas. Persiste local (localStorage) para jugar offline y
 * sincroniza la columna `millas` de `game_state` en Supabase con debounce de
 * 5s (upsert parcial; el resto de columnas las maneja useClickerSync).
 */
export function MillasProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const [millas, setMillasState] = useState<number>(loadLocalMillas);
  // Balance del servidor ya cargado para este userId (null = ninguno aún)
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const millasRef = useRef(millas);
  const userIdRef = useRef(userId);

  const isLoading = authLoading || (isSupabaseConfigured && !!userId && loadedFor !== userId);

  // Refs "latest" para los callbacks async (asignados en efecto, no en render)
  useEffect(() => {
    millasRef.current = millas;
    userIdRef.current = userId;
  }, [millas, userId]);

  // Carga el balance del servidor cuando hay sesión (una vez por usuario)
  useEffect(() => {
    if (authLoading || !userId || !isSupabaseConfigured) return;
    if (loadedFor === userId) return;

    Promise.resolve(
      supabase
        .from('game_state')
        .select('millas')
        .eq('id', userId)
        .maybeSingle()
    )
      .then(({ data, error }) => {
        if (error) {
          console.error('[MillasProvider] Failed to load balance:', error);
          return;
        }
        const serverBalance = data?.millas ?? 0;
        // Prefer server balance if it exists, otherwise keep local
        setMillasState((local) => (serverBalance > 0 ? serverBalance : local));
      })
      .finally(() => {
        setLoadedFor(userId);
      });
  }, [authLoading, userId, loadedFor]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(MILLAS_STORAGE_KEY, String(millas));
  }, [millas]);

  // Guardado en Supabase con debounce de 5s (trailing) ante cada cambio
  useEffect(() => {
    if (!userId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      void saveMillasNow(userId, millasRef.current);
    }, SAVE_DEBOUNCE_MS);
  }, [userId, millas]);

  // Sync final al desmontar o cambiar de usuario
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
        const uid = userIdRef.current;
        if (uid) void saveMillasNow(uid, millasRef.current);
      }
    };
  }, [userId]);

  const addMillas = useCallback((amount: number) => {
    setMillasState((prev) => Math.max(0, prev + Math.floor(amount)));
  }, []);

  const setMillas = useCallback((amount: number) => {
    setMillasState(Math.max(0, Math.floor(amount)));
  }, []);

  return (
    <MillasContext.Provider value={{ millas, addMillas, setMillas, isLoading }}>
      {children}
    </MillasContext.Provider>
  );
}

export function useMillas() {
  const ctx = useContext(MillasContext);
  if (!ctx) {
    throw new Error('useMillas must be used within MillasProvider');
  }
  return ctx;
}
