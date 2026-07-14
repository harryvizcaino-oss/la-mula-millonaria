import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';



const MILLAS_STORAGE_KEY = 'truckSurfers_millas_v3';

interface MillasContextValue {
  millas: number;
  addMillas: (amount: number) => void;
  setMillas: (amount: number) => void;
}

const MillasContext = createContext<MillasContextValue | null>(null);

function loadInitialMillas(): number {
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

export function MillasProvider({ children }: { children: ReactNode }) {
  const [millas, setMillasState] = useState<number>(loadInitialMillas);

  useEffect(() => {
    localStorage.setItem(MILLAS_STORAGE_KEY, String(millas));
  }, [millas]);

  const addMillas = useCallback((amount: number) => {
    setMillasState((prev) => Math.max(0, prev + Math.floor(amount)));
  }, []);

  const setMillas = useCallback((amount: number) => {
    setMillasState(Math.max(0, Math.floor(amount)));
  }, []);

  return (
    <MillasContext.Provider value={{ millas, addMillas, setMillas }}>
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
