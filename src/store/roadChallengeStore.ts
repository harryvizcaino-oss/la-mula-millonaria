import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  FREE_ROAD_CHALLENGES_PER_DAY,
  ROAD_BUFF_BONUS,
  ROAD_BUFF_DURATION_MS,
  type RoadChallengeKind,
} from '@/data/roadChallenges';

const STORAGE_KEY = 'truckSurfers_road_challenges_v1';

function dayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export type RoadTier = 'fail' | 'ok' | 'perfect';

export interface RoadChallengeReward {
  millas: number;
  cps: number;
  tickets: number;
  powerup: boolean;
  tier: RoadTier;
  summary: string;
  firstClearBuff: boolean;
}

interface RoadChallengeState {
  dayKey: string;
  freePlaysToday: number;
  /** segmentId → dayKey de última partida gratis. */
  freePlayBySegment: Record<string, string>;
  /** segmentIds con primera victoria. */
  firstCleared: string[];
  /** Timestamp ms; 0 = sin buff. */
  buffEndsAt: number;
  ensureDay: () => void;
  canPlayFree: (segmentId: string) => boolean;
  freeRemaining: () => number;
  markFreePlay: (segmentId: string) => void;
  markFirstClear: (segmentId: string) => boolean;
  grantBuff: () => void;
  getBuffMultiplier: () => number;
  buildReward: (
    tier: RoadTier,
    kind: RoadChallengeKind,
    firstClear: boolean,
    clickPower: number,
  ) => RoadChallengeReward;
}

function rollPowerup(tier: RoadTier): boolean {
  if (tier !== 'perfect') return false;
  return Math.random() < 0.25;
}

export const useRoadChallengeStore = create<RoadChallengeState>()(
  persist(
    (set, get) => ({
      dayKey: dayKey(),
      freePlaysToday: 0,
      freePlayBySegment: {},
      firstCleared: [],
      buffEndsAt: 0,

      ensureDay: () => {
        const today = dayKey();
        const state = get();
        if (state.dayKey === today) return;
        set({ dayKey: today, freePlaysToday: 0, freePlayBySegment: {} });
      },

      canPlayFree: (segmentId) => {
        get().ensureDay();
        const s = get();
        if (s.freePlaysToday >= FREE_ROAD_CHALLENGES_PER_DAY) return false;
        if (s.freePlayBySegment[segmentId] === s.dayKey) return false;
        return true;
      },

      freeRemaining: () => {
        get().ensureDay();
        return Math.max(0, FREE_ROAD_CHALLENGES_PER_DAY - get().freePlaysToday);
      },

      markFreePlay: (segmentId) => {
        get().ensureDay();
        const s = get();
        set({
          freePlaysToday: s.freePlaysToday + 1,
          freePlayBySegment: { ...s.freePlayBySegment, [segmentId]: s.dayKey },
        });
      },

      markFirstClear: (segmentId) => {
        const s = get();
        if (s.firstCleared.includes(segmentId)) return false;
        set({ firstCleared: [...s.firstCleared, segmentId] });
        return true;
      },

      grantBuff: () => {
        set({ buffEndsAt: Date.now() + ROAD_BUFF_DURATION_MS });
      },

      getBuffMultiplier: () => {
        const ends = get().buffEndsAt;
        if (!ends || Date.now() >= ends) return 1;
        return 1 + ROAD_BUFF_BONUS;
      },

      buildReward: (tier, kind, firstClear, clickPower) => {
        const tables: Record<
          RoadTier,
          { millas: [number, number]; cpsK: number; tickets: number; summary: string }
        > = {
          fail: {
            millas: [100, 200],
            cpsK: 0,
            tickets: 0,
            summary: 'La mula no llegó… premio de consuelo en la vía',
          },
          ok: {
            millas: [400, 800],
            cpsK: 20,
            tickets: 0,
            summary: 'Tramo completado. ¡Buen manejo!',
          },
          perfect: {
            millas: [1000, 1500],
            cpsK: 40,
            tickets: 1,
            summary: '¡Paso perfecto! La cordillera te respeta',
          },
        };
        const t = tables[tier];
        const millas = t.millas[0] + Math.floor(Math.random() * (t.millas[1] - t.millas[0] + 1));
        const cps = t.cpsK > 0 ? Math.floor(clickPower * t.cpsK) : 0;
        const flavor =
          kind === 'climb' && tier === 'perfect'
            ? '¡Cima conquistada!'
            : kind === 'port' && tier !== 'fail'
              ? 'Carga en el muelle'
              : t.summary;
        return {
          millas,
          cps,
          tickets: t.tickets,
          powerup: rollPowerup(tier),
          tier,
          summary: firstClear && tier !== 'fail' ? `${flavor} · Primera vez en el tramo` : flavor,
          firstClearBuff: firstClear && tier !== 'fail',
        };
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({
        dayKey: s.dayKey,
        freePlaysToday: s.freePlaysToday,
        freePlayBySegment: s.freePlayBySegment,
        firstCleared: s.firstCleared,
        buffEndsAt: s.buffEndsAt,
      }),
    }
  )
);

/** Multiplicador activo del buff de reto (1 o 1.01). Para calculateClickPower. */
export function getRoadChallengeBuffMultiplier(): number {
  return useRoadChallengeStore.getState().getBuffMultiplier();
}
