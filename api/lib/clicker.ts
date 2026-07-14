import {
  CLICKER_BUILDINGS,
  type ClickerBuilding,
} from "@/data/clickerBuildings";
import {
  CLICKER_UPGRADES,
  type ClickerUpgrade,
} from "@/data/clickerUpgrades";
import { POWER_LINES, type PowerLine } from "@/data/clickerPowers";

export interface ClickerSnapshot {
  buildings: Record<string, number>;
  upgrades: Record<string, boolean>;
  powerLevels: Record<string, number>;
  stars: number;
}

export function calculateClickPower(snapshot: ClickerSnapshot): number {
  let power = 1;

  // Click upgrade multipliers
  for (const u of CLICKER_UPGRADES) {
    if (u.type === "click" && snapshot.upgrades[u.id]) {
      power *= u.multiplier;
    }
  }

  // Fleet per-click bonuses: linear per owned level
  for (const b of CLICKER_BUILDINGS) {
    const owned = snapshot.buildings[b.id] || 0;
    if (owned <= 0) continue;
    power += b.baseClickBonus * owned;
  }

  // Power per-click bonuses: linear per power level
  for (const p of POWER_LINES) {
    const level = snapshot.powerLevels[p.id] || 0;
    if (level <= 0) continue;
    power += p.baseClickBonus * level;
  }

  // Global upgrades
  for (const u of CLICKER_UPGRADES) {
    if (u.type === "global" && snapshot.upgrades[u.id]) {
      power *= u.multiplier;
    }
  }

  // Prestige stars: +1% per star
  const starMult = 1 + snapshot.stars * 0.01;

  return power * starMult;
}

export function getBuildingById(id: string): ClickerBuilding | undefined {
  return CLICKER_BUILDINGS.find((b) => b.id === id);
}

export function getUpgradeById(id: string): ClickerUpgrade | undefined {
  return CLICKER_UPGRADES.find((u) => u.id === id);
}

export function getPowerById(id: string): PowerLine | undefined {
  return POWER_LINES.find((p) => p.id === id);
}
