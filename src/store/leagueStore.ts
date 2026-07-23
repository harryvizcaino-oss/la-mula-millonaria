import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DIVISION_COUNT,
  demotionThreshold,
  divisionRewards,
  getWeekKey,
  promotionThreshold,
  type DivisionRewards,
} from '@/data/leagues';

const LEAGUE_STORAGE_KEY = 'truckSurfers_league_v1';

export type LeagueOutcome = 'up' | 'down' | 'stay';

export interface PendingLeagueReward extends DivisionRewards {
  division: number;
  outcome: LeagueOutcome;
  weekKey: string;
}

export interface LeagueState {
  weekKey: string; // semana activa (lunes local, 'YYYY-MM-DD')
  weeklyCpsTotal: number; // CPS ganado en la semana actual (separado del histórico)
  division: number; // 0 = Bronce I … 29 = Leyenda V
  pendingReward: PendingLeagueReward | null; // recompensa de la semana cerrada, sin reclamar

  addWeeklyCps: (amount: number) => void;
  checkWeekRollover: () => void;
  claimReward: () => PendingLeagueReward | null;
}

export const useLeagueStore = create<LeagueState>()(
  persist(
    (set, get) => ({
      weekKey: getWeekKey(),
      weeklyCpsTotal: 0,
      division: 0,
      pendingReward: null,

      addWeeklyCps: (amount) => {
        if (amount <= 0) return;
        get().checkWeekRollover();
        set((state) => ({ weeklyCpsTotal: state.weeklyCpsTotal + amount }));
      },

      // Cierra la semana anterior si el lunes ya cambió: sube/baja de
      // división según el CPS semanal y deja la recompensa lista para reclamar.
      checkWeekRollover: () => {
        const state = get();
        const currentWeek = getWeekKey();
        if (state.weekKey === currentWeek) return;

        const weekly = state.weeklyCpsTotal;
        let division = state.division;
        let outcome: LeagueOutcome = 'stay';
        if (weekly >= promotionThreshold(state.division)) {
          const next = Math.min(DIVISION_COUNT - 1, state.division + 1);
          outcome = next > state.division ? 'up' : 'stay';
          division = next;
        } else if (state.division > 0 && weekly < demotionThreshold(state.division)) {
          division = state.division - 1;
          outcome = 'down';
        }

        set({
          weekKey: currentWeek,
          weeklyCpsTotal: 0,
          division,
          pendingReward:
            weekly > 0
              ? { division, outcome, weekKey: state.weekKey, ...divisionRewards(division) }
              : null,
        });
      },

      // Devuelve la recompensa pendiente y la limpia; la UI aplica los montos
      // (millas vía MillasProvider, CPS/tickets vía clickerStore).
      claimReward: () => {
        const reward = get().pendingReward;
        if (!reward) return null;
        set({ pendingReward: null });
        return reward;
      },
    }),
    {
      name: LEAGUE_STORAGE_KEY,
      partialize: (state) => ({
        weekKey: state.weekKey,
        weeklyCpsTotal: state.weeklyCpsTotal,
        division: state.division,
        pendingReward: state.pendingReward,
      }),
      onRehydrateStorage: () => (state) => {
        state?.checkWeekRollover();
      },
    }
  )
);
