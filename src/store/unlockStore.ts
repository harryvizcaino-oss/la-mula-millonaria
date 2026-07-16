import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UnlockCinematicType = 'small' | 'medium' | 'large' | 'epic';

export interface PendingCinematic {
  type: UnlockCinematicType;
  title: string;
  reward: string;
}

const UNLOCK_STORAGE_KEY = 'truckSurfers_unlocks_v1';

export interface UnlockState {
  unlockedMilestones: string[];
  pendingCinematic: PendingCinematic | null;

  triggerUnlock: (id: string, cinematic: PendingCinematic) => boolean;
  clearCinematic: () => void;
}

export const useUnlockStore = create<UnlockState>()(
  persist(
    (set, get) => ({
      unlockedMilestones: [],
      pendingCinematic: null,

      triggerUnlock: (id, cinematic) => {
        const state = get();
        if (state.unlockedMilestones.includes(id)) return false;
        set({
          unlockedMilestones: [...state.unlockedMilestones, id],
          // Do not stomp a bigger cinematic already on screen
          pendingCinematic: state.pendingCinematic ?? cinematic,
        });
        return true;
      },

      clearCinematic: () => set({ pendingCinematic: null }),
    }),
    {
      name: UNLOCK_STORAGE_KEY,
      partialize: (state) => ({ unlockedMilestones: state.unlockedMilestones }),
    }
  )
);
