import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useUser } from '@clerk/clerk-react';
import { trpc } from '@/providers/trpc';

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

export function MillasProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const [millas, setMillasState] = useState<number>(loadLocalMillas);
  const [syncedBalance, setSyncedBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const utils = trpc.useUtils();
  const syncMutation = trpc.game.points.syncBalance.useMutation();

  // Load server balance when authenticated user is available
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    utils.game.points.getBalance
      .fetch()
      .then((data) => {
        const serverBalance = data.balance;
        setSyncedBalance(serverBalance);
        // Prefer server balance if it exists, otherwise keep local
        setMillasState((local) => (serverBalance > 0 ? serverBalance : local));
      })
      .catch((err) => {
        console.error('[MillasProvider] Failed to load balance:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, user]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(MILLAS_STORAGE_KEY, String(millas));
  }, [millas]);

  // Sync to server periodically
  useEffect(() => {
    if (!isSignedIn || !user) return;

    const interval = setInterval(() => {
      if (millas !== syncedBalance) {
        syncMutation.mutate(
          { totalMillas: millas },
          {
            onSuccess: (data) => {
              setSyncedBalance(data.balance);
            },
            onError: (err) => {
              console.error('[MillasProvider] Sync failed:', err);
            },
          }
        );
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      // Final sync on unmount
      if (millas !== syncedBalance) {
        syncMutation.mutate({ totalMillas: millas });
      }
    };
  }, [isSignedIn, user, millas, syncedBalance, syncMutation]);

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
