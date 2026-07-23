import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useClickerStore } from '@/store/clickerStore';
import { POWERUP_IDS, type PowerupId } from '@/store/powerupStore';

const LOOTBOX_STORAGE_KEY = 'truckSurfers_lootboxes_v1';

export const LOOTBOX_TICKET_COST = 1;

export type LootResult =
  | { kind: 'powerup'; powerup: PowerupId }
  | { kind: 'tickets'; amount: number }
  | { kind: 'millas'; amount: number }
  | { kind: 'cps'; amount: number }
  | { kind: 'skin'; skinId: string };

// Skins raras (placeholder: solo se guardan en el inventario)
export const RARE_SKINS: { id: string; name: string; emoji: string }[] = [
  { id: 'skin-dorada', name: 'Mula Dorada', emoji: '✨' },
  { id: 'skin-neon', name: 'Mula Neón', emoji: '🌈' },
  { id: 'skin-camuflaje', name: 'Mula Camuflaje', emoji: '🪖' },
];

/**
 * Tabla de loot:
 *  40% power-up aleatorio · 30% +1 ticket · 20% +1000 millas · 8% +5000 CPS · 2% skin rara
 */
export function rollLoot(): LootResult {
  const r = Math.random();
  if (r < 0.4) {
    return { kind: 'powerup', powerup: POWERUP_IDS[Math.floor(Math.random() * POWERUP_IDS.length)] };
  }
  if (r < 0.7) return { kind: 'tickets', amount: 1 };
  if (r < 0.9) return { kind: 'millas', amount: 1000 };
  if (r < 0.98) return { kind: 'cps', amount: 5000 };
  return { kind: 'skin', skinId: RARE_SKINS[Math.floor(Math.random() * RARE_SKINS.length)].id };
}

export interface LootBoxState {
  skins: string[]; // skins raras ganadas (inventario)
  totalOpened: number;

  /** Consume 1 Golden Ticket y tira la tabla de loot. Null si no hay tickets. */
  openBox: () => LootResult | null;
}

export const useLootBoxStore = create<LootBoxState>()(
  persist(
    (set) => ({
      skins: [],
      totalOpened: 0,

      openBox: () => {
        if (!useClickerStore.getState().spendGoldenTickets(LOOTBOX_TICKET_COST)) return null;
        const result = rollLoot();
        set((state) => ({
          totalOpened: state.totalOpened + 1,
          skins:
            result.kind === 'skin' && !state.skins.includes(result.skinId)
              ? [...state.skins, result.skinId]
              : state.skins,
        }));
        return result;
      },
    }),
    {
      name: LOOTBOX_STORAGE_KEY,
      partialize: (state) => ({ skins: state.skins, totalOpened: state.totalOpened }),
    }
  )
);
