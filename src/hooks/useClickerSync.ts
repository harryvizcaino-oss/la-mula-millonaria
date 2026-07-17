import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { trpc } from '@/providers/trpc';
import { useClickerStore } from '@/store/clickerStore';

const SYNC_INTERVAL_MS = 15000;

function serializeClickerState(state: ReturnType<typeof useClickerStore.getState>) {
  return {
    fleet: {
      fleetOwned: state.fleetOwned,
      selectedFleet: state.selectedFleet,
      cpsBalance: state.cpsBalance,
    },
    upgrades: state.upgrades,
    powerLevels: state.powerLevels,
    totalClicks: state.totalClicks,
    cpsTotal: state.cpsTotal,
    totalEarned: state.totalEarned,
    stars: state.stars,
    goldenTickets: state.goldenTickets,
    autoclickLevel: state.autoclickLevel,
    lastTickAt: state.lastTickAt,
  };
}

export function useClickerSync() {
  const { user, isLoaded, isSignedIn } = useUser();
  const utils = trpc.useUtils();
  const saveMutation = trpc.game.clicker.saveState.useMutation();
  const saveMutateRef = useRef(saveMutation.mutate);
  saveMutateRef.current = saveMutation.mutate;

  const hydratedRef = useRef(false);
  const lastSavedRef = useRef<ReturnType<typeof serializeClickerState> | null>(null);

  // Load server state once when the user is signed in
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    if (hydratedRef.current) return;

    utils.game.clicker.getState
      .fetch()
      .then((serverState) => {
        // fleet === null → backup legacy (v4): conservar el estado local nuevo
        if (serverState && serverState.fleet) {
          useClickerStore.getState().hydrate({
            fleet: serverState.fleet,
            upgrades: serverState.upgrades,
            powerLevels: serverState.powerLevels,
            totalClicks: serverState.totalClicks,
            cpsTotal: serverState.cpsTotal,
            totalEarned: serverState.totalEarned,
            stars: serverState.stars,
            goldenTickets: serverState.goldenTickets,
            autoclickLevel: serverState.autoclickLevel,
            lastTickAt: serverState.lastTickAt,
          });
        }
        hydratedRef.current = true;
        lastSavedRef.current = serializeClickerState(useClickerStore.getState());
      })
      .catch((err) => {
        console.error('[useClickerSync] Failed to load clicker state:', err);
        hydratedRef.current = true;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, user]);

  // Periodically save clicker state to the server
  useEffect(() => {
    if (!isSignedIn || !user) return;

    const interval = setInterval(() => {
      const current = serializeClickerState(useClickerStore.getState());
      const last = lastSavedRef.current;

      if (
        last &&
        last.totalClicks === current.totalClicks &&
        last.cpsTotal === current.cpsTotal &&
        last.totalEarned === current.totalEarned &&
        last.stars === current.stars &&
        last.goldenTickets === current.goldenTickets &&
        last.autoclickLevel === current.autoclickLevel &&
        last.lastTickAt === current.lastTickAt &&
        JSON.stringify(last.fleet) === JSON.stringify(current.fleet) &&
        JSON.stringify(last.upgrades) === JSON.stringify(current.upgrades) &&
        JSON.stringify(last.powerLevels) === JSON.stringify(current.powerLevels)
      ) {
        return;
      }

      saveMutateRef.current(current, {
        onSuccess: () => {
          lastSavedRef.current = current;
        },
        onError: (err) => {
          console.error('[useClickerSync] Failed to save clicker state:', err);
        },
      });
    }, SYNC_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      // Final save on unmount
      const current = serializeClickerState(useClickerStore.getState());
      saveMutateRef.current(current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, user]);

  // Reset hydration flag when the user signs out so the next sign-in reloads
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      hydratedRef.current = false;
    }
  }, [isLoaded, isSignedIn]);
}
