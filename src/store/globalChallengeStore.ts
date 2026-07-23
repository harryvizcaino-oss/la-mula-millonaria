import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  CHALLENGE_MILESTONES,
  COMMUNITY_MULTIPLIER,
  generateWeeklyChallenges,
  type ChallengeRewardSet,
  type ChallengeType,
  type GlobalChallengeDef,
} from '@/data/globalChallenges';
import { getWeekKey } from '@/data/leagues';

const GLOBAL_CHALLENGES_STORAGE_KEY = 'truckSurfers_global_challenges_v1';
/** Intervalo mínimo para hornear el progreso pasivo (evita escrituras por segundo). */
const PASSIVE_BAKE_INTERVAL_MS = 30_000;

export interface ActiveChallenge extends GlobalChallengeDef {
  communityBase: number; // progreso comunitario horneado (sin el pasivo pendiente)
  personal: number; // contribución personal del jugador
  claimed: number[]; // milestones (pct) ya reclamados
}

export interface GlobalChallengeState {
  weekKey: string;
  challenges: ActiveChallenge[];
  lastPassiveAt: number; // ms epoch del último horneado pasivo

  /** Rota los desafíos si cambió la semana (lunes 00:00 local). */
  ensureChallenges: () => void;
  /** El jugador aporta: suma a su contribución personal y ×1000 a la comunidad. */
  contribute: (type: ChallengeType, amount: number) => void;
  /** Hornea el progreso pasivo transcurrido (lo llama useSessionTracker). */
  syncPassive: () => void;
  /** Reclama un milestone alcanzado. Devuelve las recompensas (la UI las aplica). */
  claimMilestone: (challengeId: string, pct: number) => ChallengeRewardSet | null;
}

/** Progreso comunitario en vivo: base horneada + pasivo desde el último horneado. */
export function liveCommunity(
  challenge: ActiveChallenge,
  lastPassiveAt: number,
  now: number = Date.now()
): number {
  const passive = challenge.passivePerSecond * Math.max(0, now - lastPassiveAt) / 1000;
  return Math.min(challenge.goal, challenge.communityBase + passive);
}

function buildWeek(weekKey: string): ActiveChallenge[] {
  return generateWeeklyChallenges(weekKey).map((def) => ({
    ...def,
    communityBase: 0,
    personal: 0,
    claimed: [],
  }));
}

export const useGlobalChallengeStore = create<GlobalChallengeState>()(
  persist(
    (set, get) => ({
      weekKey: getWeekKey(),
      challenges: buildWeek(getWeekKey()),
      lastPassiveAt: Date.now(),

      ensureChallenges: () => {
        const current = getWeekKey();
        if (get().weekKey === current) return;
        set({ weekKey: current, challenges: buildWeek(current), lastPassiveAt: Date.now() });
      },

      contribute: (type, amount) => {
        if (amount <= 0) return;
        get().ensureChallenges();
        set((state) => ({
          challenges: state.challenges.map((ch) =>
            ch.type !== type
              ? ch
              : {
                  ...ch,
                  personal: ch.personal + amount,
                  communityBase: Math.min(
                    ch.goal,
                    ch.communityBase + amount * COMMUNITY_MULTIPLIER
                  ),
                }
          ),
        }));
      },

      syncPassive: () => {
        const state = get();
        const now = Date.now();
        if (now - state.lastPassiveAt < PASSIVE_BAKE_INTERVAL_MS) return;
        set({
          lastPassiveAt: now,
          challenges: state.challenges.map((ch) => ({
            ...ch,
            communityBase: liveCommunity(ch, state.lastPassiveAt, now),
          })),
        });
      },

      claimMilestone: (challengeId, pct) => {
        const state = get();
        const challenge = state.challenges.find((c) => c.id === challengeId);
        const milestone = CHALLENGE_MILESTONES.find((m) => m.pct === pct);
        if (!challenge || !milestone || challenge.claimed.includes(pct)) return null;
        const progressPct = (liveCommunity(challenge, state.lastPassiveAt) / challenge.goal) * 100;
        if (progressPct < pct) return null;
        set({
          challenges: state.challenges.map((c) =>
            c.id === challengeId ? { ...c, claimed: [...c.claimed, pct] } : c
          ),
        });
        return milestone.rewards;
      },
    }),
    {
      name: GLOBAL_CHALLENGES_STORAGE_KEY,
      partialize: (state) => ({
        weekKey: state.weekKey,
        challenges: state.challenges,
        lastPassiveAt: state.lastPassiveAt,
      }),
      onRehydrateStorage: () => (state) => {
        state?.ensureChallenges();
      },
    }
  )
);
