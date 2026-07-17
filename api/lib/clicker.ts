import { CLICKER_UPGRADES, type ClickerUpgrade } from "@/data/clickerUpgrades";
import {
  SPONSOR_POWERS,
  getSponsorPower,
  getSponsorPowerCPS,
  type SponsorPower,
} from "@/data/sponsorPowers";
import { getFleetVehicle, type FleetVehicle } from "@/data/fleetVehicles";

export interface ClickerSnapshot {
  fleet: { fleetOwned: string[]; selectedFleet: string; cpsBalance: number } | null;
  upgrades: Record<string, boolean>;
  powerLevels: Record<string, number>;
  stars: number;
}

/**
 * Nueva fórmula core:
 *   CPS por click = (3 + Σ power CPS) × fleetMultiplier
 *   power CPS     = level × baseCPS × brandMultiplier (tier actual)
 * Upgrades legacy y estrellas de prestigio aplican como multiplicadores externos.
 */
export function calculateClickPower(snapshot: ClickerSnapshot): number {
  let sum = 3; // base CPS por click

  for (const p of SPONSOR_POWERS) {
    const level = snapshot.powerLevels[p.id] || 0;
    if (level <= 0) continue;
    sum += getSponsorPowerCPS(p, level);
  }

  // Flota: multiplicador (×), no suma
  let mult = getFleetVehicle(snapshot.fleet?.selectedFleet ?? "")?.multiplier ?? 1;

  // Upgrades legacy (click + global) como multiplicadores externos
  for (const u of CLICKER_UPGRADES) {
    if ((u.type === "click" || u.type === "global") && snapshot.upgrades[u.id]) {
      mult *= u.multiplier;
    }
  }

  // Prestige stars: +1% per star
  mult *= 1 + snapshot.stars * 0.01;

  return sum * mult;
}

export function getFleetVehicleById(id: string): FleetVehicle | undefined {
  return getFleetVehicle(id);
}

export function getUpgradeById(id: string): ClickerUpgrade | undefined {
  return CLICKER_UPGRADES.find((u) => u.id === id);
}

export function getPowerById(id: string): SponsorPower | undefined {
  return getSponsorPower(id);
}
