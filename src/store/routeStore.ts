import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_CITY_ID,
  getRouteCity,
  unlockedCitiesFor,
  type RouteCity,
} from '@/data/routes';

const ROUTES_STORAGE_KEY = 'truckSurfers_routes_v1';

export interface RouteState {
  currentCityId: string; // ciudad donde está el camión (viaje activo)
  unlockedCityIds: string[]; // ciudades desbloqueadas por CPS total

  /**
   * Recalcula los desbloqueos según el CPS total. Devuelve las ciudades
   * recién desbloqueadas y avanza el camión a la última de ellas.
   */
  checkUnlocks: (cpsTotal: number) => RouteCity[];
  /** Cambia la ciudad actual (solo entre desbloqueadas). */
  setCurrentCity: (id: string) => boolean;
}

export const useRouteStore = create<RouteState>()(
  persist(
    (set, get) => ({
      currentCityId: DEFAULT_CITY_ID,
      unlockedCityIds: [DEFAULT_CITY_ID],

      checkUnlocks: (cpsTotal: number) => {
        const state = get();
        const eligible = unlockedCitiesFor(cpsTotal);
        const newlyUnlocked = eligible.filter((c) => !state.unlockedCityIds.includes(c.id));
        if (newlyUnlocked.length === 0) return [];
        const last = newlyUnlocked[newlyUnlocked.length - 1];
        set({
          unlockedCityIds: [...state.unlockedCityIds, ...newlyUnlocked.map((c) => c.id)],
          // El camión avanza automáticamente a la ciudad recién alcanzada
          currentCityId: last.id,
        });
        return newlyUnlocked;
      },

      setCurrentCity: (id: string) => {
        const state = get();
        if (!state.unlockedCityIds.includes(id)) return false;
        if (!getRouteCity(id)) return false;
        set({ currentCityId: id });
        return true;
      },
    }),
    {
      name: ROUTES_STORAGE_KEY,
      partialize: (state) => ({
        currentCityId: state.currentCityId,
        unlockedCityIds: state.unlockedCityIds,
      }),
    }
  )
);
