import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CLICKER_BUILDINGS, getBuildingTicketCost } from '@/data/clickerBuildings';
import { CLICKER_UPGRADES } from '@/data/clickerUpgrades';
import { POWER_LINES, getPowerCost, MAX_POWER_LEVEL } from '@/data/clickerPowers';

const CLICKER_STORAGE_KEY = 'truckSurfers_clicker_v4';
const OFFLINE_CAP_SECONDS = 8 * 60 * 60; // max 8 hours of offline progress

export interface ClickerState {
  buildings: Record<string, number>;
  upgrades: Record<string, boolean>;
  powerLevels: Record<string, number>;
  totalClicks: number;
  totalKm: number;
  totalEarned: number; // lifetime TicaMillas produced by clicker
  stars: number; // prestige points
  goldenTickets: number;
  lastTickAt: number;
  offlineEarnings: number;
  autoclickUntil: number; // timestamp (ms) until autoclick is active
  autoclickLevel: number; // level of autoclick superpower

  // Actions
  tick: (dt: number) => number; // returns TicaMillas produced this tick
  click: () => { millas: number; km: number };
  buyBuilding: (id: string) => { success: boolean; cost: number };
  buyUpgrade: (id: string, currentMillas: number) => { success: boolean; cost: number };
  buyPower: (powerId: string, currentMillas: number) => { success: boolean; cost: number };
  addGoldenTickets: (amount: number) => void;
  redeemGoldenTickets: (amount: number) => { success: boolean; millasGained: number };
  prestige: () => { success: boolean; starsGained: number };
  clearOfflineEarnings: () => void;
  buyAutoclick: (currentMillas: number) => { success: boolean; cost: number; duration: number };
  hydrate: (saved: Partial<Omit<ClickerState, keyof Pick<ClickerState, 'tick' | 'click' | 'buyBuilding' | 'buyUpgrade' | 'buyPower' | 'addGoldenTickets' | 'redeemGoldenTickets' | 'prestige' | 'clearOfflineEarnings' | 'buyAutoclick' | 'hydrate'>>>) => void;
}

function calculateProduction(state: Omit<ClickerState, keyof Pick<ClickerState, 'tick' | 'click' | 'buyBuilding' | 'buyUpgrade' | 'buyPower' | 'addGoldenTickets' | 'redeemGoldenTickets' | 'prestige' | 'clearOfflineEarnings' | 'buyAutoclick'>>): number {
  // Production per second is no longer used; all bonuses are per-click.
  // Kept for compatibility with legacy callers (offline earnings, events).
  return 0;
}

function calculateClickPower(state: Omit<ClickerState, keyof Pick<ClickerState, 'tick' | 'click' | 'buyBuilding' | 'buyUpgrade' | 'buyPower' | 'addGoldenTickets' | 'redeemGoldenTickets' | 'prestige' | 'clearOfflineEarnings' | 'buyAutoclick'>>): number {
  let power = 1;

  // Click upgrade multipliers
  for (const u of CLICKER_UPGRADES) {
    if (u.type === 'click' && state.upgrades[u.id]) {
      power *= u.multiplier;
    }
  }

  // Fleet per-click bonuses: linear per owned level
  for (const b of CLICKER_BUILDINGS) {
    const owned = state.buildings[b.id] || 0;
    if (owned <= 0) continue;
    power += b.baseClickBonus * owned;
  }

  // Power per-click bonuses: linear per power level
  for (const p of POWER_LINES) {
    const level = state.powerLevels[p.id] || 0;
    if (level <= 0) continue;
    power += p.baseClickBonus * level;
  }

  // Global upgrades
  for (const u of CLICKER_UPGRADES) {
    if (u.type === 'global' && state.upgrades[u.id]) {
      power *= u.multiplier;
    }
  }

  // Prestige stars: +1% per star
  const starMult = 1 + state.stars * 0.01;

  return power * starMult;
}

