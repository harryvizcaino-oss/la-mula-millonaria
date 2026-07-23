import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SPONSOR_POWERS, MAX_SPONSOR_LEVEL } from '@/data/sponsorPowers';

const ACHIEVEMENT_STORAGE_KEY = 'truckSurfers_achievements_v1';

export interface AchievementReward {
  cps?: number;
  tickets?: number;
  millas?: number;
  title?: string; // título cosmético
}

export interface AchievementSnapshot {
  powerLevels: Record<string, number>;
  fleetOwned: string[];
  cpsTotal: number;
  totalClicks: number;
  ascensions: number;
  comboTier: number; // mejor tier de combo de la sesión (0-4)
}

export interface AchievementDef {
  id: string;
  group: string;
  title: string;
  description: string;
  emoji: string;
  reward: AchievementReward;
  check: (s: AchievementSnapshot) => boolean;
}

export const ACHIEVEMENT_GROUPS = ['Poderes', 'Flota', 'CPS', 'Clics', 'Combos', 'Ascensión'] as const;

export const ACHIEVEMENTS: AchievementDef[] = [
  // ── Poderes: maxear cada poder (nivel 100) ──
  ...SPONSOR_POWERS.map((p) => ({
    id: `power-max-${p.id}`,
    group: 'Poderes',
    title: `${p.name} al máximo`,
    description: `Lleva ${p.name} al nivel ${MAX_SPONSOR_LEVEL}`,
    emoji: p.emoji,
    reward: { cps: 50000, millas: 10000 },
    check: (s: AchievementSnapshot) => (s.powerLevels[p.id] || 0) >= MAX_SPONSOR_LEVEL,
  })),
  // ── Flota: 3, 6 y 10 vehículos ──
  {
    id: 'fleet-3',
    group: 'Flota',
    title: 'Pequeña flota',
    description: 'Compra 3 vehículos de flota',
    emoji: '🚛',
    reward: { tickets: 3 },
    check: (s) => s.fleetOwned.length >= 3,
  },
  {
    id: 'fleet-6',
    group: 'Flota',
    title: 'Flota seria',
    description: 'Compra 6 vehículos de flota',
    emoji: '🚚',
    reward: { tickets: 6, millas: 5000 },
    check: (s) => s.fleetOwned.length >= 6,
  },
  {
    id: 'fleet-10',
    group: 'Flota',
    title: 'Magnate del asfalto',
    description: 'Compra los 10 vehículos de flota',
    emoji: '🏆',
    reward: { tickets: 15, title: 'Magnate' },
    check: (s) => s.fleetOwned.length >= 10,
  },
  // ── CPS total acumulado ──
  {
    id: 'cps-1k',
    group: 'CPS',
    title: 'Primeros verdes',
    description: 'Acumula 1.000 CPS totales',
    emoji: '💵',
    reward: { cps: 500 },
    check: (s) => s.cpsTotal >= 1_000,
  },
  {
    id: 'cps-1m',
    group: 'CPS',
    title: 'Millonario',
    description: 'Acumula 1M CPS totales',
    emoji: '💰',
    reward: { cps: 10000, millas: 5000 },
    check: (s) => s.cpsTotal >= 1_000_000,
  },
  {
    id: 'cps-1b',
    group: 'CPS',
    title: 'Billonario',
    description: 'Acumula 1B CPS totales',
    emoji: '🤑',
    reward: { cps: 500000, tickets: 5 },
    check: (s) => s.cpsTotal >= 1_000_000_000,
  },
  {
    id: 'cps-1t',
    group: 'CPS',
    title: 'Trillonario',
    description: 'Acumula 1T CPS totales',
    emoji: '👑',
    reward: { cps: 10000000, tickets: 20, title: 'Trillonario' },
    check: (s) => s.cpsTotal >= 1_000_000_000_000,
  },
  // ── Clics ──
  {
    id: 'clicks-1k',
    group: 'Clics',
    title: 'Dedo caliente',
    description: 'Haz 1.000 clicks',
    emoji: '👆',
    reward: { cps: 1000 },
    check: (s) => s.totalClicks >= 1_000,
  },
  {
    id: 'clicks-100k',
    group: 'Clics',
    title: 'Dedo de acero',
    description: 'Haz 100.000 clicks',
    emoji: '🦾',
    reward: { cps: 100000, millas: 10000 },
    check: (s) => s.totalClicks >= 100_000,
  },
  {
    id: 'clicks-1m',
    group: 'Clics',
    title: 'Dedo legendario',
    description: 'Haz 1.000.000 de clicks',
    emoji: '⚡',
    reward: { cps: 1000000, tickets: 10, title: 'Leyenda del Click' },
    check: (s) => s.totalClicks >= 1_000_000,
  },
  // ── Combos ──
  {
    id: 'combo-x10',
    group: 'Combos',
    title: 'Combo máximo',
    description: 'Alcanza un combo x10',
    emoji: '🔥',
    reward: { tickets: 3, cps: 5000 },
    check: (s) => s.comboTier >= 4,
  },
  // ── Ascensiones ──
  {
    id: 'asc-1',
    group: 'Ascensión',
    title: 'Primera ascensión',
    description: 'Completa 1 ascensión',
    emoji: '⭐',
    reward: { millas: 10000 },
    check: (s) => s.ascensions >= 1,
  },
  {
    id: 'asc-10',
    group: 'Ascensión',
    title: 'Veterano del cielo',
    description: 'Completa 10 ascensiones',
    emoji: '🌟',
    reward: { tickets: 15, millas: 50000 },
    check: (s) => s.ascensions >= 10,
  },
  {
    id: 'asc-50',
    group: 'Ascensión',
    title: 'Leyenda eterna',
    description: 'Completa 50 ascensiones',
    emoji: '💫',
    reward: { tickets: 50, title: 'Leyenda Eterna' },
    check: (s) => s.ascensions >= 50,
  },
];

export function getAchievement(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

export interface AchievementState {
  unlocked: string[]; // desbloqueados, pendientes de reclamar
  claimed: string[]; // recompensa ya entregada

  /** Evalúa el snapshot y marca los logros recién cumplidos. Devuelve los nuevos. */
  checkAchievements: (s: AchievementSnapshot) => AchievementDef[];
  /** Reclama la recompensa de un logro desbloqueado. Devuelve null si no procede. */
  claim: (achievementId: string) => AchievementReward | null;
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      unlocked: [],
      claimed: [],

      checkAchievements: (snapshot) => {
        const state = get();
        const known = new Set([...state.unlocked, ...state.claimed]);
        const fresh = ACHIEVEMENTS.filter((a) => !known.has(a.id) && a.check(snapshot));
        if (fresh.length > 0) {
          set({ unlocked: [...state.unlocked, ...fresh.map((a) => a.id)] });
        }
        return fresh;
      },

      claim: (achievementId) => {
        const state = get();
        if (!state.unlocked.includes(achievementId)) return null;
        const def = getAchievement(achievementId);
        if (!def) return null;
        set({
          unlocked: state.unlocked.filter((id) => id !== achievementId),
          claimed: [...state.claimed, achievementId],
        });
        return def.reward;
      },
    }),
    {
      name: ACHIEVEMENT_STORAGE_KEY,
      partialize: (state) => ({ unlocked: state.unlocked, claimed: state.claimed }),
    }
  )
);
