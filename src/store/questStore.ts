import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useClickerStore, calculateClickPower } from '@/store/clickerStore';

const QUEST_STORAGE_KEY = 'truckSurfers_quests_v1';

/** Full fleet size — buyFleet quests become dead-ends past this. */
const FLEET_COMPLETE_COUNT = 10;

/**
 * Relative CPS reward: at least the template base, or `floor(clickPower * k)`.
 * Daily uses a milder k; weekly a stronger one so late-game claims stay meaningful.
 */
export const QUEST_CPS_K_DAILY = 20;
export const QUEST_CPS_K_WEEKLY = 100;

export type QuestType =
  | 'clicks'
  | 'comboTier'
  | 'buyPower'
  | 'collectTickets'
  | 'earnCps'
  | 'buyFleet'
  /** Anti-dead-end replacement when the fleet is complete (progresses via collectTickets). */
  | 'earnTickets'
  /** Anti-dead-end replacement; progresses when Game wires `progress('spendTickets')`. */
  | 'spendTickets';

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

export interface QuestClaimCtx {
  /** CPS por click actual — preferido para testabilidad. */
  clickPower?: number;
}

export interface QuestEnsureCtx {
  /** Cantidad de vehículos de flota owned; si ≥10, buyFleet se sustituye. */
  fleetOwnedCount?: number;
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

/** Sustitutos cuando la flota ya está completa (anti-dead-end). */
const FLEET_FALLBACK_TEMPLATES: QuestTemplate[] = [
  {
    type: 'earnTickets',
    emoji: '🎟️',
    title: (t) => `Gana ${t} Golden Tickets`,
    minTarget: 5,
    maxTarget: 15,
    step: 1,
    reward: (t) => ({ tickets: Math.max(2, Math.floor(t / 2)), cps: t * 2000 }),
  },
  {
    type: 'spendTickets',
    emoji: '🛍️',
    title: (t) => `Gasta ${t} Golden Tickets`,
    minTarget: 3,
    maxTarget: 10,
    step: 1,
    reward: (t) => ({ millas: t * 5000, cps: t * 3000 }),
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

/** Si buyFleet y flota completa → earnTickets / spendTickets (mismo id, progreso 0). */
function replaceFleetIfDeadEnd(quest: Quest, fleetOwnedCount: number, rand: () => number): Quest {
  if (quest.type !== 'buyFleet' || fleetOwnedCount < FLEET_COMPLETE_COUNT) return quest;
  const tpl = FLEET_FALLBACK_TEMPLATES[Math.floor(rand() * FLEET_FALLBACK_TEMPLATES.length)];
  const target = rollTarget(tpl, rand);
  return buildQuest(tpl, quest.period, target, quest.id);
}

function resolveFleetCount(ctx?: QuestEnsureCtx): number {
  if (ctx?.fleetOwnedCount != null) return ctx.fleetOwnedCount;
  try {
    return useClickerStore.getState().fleetOwned?.length ?? 0;
  } catch {
    return 0;
  }
}

function resolveClickPower(ctx?: QuestClaimCtx): number {
  if (ctx?.clickPower != null && Number.isFinite(ctx.clickPower)) return Math.max(0, ctx.clickPower);
  try {
    return calculateClickPower(useClickerStore.getState());
  } catch {
    return 0;
  }
}

/** Escala CPS fijos del reward con clickPower (tickets/millas intactos). */
export function scaleQuestCpsReward(reward: QuestReward, clickPower: number, period: QuestPeriod): QuestReward {
  if (reward.cps == null || reward.cps <= 0) return reward;
  const k = period === 'weekly' ? QUEST_CPS_K_WEEKLY : QUEST_CPS_K_DAILY;
  const scaled = Math.max(reward.cps, Math.floor(clickPower * k));
  if (scaled === reward.cps) return reward;
  return { ...reward, cps: scaled };
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

export function generateWeeklyQuest(
  week: string = weekKey(),
  fleetOwnedCount: number = 0
): Quest {
  const rand = seededRandom(hashSeed(`weekly-${week}`));
  const tpl = WEEKLY_TEMPLATES[Math.floor(rand() * WEEKLY_TEMPLATES.length)];
  const quest = buildQuest(tpl, 'weekly', rollTarget(tpl, rand), `w-${week}`);
  return replaceFleetIfDeadEnd(quest, fleetOwnedCount, rand);
}

/** Progress type aliases: collectTickets also advances earnTickets. */
function questMatchesProgress(questType: QuestType, progressType: QuestType): boolean {
  if (questType === progressType) return true;
  if (progressType === 'collectTickets' && questType === 'earnTickets') return true;
  return false;
}

export interface QuestState {
  dailyKey: string;
  weeklyKey: string;
  quests: Quest[]; // 3 diarias + 1 semanal

  ensureQuests: (ctx?: QuestEnsureCtx) => void;
  progress: (type: QuestType, amount?: number) => void;
  claim: (questId: string, ctx?: QuestClaimCtx) => QuestReward | null;
}

export const useQuestStore = create<QuestState>()(
  persist(
    (set, get) => ({
      dailyKey: '',
      weeklyKey: '',
      quests: [],

      // Rota las misiones si cambió el día local o la semana (lunes).
      // Anti-dead-end: buyFleet con flota ≥10 → earnTickets/spendTickets.
      ensureQuests: (ctx) => {
        const state = get();
        const today = dayKey();
        const week = weekKey();
        const fleetCount = resolveFleetCount(ctx);
        let quests = state.quests;
        let changed = false;
        if (state.dailyKey !== today) {
          quests = [...generateDailyQuests(today), ...quests.filter((q) => q.period === 'weekly')];
          changed = true;
        }
        if (state.weeklyKey !== week) {
          quests = [...quests.filter((q) => q.period === 'daily'), generateWeeklyQuest(week, fleetCount)];
          changed = true;
        }
        // Patch an already-rolled buyFleet that became impossible mid-week
        const rand = seededRandom(hashSeed(`fleet-patch-${week}`));
        const patched = quests.map((q) => {
          if (q.claimed || q.type !== 'buyFleet') return q;
          const next = replaceFleetIfDeadEnd(q, fleetCount, rand);
          if (next !== q) changed = true;
          return next;
        });
        if (changed) set({ dailyKey: today, weeklyKey: week, quests: patched });
      },

      progress: (type, amount = 1) => {
        set((state) => ({
          quests: state.quests.map((q) => {
            if (!questMatchesProgress(q.type, type) || q.claimed || q.progress >= q.target) return q;
            // comboTier registra el MEJOR tier alcanzado, no una suma
            const next =
              q.type === 'comboTier'
                ? Math.max(q.progress, amount)
                : q.progress + amount;
            return { ...q, progress: Math.min(q.target, next) };
          }),
        }));
      },

      claim: (questId, ctx) => {
        const state = get();
        const quest = state.quests.find((q) => q.id === questId);
        if (!quest || quest.claimed || quest.progress < quest.target) return null;
        set({
          quests: state.quests.map((q) => (q.id === questId ? { ...q, claimed: true } : q)),
        });
        const clickPower = resolveClickPower(ctx);
        return scaleQuestCpsReward(quest.reward, clickPower, quest.period);
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
