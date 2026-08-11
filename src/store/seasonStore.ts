import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  getCurrentSeason,
  getSeasonLevel,
  levelForXp,
  SEASON_MAX_LEVEL,
  type SeasonReward,
} from '@/data/seasonPass';
import { useClickerStore, calculateClickPower } from '@/store/clickerStore';

const SEASON_STORAGE_KEY = 'truckSurfers_season_v1';

/**
 * Soft scale for fixed CPS season rewards: at least the track amount, or
 * `floor(clickPower * SEASON_CPS_K)` so mid/late game claims stay meaningful
 * without rewriting SEASON_TRACK.
 */
export const SEASON_CPS_K = 8;

export interface SeasonClaimCtx {
  clickPower?: number;
}

export interface SeasonState {
  seasonId: string;
  xp: number; // XP acumulada de la temporada actual
  premium: boolean; // pase premium desbloqueado
  claimedFree: number[]; // niveles gratis ya reclamados
  claimedPremium: number[]; // niveles premium ya reclamados

  /** Suma XP (resetea automáticamente si cambió la temporada). */
  addXp: (amount: number) => void;
  /**
   * Reclama las recompensas de un nivel (gratis siempre; premium si está
   * desbloqueado). Aplica las recompensas directo al clicker store.
   * CPS fijos se escalan levemente con clickPower (ver SEASON_CPS_K).
   */
  claimLevel: (
    level: number,
    ctx?: SeasonClaimCtx
  ) => { success: boolean; rewards: SeasonReward[] };
  unlockPremium: () => void;
  resetSeason: () => void;
  /** Merge con el progreso del servidor (mayor XP gana; claims/premium unión). */
  hydrateFromServer: (row: {
    season_id: string;
    xp: number;
    premium: boolean;
    claimed_levels: number[];
    claimed_premium: number[];
  }) => void;
}

/** Garantiza que el estado corresponde a la temporada vigente. */
function ensureCurrentSeason(state: Pick<SeasonState, 'seasonId'>): Partial<SeasonState> | null {
  const current = getCurrentSeason();
  if (state.seasonId === current.id) return null;
  return { seasonId: current.id, xp: 0, premium: false, claimedFree: [], claimedPremium: [] };
}

/** Escala CPS del track: max(base, floor(clickPower * SEASON_CPS_K)). Tickets intactos. */
export function scaleSeasonCpsReward(reward: SeasonReward, clickPower: number): SeasonReward {
  if (reward.type !== 'cps' || reward.amount <= 0) return reward;
  const scaled = Math.max(reward.amount, Math.floor(Math.max(0, clickPower) * SEASON_CPS_K));
  if (scaled === reward.amount) return reward;
  return { ...reward, amount: scaled };
}

function applyRewards(rewards: SeasonReward[]) {
  const clicker = useClickerStore.getState();
  for (const r of rewards) {
    if (r.type === 'cps') clicker.addEarnings(r.amount);
    else clicker.addGoldenTickets(r.amount);
  }
}

export const useSeasonStore = create<SeasonState>()(
  persist(
    (set, get) => ({
      seasonId: getCurrentSeason().id,
      xp: 0,
      premium: false,
      claimedFree: [],
      claimedPremium: [],

      addXp: (amount: number) => {
        if (amount <= 0) return;
        const reset = ensureCurrentSeason(get());
        set((state) => ({
          ...reset,
          xp: (reset ? 0 : state.xp) + Math.floor(amount),
        }));
      },

      claimLevel: (level: number, ctx?: SeasonClaimCtx) => {
        const state = get();
        const reset = ensureCurrentSeason(state);
        if (reset) set(reset);
        const fresh = get();

        const def = getSeasonLevel(level);
        const reached = levelForXp(fresh.xp);
        if (!def || level < 1 || level > reached) return { success: false, rewards: [] };

        const clickPower =
          ctx?.clickPower != null && Number.isFinite(ctx.clickPower)
            ? Math.max(0, ctx.clickPower)
            : calculateClickPower(useClickerStore.getState());

        const rewards: SeasonReward[] = [];
        const claimedFree = [...fresh.claimedFree];
        const claimedPremium = [...fresh.claimedPremium];

        if (!claimedFree.includes(level)) {
          claimedFree.push(level);
          rewards.push(scaleSeasonCpsReward(def.free, clickPower));
        }
        if (fresh.premium && !claimedPremium.includes(level)) {
          claimedPremium.push(level);
          rewards.push(scaleSeasonCpsReward(def.premium, clickPower));
        }
        if (rewards.length === 0) return { success: false, rewards: [] };

        set({ claimedFree, claimedPremium });
        applyRewards(rewards);
        return { success: true, rewards };
      },

      unlockPremium: () => {
        const reset = ensureCurrentSeason(get());
        if (reset) set(reset);
        set({ premium: true });
      },

      resetSeason: () => {
        set({
          seasonId: getCurrentSeason().id,
          xp: 0,
          premium: false,
          claimedFree: [],
          claimedPremium: [],
        });
      },

      hydrateFromServer: (row) => {
        const current = getCurrentSeason();
        // Progreso de otra temporada: no aplica
        if (row.season_id !== current.id) return;
        set((state) => {
          const base = state.seasonId === current.id ? state : { ...state, ...ensureCurrentSeason(state)! };
          return {
            seasonId: current.id,
            xp: Math.max(base.xp, Math.floor(row.xp ?? 0)),
            premium: base.premium || !!row.premium,
            claimedFree: Array.from(new Set([...base.claimedFree, ...(row.claimed_levels ?? [])])),
            claimedPremium: Array.from(
              new Set([...base.claimedPremium, ...(row.claimed_premium ?? [])])
            ),
          };
        });
      },
    }),
    {
      name: SEASON_STORAGE_KEY,
      partialize: (state) => ({
        seasonId: state.seasonId,
        xp: state.xp,
        premium: state.premium,
        claimedFree: state.claimedFree,
        claimedPremium: state.claimedPremium,
      }),
    }
  )
);

export { levelForXp, SEASON_MAX_LEVEL };
