import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  SESSION_INACTIVITY_RESET_MS,
  getSessionMilestone,
  type SessionRewardSet,
} from '@/data/sessionRewards';

const SESSION_REWARDS_STORAGE_KEY = 'truckSurfers_session_rewards_v1';

export interface SessionRewardState {
  activeMs: number; // tiempo activo acumulado de la sesión actual
  lastActiveAt: number; // último tick (ms epoch)
  claimed: string[]; // milestones ya reclamados en esta sesión

  /**
   * Acumula tiempo activo (lo llama useSessionTracker cada segundo mientras la
   * pestaña está visible). Si pasaron más de 10 min desde el último tick, la
   * sesión se reinicia (nuevo ciclo de recompensas).
   */
  tick: (deltaMs: number) => void;
  /** Reclama un milestone alcanzado. Devuelve las recompensas (la UI las aplica). */
  claim: (milestoneId: string) => SessionRewardSet | null;
  /** Reinicia la sesión manualmente. */
  resetSession: () => void;
}

export const useSessionRewardStore = create<SessionRewardState>()(
  persist(
    (set, get) => ({
      activeMs: 0,
      lastActiveAt: Date.now(),
      claimed: [],

      tick: (deltaMs) => {
        const now = Date.now();
        const state = get();
        // Sesión expirada por inactividad: empieza un ciclo nuevo
        if (now - state.lastActiveAt > SESSION_INACTIVITY_RESET_MS) {
          set({ activeMs: Math.max(0, deltaMs), lastActiveAt: now, claimed: [] });
          return;
        }
        set({ activeMs: state.activeMs + Math.max(0, deltaMs), lastActiveAt: now });
      },

      claim: (milestoneId) => {
        const state = get();
        const milestone = getSessionMilestone(milestoneId);
        if (!milestone || state.claimed.includes(milestoneId)) return null;
        if (state.activeMs < milestone.seconds * 1000) return null;
        set({ claimed: [...state.claimed, milestoneId] });
        return milestone.rewards;
      },

      resetSession: () => set({ activeMs: 0, lastActiveAt: Date.now(), claimed: [] }),
    }),
    {
      name: SESSION_REWARDS_STORAGE_KEY,
      partialize: (state) => ({
        activeMs: state.activeMs,
        lastActiveAt: state.lastActiveAt,
        claimed: state.claimed,
      }),
    }
  )
);
