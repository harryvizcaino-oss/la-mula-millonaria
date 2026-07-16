import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PowerupId = 'nitro' | 'convoy' | 'gold_rain' | 'time_warp';

export interface PowerupDef {
  id: PowerupId;
  name: string;
  icon: string;
  description: string;
  durationMs: number; // 0 = instant effect
}

export const POWERUP_DEFS: Record<PowerupId, PowerupDef> = {
  nitro: {
    id: 'nitro',
    name: 'Nitro Boost',
    icon: '🚀',
    description: 'x50 km por clic durante 10 segundos',
    durationMs: 10_000,
  },
  convoy: {
    id: 'convoy',
    name: 'Convoy Completo',
    icon: '🚛',
    description: 'Todos los vehículos producen x10 durante 30 segundos',
    durationMs: 30_000,
  },
  gold_rain: {
    id: 'gold_rain',
    name: 'Lluvia de Oro',
    icon: '🌧️',
    description: 'Clickea monedas cayendo durante 15 segundos',
    durationMs: 15_000,
  },
  time_warp: {
    id: 'time_warp',
    name: 'Salto Temporal',
    icon: '⏰',
    description: 'Gana instantáneamente 4 horas de producción',
    durationMs: 0,
  },
};

export const POWERUP_IDS: PowerupId[] = ['nitro', 'convoy', 'gold_rain', 'time_warp'];

const POWERUP_STORAGE_KEY = 'truckSurfers_powerups_v1';

export interface PowerupState {
  inventory: Record<PowerupId, number>;
  activeEffects: Partial<Record<PowerupId, number>>; // id -> end timestamp (ms)

  activatePowerup: (id: PowerupId) => boolean;
  deactivatePowerup: (id: PowerupId) => void;
  addPowerup: (id: PowerupId, count?: number) => void;
}

export const usePowerupStore = create<PowerupState>()(
  persist(
    (set, get) => ({
      inventory: { nitro: 3, convoy: 2, gold_rain: 2, time_warp: 1 },
      activeEffects: {},

      activatePowerup: (id) => {
        const state = get();
        if ((state.inventory[id] ?? 0) <= 0) return false;
        const now = Date.now();
        if ((state.activeEffects[id] ?? 0) > now) return false; // already active
        const def = POWERUP_DEFS[id];
        set({
          inventory: { ...state.inventory, [id]: state.inventory[id] - 1 },
          activeEffects:
            def.durationMs > 0
              ? { ...state.activeEffects, [id]: now + def.durationMs }
              : state.activeEffects,
        });
        return true;
      },

      deactivatePowerup: (id) => {
        set((state) => {
          const next = { ...state.activeEffects };
          delete next[id];
          return { activeEffects: next };
        });
      },

      addPowerup: (id, count = 1) => {
        set((state) => ({
          inventory: { ...state.inventory, [id]: (state.inventory[id] ?? 0) + count },
        }));
      },
    }),
    {
      name: POWERUP_STORAGE_KEY,
      partialize: (state) => ({ inventory: state.inventory }),
    }
  )
);
