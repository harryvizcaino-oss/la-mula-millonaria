import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { trpc } from '@/providers/trpc';
import { useClickerStore } from '@/store/clickerStore';

const SYNC_INTERVAL_MS = 15000;

function serializeClickerState(state: ReturnType<typeof useClickerStore.getState>) {
  return {
    buildings: state.buildings,
    upgrades: state.upgrades,
    powerLevels: state.powerLevels,
    totalClicks: state.totalClicks,
    totalKm: state.totalKm,
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

  const hydratedRef = useRef(false);
  const lastSavedRef = useRef<ReturnType<typeof serializeClickerState> | null>(null);

  // Load server state once when the user is signed in
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    if (hydratedRef.current) return;

    utils.game.clicker.getState
      .fetch()
      .then((serverState) => {
        if (serverState) {
          useClickerStore.getState().hydrate({
            buildings: serverState.buildings,
            upgrades: serverState.upgrades,
            powerLevels: serverState.powerLevels,
            totalClicks: serverState.totalClicks,
            totalKm: serverState.totalKm,
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
        last.totalKm === current.totalKm &&
        last.totalEarned === current.totalEarned &&
        last.stars === current.stars &&
        last.goldenTickets === current.goldenTickets &&
        last.autoclickLevel === current.autoclickLevel &&
        last.lastTickAt === current.lastTickAt &&
        JSON.stringify(last.buildings) === JSON.stringify(current.buildings) &&
        JSON.stringify(last.upgrades) === JSON.stringify(current.upgrades) &&
        JSON.stringify(last.powerLevels) === JSON.stringify(current.powerLevels)
      ) {
        return;
      }

      saveMutation.mutate(current, {
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
      saveMutation.mutate(current);
    };
  }, [isSignedIn, user, saveMutation]);

  // Reset hydration flag when the user signs out so the next sign-in reloads
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      hydratedRef.current = false;
    }
  }, [isLoaded, isSignedIn]);
}
