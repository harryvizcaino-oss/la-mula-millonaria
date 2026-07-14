import { CLICKER_BUILDINGS } from './clickerBuildings';

export const MAX_POWER_LEVEL = 20;
export const POWER_UNLOCK_LEVEL = 5;

export interface PowerLine {
  id: string;
  name: string;
  emoji: string;
  target: string; // building id
  vehicleName: string;
  baseCostMult: number;
  perLevelCostMult: number;
  baseClickBonus: number; // clicks added per click per power level
  order: number; // index within the vehicle (0..4)
}

const CATEGORIES = [
  { name: 'Filtro de Aire', emoji: '🌬️', baseCostMult: 1, perLevelCostMult: 1.2 },
  { name: 'Bujías', emoji: '⚡', baseCostMult: 2, perLevelCostMult: 1.25 },
  { name: 'Frenos', emoji: '🛑', baseCostMult: 4, perLevelCostMult: 1.3 },
  { name: 'Suspensión', emoji: '🌀', baseCostMult: 8, perLevelCostMult: 1.35 },
  { name: 'Turbo', emoji: '🚀', baseCostMult: 16, perLevelCostMult: 1.4 },
];

export const POWER_LINES: PowerLine[] = [];

for (let vehicleIdx = 0; vehicleIdx < CLICKER_BUILDINGS.length; vehicleIdx++) {
  const vehicle = CLICKER_BUILDINGS[vehicleIdx];
  const tierMult = vehicleIdx + 1;
  CATEGORIES.forEach((cat, idx) => {
    // Category base doubles-ish: Filtro=1x, Bujías=3x, Frenos=7x, Suspensión=15x, Turbo=31x
    const categoryBase = Math.pow(2, idx + 1) - 1;
    POWER_LINES.push({
      id: `${vehicle.id}-power-${idx}`,
      name: `${cat.name}`,
      emoji: cat.emoji,
      target: vehicle.id,
      vehicleName: vehicle.name,
      baseCostMult: cat.baseCostMult,
      perLevelCostMult: cat.perLevelCostMult,
      baseClickBonus: tierMult * categoryBase,
      order: idx,
    });
  });
}

export function getPowerCost(power: PowerLine, level: number): number {
  // level is current level (0..20); next purchase costs this
  return Math.ceil(vehicleBaseCost(power.target) * power.baseCostMult * Math.pow(power.perLevelCostMult, level));
}

export function isPowerUnlocked(powerLevels: Record<string, number>, power: PowerLine): boolean {
  if (power.order === 0) return true;
  const prevId = power.id.replace(/-\d+$/, `-${power.order - 1}`);
  return (powerLevels[prevId] || 0) >= POWER_UNLOCK_LEVEL;
}

function vehicleBaseCost(vehicleId: string): number {
  return CLICKER_BUILDINGS.find((b) => b.id === vehicleId)?.baseCost ?? 1;
}
