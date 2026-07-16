import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const DAILY_REWARDS = [100, 250, 500, 1000, 2500, 5000, 10000] as const;

const DAILY_STORAGE_KEY = 'truckSurfers_daily_v1';

function dayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKey(d);
}

export interface DailyState {
  currentStreak: number; // consecutive claimed days
  lastLoginDate: string; // last claimed day (local date key)
  claimedDays: number[]; // day numbers (1..7) claimed in the current cycle
  brokeAt: number | null; // timestamp of last streak break (for UI)

  claimToday: () => { success: boolean; day: number; reward: number };
  checkStreak: () => boolean; // returns true if a break just happened
  clearBreakFlag: () => void;
}

export const useDailyStore = create<DailyState>()(
  persist(
    (set, get) => ({
      currentStreak: 0,
      lastLoginDate: '',
      claimedDays: [],
      brokeAt: null,

      claimToday: () => {
        const state = get();
        const today = dayKey();
        if (state.lastLoginDate === today) return { success: false, day: 0, reward: 0 };

        const continues = state.lastLoginDate === yesterdayKey();
        const currentStreak = continues ? state.currentStreak + 1 : 1;
        const day = ((currentStreak - 1) % 7) + 1;
        const claimedDays = day === 1 ? [1] : [...state.claimedDays, day];
        const reward = DAILY_REWARDS[day - 1];

        set({ currentStreak, lastLoginDate: today, claimedDays, brokeAt: null });
        return { success: true, day, reward };
      },

      checkStreak: () => {
        const state = get();
        const today = dayKey();
        if (!state.lastLoginDate || state.lastLoginDate === today) return false;
        if (state.lastLoginDate === yesterdayKey()) return false; // streak alive, pending claim
        // Missed at least one full day -> streak broken
        if (state.currentStreak > 0 || state.claimedDays.length > 0) {
          set({ currentStreak: 0, claimedDays: [], brokeAt: Date.now() });
          return true;
        }
        return false;
      },

      clearBreakFlag: () => set({ brokeAt: null }),
    }),
    {
      name: DAILY_STORAGE_KEY,
      partialize: (state) => ({
        currentStreak: state.currentStreak,
        lastLoginDate: state.lastLoginDate,
        claimedDays: state.claimedDays,
      }),
    }
  )
);
