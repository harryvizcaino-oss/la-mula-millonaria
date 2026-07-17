import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CLICKER_UPGRADES } from '@/data/clickerUpgrades';
import {
  SPONSOR_POWERS,
  MAX_SPONSOR_LEVEL,
  getSponsorPower,
  getSponsorPowerCost,
  getSponsorPowerCPS,
} from '@/data/sponsorPowers';
import { DEFAULT_FLEET_ID, getFleetMultiplier, getFleetVehicle } from '@/data/fleetVehicles';

const CLICKER_STORAGE_KEY = 'truckSurfers_clicker_v5';
const OFFLINE_CAP_SECONDS = 8 * 60 * 60; // max 8 hours of offline progress

// Fleet payload persisted on the server inside the legacy `buildings` JSON column.
export interface FleetSnapshot {
  fleetOwned: string[];
  selectedFleet: string;
  cpsBalance: number;
}

export interface ClickerState {
  powerLevels: Record<string, number>; // niveles de los 10 poderes de marca (máx 100 c/u)
  upgrades: Record<string, boolean>; // catálogo legacy, sigue aplicando como multiplicador
  fleetOwned: string[]; // vehículos de flota comprados (multiplicadores)
  selectedFleet: string; // vehículo activo en pantalla
  cpsTotal: number; // CPS histórico acumulado — NUNCA baja (ranking)
  cpsBalance: number; // CPS disponible para gastar (moneda actual)
  totalClicks: number;
  totalEarned: number; // lifetime CPS producido (prestigio/ascensión)
  stars: number; // prestige points
  ascensions: number; // number of completed ascensions (max 50)
  goldenTickets: number;
  lastTickAt: number;
  offlineEarnings: number;
  autoclickUntil: number; // timestamp (ms) until autoclick is active
  autoclickLevel: number; // level of autoclick superpower

  // Actions
  tick: (dt: number) => number; // returns CPS produced this tick (0: per-click economy)
  click: () => { cps: number; millas: number };
  buyPower: (powerId: string) => { success: boolean; cost: number };
  buyFleet: (id: string, discountMult?: number) => { success: boolean; cost: number };
  selectFleet: (id: string) => boolean;
  redeemCps: (amount: number) => { success: boolean };
  buyUpgrade: (id: string, currentMillas: number) => { success: boolean; cost: number };
  addGoldenTickets: (amount: number) => void;
  redeemGoldenTickets: (amount: number) => { success: boolean; millasGained: number };
  prestige: () => { success: boolean; starsGained: number };
  clearOfflineEarnings: () => void;
  buyAutoclick: () => { success: boolean; cost: number; duration: number };
  addAscension: () => void;
  getCriticalChance: () => number;
  addEarnings: (amount: number) => void;
  hydrate: (saved: ClickerHydration) => void;
}

type ClickerComputed = Omit<
  ClickerState,
  keyof Pick<
    ClickerState,
    | 'tick'
    | 'click'
    | 'buyPower'
    | 'buyFleet'
    | 'selectFleet'
    | 'redeemCps'
    | 'buyUpgrade'
    | 'addGoldenTickets'
    | 'redeemGoldenTickets'
    | 'prestige'
    | 'clearOfflineEarnings'
    | 'buyAutoclick'
    | 'addAscension'
    | 'getCriticalChance'
    | 'addEarnings'
    | 'hydrate'
  >
>;

// Shape tolerated by hydrate(): the new model plus legacy fields that old
// server backups may still carry (ignored on purpose).
export type ClickerHydration = Partial<
  Pick<
    ClickerState,
    | 'powerLevels'
    | 'upgrades'
    | 'fleetOwned'
    | 'selectedFleet'
    | 'cpsTotal'
    | 'cpsBalance'
    | 'totalClicks'
    | 'totalEarned'
    | 'stars'
    | 'ascensions'
    | 'goldenTickets'
    | 'lastTickAt'
    | 'autoclickLevel'
  >
> & {
  fleet?: FleetSnapshot | null;
  buildings?: unknown; // legacy v4 — ignorado
  totalKm?: number; // legacy v4 — ignorado
};

function calculateProduction(_state: ClickerComputed): number {
  // Production per second is not used; all bonuses are per-click (CPS por click).
  // Kept for compatibility with legacy callers (offline earnings, events).
  return 0;
}

