import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  getCurrentCosmeticSeason,
  getCosmeticPassLevel,
  levelForStars,
  COSMETIC_PASS_MAX_LEVEL,
  type CosmeticReward,
} from '@/data/cosmeticPass';

const COSMETIC_PASS_STORAGE_KEY = 'truckSurfers_cosmetic_pass_v1';

export interface CosmeticPassState {
  seasonId: string;
  stars: number; // estrellas de pase acumuladas en la temporada actual
  premium: boolean; // premium desbloqueado (500 🎟️, cobrado por la UI)
  claimedFree: number[]; // niveles gratis ya reclamados
  claimedPremium: number[]; // niveles premium ya reclamados

  /** Suma estrellas (resetea automáticamente si cambió la temporada de 30 días). */
  addStars: (amount: number) => void;
  /**
   * Reclama las recompensas de un nivel (gratis siempre; premium si está
   * desbloqueado). Devuelve las recompensas: la UI las aplica (millas/CPS/
   * tickets/coleccionables/cosméticos), como en leagueStore.claimReward.
   */
  claimLevel: (level: number) => { success: boolean; rewards: CosmeticReward[] };
  unlockPremium: () => void;
}

/** Garantiza que el estado corresponde a la temporada vigente (30 días). */
function ensureCurrentSeason(
  state: Pick<CosmeticPassState, 'seasonId'>
): Partial<CosmeticPassState> | null {
  const current = getCurrentCosmeticSeason();
  if (state.seasonId === current.id) return null;
  return { seasonId: current.id, stars: 0, premium: false, claimedFree: [], claimedPremium: [] };
}

export const useCosmeticPassStore = create<CosmeticPassState>()(
  persist(
    (set, get) => ({
      seasonId: getCurrentCosmeticSeason().id,
      stars: 0,
      premium: false,
      claimedFree: [],
      claimedPremium: [],

      addStars: (amount) => {
        if (amount <= 0) return;
        const reset = ensureCurrentSeason(get());
        set((state) => ({
          ...reset,
          stars: (reset ? 0 : state.stars) + Math.floor(amount),
        }));
      },

      claimLevel: (level) => {
        const reset = ensureCurrentSeason(get());
        if (reset) set(reset);
        const fresh = get();

        const def = getCosmeticPassLevel(level);
        const reached = levelForStars(fresh.stars);
        if (!def || level < 1 || level > reached) return { success: false, rewards: [] };

        const rewards: CosmeticReward[] = [];
        const claimedFree = [...fresh.claimedFree];
        const claimedPremium = [...fresh.claimedPremium];

        if (!claimedFree.includes(level)) {
          claimedFree.push(level);
          rewards.push(def.free);
        }
        if (fresh.premium && !claimedPremium.includes(level)) {
          claimedPremium.push(level);
          rewards.push(def.premium);
        }
        if (rewards.length === 0) return { success: false, rewards: [] };

        set({ claimedFree, claimedPremium });
        return { success: true, rewards };
      },

      unlockPremium: () => {
        const reset = ensureCurrentSeason(get());
        if (reset) set(reset);
        set({ premium: true });
      },
    }),
    {
      name: COSMETIC_PASS_STORAGE_KEY,
      partialize: (state) => ({
        seasonId: state.seasonId,
        stars: state.stars,
        premium: state.premium,
        claimedFree: state.claimedFree,
        claimedPremium: state.claimedPremium,
      }),
    }
  )
);

export { levelForStars, COSMETIC_PASS_MAX_LEVEL };
