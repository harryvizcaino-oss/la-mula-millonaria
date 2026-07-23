import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const QUEST_STORAGE_KEY = 'truckSurfers_quests_v1';

export type QuestType = 'clicks' | 'comboTier' | 'buyPower' | 'collectTickets' | 'earnCps' | 'buyFleet';
export type QuestPeriod = 'daily' | 'weekly';

export interface QuestReward {
  cps?: number;
  tickets?: number;
  millas?: number;
}

export interface Quest {
  id: string;
  type: QuestType;
  period: QuestPeriod;
  title: string;
  emoji: string;
  target: number;
  progress: number;
  reward: QuestReward;
  claimed: boolean;
}

function dayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** Clave de la semana: fecha local del lunes de esta semana. */
function weekKey(d: Date = new Date()): string {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // lunes = 0
  date.setDate(date.getDate() - day);
  return dayKey(date);
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** PRNG determinístico para que todos los clientes vean las mismas misiones del día. */
function seededRandom(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

interface QuestTemplate {
  type: QuestType;
  emoji: string;
  title: (target: number) => string;
  minTarget: number;
  maxTarget: number;
  step: number; // redondeo del objetivo
  reward: (target: number) => QuestReward;
}

const DAILY_TEMPLATES: QuestTemplate[] = [
  {
    type: 'clicks',
    emoji: '👆',
    title: (t) => `Haz ${t.toLocaleString('es-CO')} clicks`,
    minTarget: 300,
    maxTarget: 2000,
    step: 100,
    reward: (t) => ({ cps: t * 2 }),
  },
  {
    type: 'earnCps',
    emoji: '⚡',
    title: (t) => `Gana ${t.toLocaleString('es-CO')} CPS`,
    minTarget: 5000,
    maxTarget: 100000,
    step: 1000,
    reward: (t) => ({ cps: Math.floor(t * 0.2), millas: Math.floor(t * 0.05) }),
  },
  {
    type: 'collectTickets',
    emoji: '🎟️',
    title: (t) => `Recolecta ${t} Golden Tickets`,
    minTarget: 2,
    maxTarget: 6,
    step: 1,
    reward: (t) => ({ tickets: Math.max(1, Math.floor(t / 2)) }),
  },
  {
    type: 'buyPower',
    emoji: '🔧',
    title: (t) => `Compra ${t} niveles de poder`,
    minTarget: 3,
    maxTarget: 10,
    step: 1,
    reward: (t) => ({ cps: t * 500, millas: t * 200 }),
  },
  {
    type: 'comboTier',
    emoji: '🔥',
    title: (t) => `Alcanza un combo x${t === 4 ? 10 : t === 3 ? 5 : t === 2 ? 3 : 2}`,
    minTarget: 2,
    maxTarget: 4,
    step: 1,
    reward: (t) => ({ tickets: t - 1, cps: t * 1000 }),
  },
];

const WEEKLY_TEMPLATES: QuestTemplate[] = [
  {
    type: 'clicks',
    emoji: '👆',
    title: (t) => `Haz ${t.toLocaleString('es-CO')} clicks esta semana`,
    minTarget: 10000,
    maxTarget: 10000,
    step: 1,
    reward: () => ({ cps: 50000, tickets: 10 }),
  },
  {
    type: 'earnCps',
    emoji: '⚡',
    title: (t) => `Gana ${t.toLocaleString('es-CO')} CPS esta semana`,
    minTarget: 1000000,
    maxTarget: 1000000,
    step: 1,
    reward: () => ({ cps: 200000, millas: 50000, tickets: 5 }),
  },
  {
    type: 'buyFleet',
    emoji: '🚛',
    title: () => 'Compra 1 vehículo de flota',
    minTarget: 1,
    maxTarget: 1,
    step: 1,
    reward: () => ({ tickets: 8, millas: 20000 }),
  },
  {
    type: 'buyPower',
    emoji: '🔧',
    title: (t) => `Compra ${t} niveles de poder esta semana`,
    minTarget: 30,
    maxTarget: 30,
    step: 1,
    reward: () => ({ cps: 100000, tickets: 6 }),
  },
  {
    type: 'collectTickets',
    emoji: '🎟️',
    title: (t) => `Recolecta ${t} Golden Tickets esta semana`,
    minTarget: 20,
    maxTarget: 20,
    step: 1,
    reward: () => ({ tickets: 10, millas: 30000 }),
  },
];

function rollTarget(tpl: QuestTemplate, rand: () => number): number {
  const raw = tpl.minTarget + rand() * (tpl.maxTarget - tpl.minTarget);
  return Math.max(tpl.step, Math.round(raw / tpl.step) * tpl.step);
}

function buildQuest(tpl: QuestTemplate, period: QuestPeriod, target: number, id: string): Quest {
  return {
    id,
    type: tpl.type,
    period,
    title: tpl.title(target),
    emoji: tpl.emoji,
    target,
    progress: 0,
    reward: tpl.reward(target),
    claimed: false,
  };
}

export function generateDailyQuests(date: string = dayKey()): Quest[] {
  const rand = seededRandom(hashSeed(`daily-${date}`));
  // Elige 3 tipos distintos del pool, barajados con el seed del día
  const pool = [...DAILY_TEMPLATES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3).map((tpl, i) => buildQuest(tpl, 'daily', rollTarget(tpl, rand), `d-${date}-${i}`));
}

export function generateWeeklyQuest(week: string = weekKey()): Quest {
  const rand = seededRandom(hashSeed(`weekly-${week}`));
  const tpl = WEEKLY_TEMPLATES[Math.floor(rand() * WEEKLY_TEMPLATES.length)];
  return buildQuest(tpl, 'weekly', rollTarget(tpl, rand), `w-${week}`);
}

export interface QuestState {
  dailyKey: string;
  weeklyKey: string;
  quests: Quest[]; // 3 diarias + 1 semanal

  ensureQuests: () => void;
  progress: (type: QuestType, amount?: number) => void;
  claim: (questId: string) => QuestReward | null;
}

export const useQuestStore = create<QuestState>()(
  persist(
    (set, get) => ({
      dailyKey: '',
      weeklyKey: '',
      quests: [],

      // Rota las misiones si cambió el día local o la semana (lunes)
      ensureQuests: () => {
        const state = get();
        const today = dayKey();
        const week = weekKey();
        let quests = state.quests;
        let changed = false;
        if (state.dailyKey !== today) {
          quests = [...generateDailyQuests(today), ...quests.filter((q) => q.period === 'weekly')];
          changed = true;
        }
        if (state.weeklyKey !== week) {
          quests = [...quests.filter((q) => q.period === 'daily'), generateWeeklyQuest(week)];
          changed = true;
        }
        if (changed) set({ dailyKey: today, weeklyKey: week, quests });
      },

      progress: (type, amount = 1) => {
        set((state) => ({
          quests: state.quests.map((q) => {
            if (q.type !== type || q.claimed || q.progress >= q.target) return q;
            // comboTier registra el MEJOR tier alcanzado, no una suma
            const next =
              q.type === 'comboTier'
                ? Math.max(q.progress, amount)
                : q.progress + amount;
            return { ...q, progress: Math.min(q.target, next) };
          }),
        }));
      },

      claim: (questId) => {
        const state = get();
        const quest = state.quests.find((q) => q.id === questId);
        if (!quest || quest.claimed || quest.progress < quest.target) return null;
        set({
          quests: state.quests.map((q) => (q.id === questId ? { ...q, claimed: true } : q)),
        });
        return quest.reward;
      },
    }),
    {
      name: QUEST_STORAGE_KEY,
      partialize: (state) => ({
        dailyKey: state.dailyKey,
        weeklyKey: state.weeklyKey,
        quests: state.quests,
      }),
    }
  )
);