/**
 * SECTION C — fórmula core:
 *   CPS por click = (3 + Σ power CPS) × fleetMultiplier
 *   power CPS     = level × baseCPS × brandMultiplier (tier actual)
 * Compatibilidad: los upgrades click/global y las estrellas de prestigio
 * (+1% c/u) siguen aplicando como multiplicadores externos.
 */
function calculateClickPower(state: ClickerComputed): number {
  let sum = 3; // base CPS por click

  // Poderes de marca: lineal por nivel × multiplicador de la marca actual
  for (const p of SPONSOR_POWERS) {
    const level = state.powerLevels[p.id] || 0;
    if (level <= 0) continue;
    sum += getSponsorPowerCPS(p, level);
  }

  // Flota: multiplicador (×), no suma
  let mult = getFleetMultiplier(state.selectedFleet);

  // Upgrades legacy (click + global) como multiplicadores externos
  for (const u of CLICKER_UPGRADES) {
    if ((u.type === 'click' || u.type === 'global') && state.upgrades[u.id]) {
      mult *= u.multiplier;
    }
  }

  // Prestige stars: +1% per star
  mult *= 1 + state.stars * 0.01;

  return sum * mult;
}

/** Player Level = SUMA de todos los niveles de poder. */
function calculatePlayerLevel(state: ClickerComputed): number {
  return SPONSOR_POWERS.reduce(
    (acc, p) => acc + Math.min(MAX_SPONSOR_LEVEL, state.powerLevels[p.id] || 0),
    0
  );
}