export const useClickerStore = create<ClickerState>()(
  persist(
    (set, get) => ({
      buildings: { motoneta: 1 },
      upgrades: {},
      powerLevels: {},
      totalClicks: 0,
      totalKm: 0,
      totalEarned: 0,
      stars: 0,
      goldenTickets: 0,
      lastTickAt: Date.now(),
      offlineEarnings: 0,
      autoclickUntil: 0,
      autoclickLevel: 0,

      tick: (dt: number) => {
        const state = get();
        const production = calculateProduction(state);
        const earned = production * dt;
        const kmGained = production * dt * 0.1; // 1 km ~= 10 TicaMillas
        set({
          totalEarned: state.totalEarned + earned,
          totalKm: state.totalKm + kmGained,
          lastTickAt: Date.now(),
        });
        return earned;
      },

      click: () => {
        const state = get();
        const power = calculateClickPower(state);
        const km = power * 0.1;
        set({
          totalClicks: state.totalClicks + 1,
          totalEarned: state.totalEarned + power,
          totalKm: state.totalKm + km,
        });
        return { millas: power, km };
      },

      buyBuilding: (id: string) => {
        const state = get();
        const building = CLICKER_BUILDINGS.find((b) => b.id === id);
        if (!building) return { success: false, cost: 0 };
        const owned = state.buildings[id] || 0;
        const cost = getBuildingTicketCost(building, owned);
        if (state.goldenTickets < cost) return { success: false, cost };
        set({
          buildings: { ...state.buildings, [id]: owned + 1 },
          goldenTickets: state.goldenTickets - cost,
        });
        return { success: true, cost };
      },

      buyUpgrade: (id: string, currentMillas: number) => {
        const state = get();
        const upgrade = CLICKER_UPGRADES.find((u) => u.id === id);
        if (!upgrade || state.upgrades[id]) return { success: false, cost: 0 };
        if (currentMillas < upgrade.cost) return { success: false, cost: upgrade.cost };
        set({
          upgrades: { ...state.upgrades, [id]: true },
        });
        return { success: true, cost: upgrade.cost };
      },

      buyPower: (powerId: string, currentMillas: number) => {
        const state = get();
        const power = POWER_LINES.find((p) => p.id === powerId);
        if (!power) return { success: false, cost: 0 };
        const currentLevel = state.powerLevels[powerId] || 0;
        if (currentLevel >= MAX_POWER_LEVEL) return { success: false, cost: 0 };
        const cost = getPowerCost(power, currentLevel);
        if (currentMillas < cost) return { success: false, cost };
        set({
          powerLevels: { ...state.powerLevels, [powerId]: currentLevel + 1 },
        });
        return { success: true, cost };
      },

      addGoldenTickets: (amount: number) => {
        set((state) => ({ goldenTickets: state.goldenTickets + amount }));
      },

      redeemGoldenTickets: (amount: number) => {
        const state = get();
        if (amount <= 0 || state.goldenTickets < amount) return { success: false, millasGained: 0 };
        const millasGained = amount * 1000;
        set({ goldenTickets: state.goldenTickets - amount });
        return { success: true, millasGained };
      },

      prestige: () => {
        const state = get();
        // Cookie Clicker style: 1 star per threshold of lifetime earnings
        const threshold = 1_000_000;
        const potentialStars = Math.floor(Math.sqrt(state.totalEarned / threshold));
        const starsGained = Math.max(0, potentialStars - state.stars);
        if (starsGained <= 0) return { success: false, starsGained: 0 };
        set({
          stars: state.stars + starsGained,
          buildings: {},
          upgrades: {},
        });
        return { success: true, starsGained };
      },

      clearOfflineEarnings: () => set({ offlineEarnings: 0 }),

      buyAutoclick: (currentMillas: number) => {
        const state = get();
        const nextLevel = state.autoclickLevel + 1;
        const cost = Math.floor(5000 * Math.pow(4, state.autoclickLevel));
        if (currentMillas < cost) return { success: false, cost, duration: 0 };
        const duration = Math.min(120000, 15000 + nextLevel * 5000); // caps at 2 minutes
        set({
          autoclickLevel: nextLevel,
          autoclickUntil: Math.max(state.autoclickUntil, Date.now()) + duration,
        });
        return { success: true, cost, duration };
      },

      hydrate: (saved) => {
        const next: Partial<ClickerState> = {};
        if (saved.buildings !== undefined) next.buildings = saved.buildings;
        if (saved.upgrades !== undefined) next.upgrades = saved.upgrades;
        if (saved.powerLevels !== undefined) next.powerLevels = saved.powerLevels;
        if (saved.totalClicks !== undefined) next.totalClicks = saved.totalClicks;
        if (saved.totalKm !== undefined) next.totalKm = saved.totalKm;
        if (saved.totalEarned !== undefined) next.totalEarned = saved.totalEarned;
        if (saved.stars !== undefined) next.stars = saved.stars;
        if (saved.goldenTickets !== undefined) next.goldenTickets = saved.goldenTickets;
        if (saved.autoclickLevel !== undefined) next.autoclickLevel = saved.autoclickLevel;
        if (saved.lastTickAt !== undefined) next.lastTickAt = saved.lastTickAt;
        if (Object.keys(next).length > 0) set(next);
      },
    }),
    {
      name: CLICKER_STORAGE_KEY,
      partialize: (state) => ({
        buildings: state.buildings,
        upgrades: state.upgrades,
        powerLevels: state.powerLevels,
        totalClicks: state.totalClicks,
        totalKm: state.totalKm,
        totalEarned: state.totalEarned,
        stars: state.stars,
        goldenTickets: state.goldenTickets,
        lastTickAt: state.lastTickAt,
        offlineEarnings: state.offlineEarnings,
        autoclickLevel: state.autoclickLevel,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const now = Date.now();
        const offlineSeconds = Math.min(
          OFFLINE_CAP_SECONDS,
          Math.max(0, (now - state.lastTickAt) / 1000)
        );
        if (offlineSeconds > 1) {
          const production = calculateProduction(state);
          const earned = production * offlineSeconds;
          state.offlineEarnings = earned;
          state.totalEarned += earned;
          state.totalKm += earned * 0.1;
        }
        state.lastTickAt = now;
      },
    }
  )
);

export { calculateProduction, calculateClickPower };