export const useClickerStore = create<ClickerState>()(
  persist(
    (set, get) => ({
      powerLevels: {},
      upgrades: {},
      fleetOwned: [DEFAULT_FLEET_ID],
      selectedFleet: DEFAULT_FLEET_ID,
      cpsTotal: 0,
      cpsBalance: 0,
      totalClicks: 0,
      totalEarned: 0,
      stars: 0,
      ascensions: 0,
      goldenTickets: 0,
      lastTickAt: Date.now(),
      offlineEarnings: 0,
      autoclickUntil: 0,
      autoclickLevel: 0,

      tick: (_dt: number) => {
        const state = get();
        const production = calculateProduction(state);
        set({ lastTickAt: Date.now() });
        return production * _dt;
      },

      click: () => {
        const state = get();
        const power = calculateClickPower(state);
        set({
          totalClicks: state.totalClicks + 1,
          cpsBalance: state.cpsBalance + power,
          cpsTotal: state.cpsTotal + power,
          totalEarned: state.totalEarned + power,
        });
        return { cps: power, millas: power };
      },

      // Poderes se compran con CPS (balance). Costo escala ×1.15 por nivel.
      buyPower: (powerId: string) => {
        const state = get();
        const power = getSponsorPower(powerId);
        if (!power) return { success: false, cost: 0 };
        const currentLevel = state.powerLevels[powerId] || 0;
        if (currentLevel >= MAX_SPONSOR_LEVEL) return { success: false, cost: 0 };
        const cost = getSponsorPowerCost(power, currentLevel);
        if (state.cpsBalance < cost) return { success: false, cost };
        set({
          powerLevels: { ...state.powerLevels, [powerId]: currentLevel + 1 },
          cpsBalance: state.cpsBalance - cost,
        });
        return { success: true, cost };
      },

      // La flota se compra con Golden Tickets (🎟️), no con CPS.
      // Comprar un vehículo lo equipa automáticamente.
      buyFleet: (id: string, discountMult = 1) => {
        const state = get();
        const vehicle = getFleetVehicle(id);
        if (!vehicle) return { success: false, cost: 0 };
        if (state.fleetOwned.includes(id)) {
          set({ selectedFleet: id });
          return { success: true, cost: 0 };
        }
        const cost = Math.max(0, Math.ceil(vehicle.tickets * discountMult));
        if (state.goldenTickets < cost) return { success: false, cost };
        set({
          fleetOwned: [...state.fleetOwned, id],
          selectedFleet: id,
          goldenTickets: state.goldenTickets - cost,
        });
        return { success: true, cost };
      },

      selectFleet: (id: string) => {
        const state = get();
        if (!state.fleetOwned.includes(id)) return false;
        if (!getFleetVehicle(id)) return false;
        set({ selectedFleet: id });
        return true;
      },

      // Redimir CPS: solo baja el balance, cpsTotal (ranking) NO se toca.
      redeemCps: (amount: number) => {
        const state = get();
        if (amount <= 0 || state.cpsBalance < amount) return { success: false };
        set({ cpsBalance: state.cpsBalance - amount });
        return { success: true };
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
          powerLevels: {},
          upgrades: {},
          fleetOwned: [DEFAULT_FLEET_ID],
          selectedFleet: DEFAULT_FLEET_ID,
          cpsBalance: 0,
          // cpsTotal / totalEarned NO se reinician: son históricos
        });
        return { success: true, starsGained };
      },

      clearOfflineEarnings: () => set({ offlineEarnings: 0 }),

      addAscension: () => {
        set((state) => ({ ascensions: Math.min(50, state.ascensions + 1) }));
      },

      getCriticalChance: () => {
        const state = get();
        // Base 5% + 0.5% por nivel del upgrade 'precision' (Precisión del Conductor).
        // El upgrade aún no existe en el catálogo; se soporta por id para futuro.
        const precisionLevel =
          (state.powerLevels['precision'] || 0) + (state.upgrades['precision'] ? 1 : 0);
        return Math.min(0.25, 0.05 + 0.005 * precisionLevel);
      },

      addEarnings: (amount: number) => {
        if (amount <= 0) return;
        set((state) => ({
          cpsBalance: state.cpsBalance + amount,
          cpsTotal: state.cpsTotal + amount,
          totalEarned: state.totalEarned + amount,
        }));
      },

      // El autoclick se compra con CPS (balance).
      buyAutoclick: () => {
        const state = get();
        const nextLevel = state.autoclickLevel + 1;
        const cost = Math.floor(5000 * Math.pow(4, state.autoclickLevel));
        if (state.cpsBalance < cost) return { success: false, cost, duration: 0 };
        const duration = Math.min(120000, 15000 + nextLevel * 5000); // caps at 2 minutes
        set({
          cpsBalance: state.cpsBalance - cost,
          autoclickLevel: nextLevel,
          autoclickUntil: Math.max(state.autoclickUntil, Date.now()) + duration,
        });
        return { success: true, cost, duration };
      },

      hydrate: (saved) => {
        const next: Partial<ClickerState> = {};
        if (saved.powerLevels !== undefined) next.powerLevels = saved.powerLevels;
        if (saved.upgrades !== undefined) next.upgrades = saved.upgrades;
        if (saved.cpsTotal !== undefined) next.cpsTotal = saved.cpsTotal;
        if (saved.cpsBalance !== undefined) next.cpsBalance = saved.cpsBalance;
        if (saved.totalClicks !== undefined) next.totalClicks = saved.totalClicks;
        if (saved.totalEarned !== undefined) next.totalEarned = saved.totalEarned;
        if (saved.stars !== undefined) next.stars = saved.stars;
        if (saved.ascensions !== undefined) next.ascensions = saved.ascensions;
        if (saved.goldenTickets !== undefined) next.goldenTickets = saved.goldenTickets;
        if (saved.autoclickLevel !== undefined) next.autoclickLevel = saved.autoclickLevel;
        if (saved.lastTickAt !== undefined) next.lastTickAt = saved.lastTickAt;
        // Fleet puede venir directo o envuelto en el snapshot del servidor
        const fleet = saved.fleet ?? null;
        const fleetOwned = saved.fleetOwned ?? fleet?.fleetOwned;
        const selectedFleet = saved.selectedFleet ?? fleet?.selectedFleet;
        if (fleetOwned && fleetOwned.length > 0) next.fleetOwned = fleetOwned;
        if (selectedFleet && getFleetVehicle(selectedFleet)) next.selectedFleet = selectedFleet;
        if (saved.cpsBalance === undefined && fleet?.cpsBalance !== undefined) {
          next.cpsBalance = fleet.cpsBalance;
        }
        if (Object.keys(next).length > 0) set(next);
      },
    }),
    {
      name: CLICKER_STORAGE_KEY,
      partialize: (state) => ({
        powerLevels: state.powerLevels,
        upgrades: state.upgrades,
        fleetOwned: state.fleetOwned,
        selectedFleet: state.selectedFleet,
        cpsTotal: state.cpsTotal,
        cpsBalance: state.cpsBalance,
        totalClicks: state.totalClicks,
        totalEarned: state.totalEarned,
        stars: state.stars,
        ascensions: state.ascensions,
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
          state.cpsBalance += earned;
          state.cpsTotal += earned;
          state.totalEarned += earned;
        }
        state.lastTickAt = now;
      },
    }
  )
);

export { calculateProduction, calculateClickPower, calculatePlayerLevel };
