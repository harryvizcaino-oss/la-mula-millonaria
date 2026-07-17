// ─────────────────────────────────────────────────────────────────────────────
// SECTION A: BRAND SPONSORSHIP SYSTEM
// 10 poderes, cada uno con 10 tiers de marca. Cada nivel comprado suma
// `baseCPS` multiplicado por el multiplicador de la marca (tier) actual.
// Fórmula: cpsPower = powerLevel × baseCPS × brandMultiplier
// ─────────────────────────────────────────────────────────────────────────────

export interface BrandTier {
  tier: number;
  brand: string;
  color: string;
  multiplier: number;
}

export interface SponsorPower {
  id: string;
  name: string;
  emoji: string;
  description: string;
  baseCPS: number;
  baseCost: number;
  tiers: BrandTier[]; // siempre 10 tiers
}

export const LEVELS_PER_TIER = 10;
export const MAX_SPONSOR_LEVEL = 100; // 10 tiers × 10 niveles
export const POWER_COST_GROWTH = 1.15; // costo escala ×1.15 por nivel

export const SPONSOR_POWERS: SponsorPower[] = [
  {
    id: 'filtro_aire',
    name: 'Filtro de Aire',
    emoji: '🌬️',
    description: 'Respiración limpia para el motor. El patrocinio de marca multiplica su CPS.',
    baseCPS: 1,
    baseCost: 15,
    tiers: [
      { tier: 1, brand: 'FRANIG', color: '#607D8B', multiplier: 1.0 },
      { tier: 2, brand: 'PARTMO', color: '#795548', multiplier: 1.5 },
      { tier: 3, brand: 'SAKURA', color: '#E91E63', multiplier: 2.2 },
      { tier: 4, brand: 'WIX', color: '#2196F3', multiplier: 3.0 },
      { tier: 5, brand: 'BALDWIN', color: '#FF9800', multiplier: 4.0 },
      { tier: 6, brand: 'DONSSON', color: '#9C27B0', multiplier: 5.5 },
      { tier: 7, brand: 'FLEETGUARD', color: '#00BCD4', multiplier: 7.0 },
      { tier: 8, brand: 'MANN-FILTER', color: '#3F51B5', multiplier: 9.0 },
      { tier: 9, brand: 'DONALDSON', color: '#1A237E', multiplier: 12.0 },
      { tier: 10, brand: 'CATERPILLAR', color: '#FFD700', multiplier: 16.0 },
    ],
  },
  {
    id: 'turbo_diesel',
    name: 'Turbo Diésel',
    emoji: '🔥',
    description: 'Más aire, más potencia. El turbo patrocinado empuja cada click.',
    baseCPS: 3,
    baseCost: 120,
    tiers: [
      { tier: 1, brand: 'GARRETT', color: '#607D8B', multiplier: 1.0 },
      { tier: 2, brand: 'HOLSET', color: '#795548', multiplier: 1.5 },
      { tier: 3, brand: 'BORGWARNER', color: '#E91E63', multiplier: 2.2 },
      { tier: 4, brand: 'CUMMINS TURBO', color: '#2196F3', multiplier: 3.0 },
      { tier: 5, brand: 'B&W TURBO', color: '#FF9800', multiplier: 4.0 },
      { tier: 6, brand: 'IHI', color: '#9C27B0', multiplier: 5.5 },
      { tier: 7, brand: 'SCHWITZER', color: '#00BCD4', multiplier: 7.0 },
      { tier: 8, brand: 'MTU TURBO', color: '#3F51B5', multiplier: 9.0 },
      { tier: 9, brand: 'HOLSET HE', color: '#1A237E', multiplier: 12.0 },
      { tier: 10, brand: 'CATERPILLAR TURBO', color: '#FFD700', multiplier: 16.0 },
    ],
  },
  {
    id: 'suspension',
    name: 'Suspensión',
    emoji: '🌀',
    description: 'Estabilidad de carga pesada. Las mejores marcas aguantan más CPS.',
    baseCPS: 8,
    baseCost: 960,
    tiers: [
      { tier: 1, brand: 'TRW', color: '#607D8B', multiplier: 1.0 },
      { tier: 2, brand: 'SACHS', color: '#795548', multiplier: 1.5 },
      { tier: 3, brand: 'MONROE', color: '#E91E63', multiplier: 2.2 },
      { tier: 4, brand: 'KONI', color: '#2196F3', multiplier: 3.0 },
      { tier: 5, brand: 'BOGE', color: '#FF9800', multiplier: 4.0 },
      { tier: 6, brand: 'HENRICKSON', color: '#9C27B0', multiplier: 5.5 },
      { tier: 7, brand: 'NEWAY', color: '#00BCD4', multiplier: 7.0 },
      { tier: 8, brand: 'VOLVO SUSPENSION', color: '#3F51B5', multiplier: 9.0 },
      { tier: 9, brand: 'SAF-HOLLAND', color: '#1A237E', multiplier: 12.0 },
      { tier: 10, brand: 'MERCEDES-BENZ SUSP', color: '#FFD700', multiplier: 16.0 },
    ],
  },
  {
    id: 'motor_v8',
    name: 'Motor V8',
    emoji: '🔧',
    description: 'El corazón de la mula. Un motor de marca patrocinada ruge en CPS.',
    baseCPS: 20,
    baseCost: 7680,
    tiers: [
      { tier: 1, brand: 'CUMMINS 4BT', color: '#607D8B', multiplier: 1.0 },
      { tier: 2, brand: 'CUMMINS 6BT', color: '#795548', multiplier: 1.5 },
      { tier: 3, brand: 'CUMMINS ISB', color: '#E91E63', multiplier: 2.2 },
      { tier: 4, brand: 'CUMMINS ISC', color: '#2196F3', multiplier: 3.0 },
      { tier: 5, brand: 'DETROIT DD13', color: '#FF9800', multiplier: 4.0 },
      { tier: 6, brand: 'DETROIT DD15', color: '#9C27B0', multiplier: 5.5 },
      { tier: 7, brand: 'CUMMINS ISX', color: '#00BCD4', multiplier: 7.0 },
      { tier: 8, brand: 'VOLVO D13', color: '#3F51B5', multiplier: 9.0 },
      { tier: 9, brand: 'MACK MP8', color: '#1A237E', multiplier: 12.0 },
      { tier: 10, brand: 'CATERPILLAR C15', color: '#FFD700', multiplier: 16.0 },
    ],
  },
  {
    id: 'frenos_abs',
    name: 'Frenos ABS',
    emoji: '🛑',
    description: 'Frenada segura con carga completa. Patrocinio que detiene récords.',
    baseCPS: 49,
    baseCost: 61440,
    tiers: [
      { tier: 1, brand: 'ATE', color: '#607D8B', multiplier: 1.0 },
      { tier: 2, brand: 'TEXTAR', color: '#795548', multiplier: 1.5 },
      { tier: 3, brand: 'BENDIX', color: '#E91E63', multiplier: 2.2 },
      { tier: 4, brand: 'MERITOR', color: '#2196F3', multiplier: 3.0 },
      { tier: 5, brand: 'WABCO', color: '#FF9800', multiplier: 4.0 },
      { tier: 6, brand: 'HALDEX', color: '#9C27B0', multiplier: 5.5 },
      { tier: 7, brand: 'KNORR-BREMSE', color: '#00BCD4', multiplier: 7.0 },
      { tier: 8, brand: 'MERITOR EX-LS', color: '#3F51B5', multiplier: 9.0 },
      { tier: 9, brand: 'WABCO EBS', color: '#1A237E', multiplier: 12.0 },
      { tier: 10, brand: 'CATERPILLAR BRAKE', color: '#FFD700', multiplier: 16.0 },
    ],
  },
  {
    id: 'refrigeracion',
    name: 'Refrigeración',
    emoji: '❄️',
    description: 'Motor frío, rendimiento caliente. La marca manda en la temperatura.',
    baseCPS: 122,
    baseCost: 491520,
    tiers: [
      { tier: 1, brand: 'BEHR', color: '#607D8B', multiplier: 1.0 },
      { tier: 2, brand: 'VALEO', color: '#795548', multiplier: 1.5 },
      { tier: 3, brand: 'DENSO', color: '#E91E63', multiplier: 2.2 },
      { tier: 4, brand: 'MODINE', color: '#2196F3', multiplier: 3.0 },
      { tier: 5, brand: 'NARVA', color: '#FF9800', multiplier: 4.0 },
      { tier: 6, brand: 'THERMAL POWER', color: '#9C27B0', multiplier: 5.5 },
      { tier: 7, brand: 'CUMMINS COOLING', color: '#00BCD4', multiplier: 7.0 },
      { tier: 8, brand: 'VOLVO COOLING', color: '#3F51B5', multiplier: 9.0 },
      { tier: 9, brand: 'RADIADORES DINA', color: '#1A237E', multiplier: 12.0 },
      { tier: 10, brand: 'CATERPILLAR COOLING', color: '#FFD700', multiplier: 16.0 },
    ],
  },
  {
    id: 'embrague_hd',
    name: 'Embrague HD',
    emoji: '⚙️',
    description: 'Transmisión de fuerza bruta. Cada cambio de marca se siente en el CPS.',
    baseCPS: 305,
    baseCost: 3932160,
    tiers: [
      { tier: 1, brand: 'LUK', color: '#607D8B', multiplier: 1.0 },
      { tier: 2, brand: 'SACHS CLUTCH', color: '#795548', multiplier: 1.5 },
      { tier: 3, brand: 'VALEO CLUTCH', color: '#E91E63', multiplier: 2.2 },
      { tier: 4, brand: 'EXEDY', color: '#2196F3', multiplier: 3.0 },
      { tier: 5, brand: 'EATON FULLER', color: '#FF9800', multiplier: 4.0 },
      { tier: 6, brand: 'CUMMINS CLUTCH', color: '#9C27B0', multiplier: 5.5 },
      { tier: 7, brand: 'MACK CLUTCH', color: '#00BCD4', multiplier: 7.0 },
      { tier: 8, brand: 'VOLVO CLUTCH', color: '#3F51B5', multiplier: 9.0 },
      { tier: 9, brand: 'EATON ULTRA', color: '#1A237E', multiplier: 12.0 },
      { tier: 10, brand: 'CATERPILLAR CLUTCH', color: '#FFD700', multiplier: 16.0 },
    ],
  },
  {
    id: 'direccion',
    name: 'Dirección',
    emoji: '🎯',
    description: 'Precisión milimétrica en cada curva. La dirección patrocinada apunta al CPS.',
    baseCPS: 762,
    baseCost: 31457280,
    tiers: [
      { tier: 1, brand: 'TRW STEERING', color: '#607D8B', multiplier: 1.0 },
      { tier: 2, brand: 'ZF LENKSYSTEME', color: '#795548', multiplier: 1.5 },
      { tier: 3, brand: 'BOSCH STEERING', color: '#E91E63', multiplier: 2.2 },
      { tier: 4, brand: 'DELPHI', color: '#2196F3', multiplier: 3.0 },
      { tier: 5, brand: 'MERITOR STEER', color: '#FF9800', multiplier: 4.0 },
      { tier: 6, brand: 'VOLVO STEERING', color: '#9C27B0', multiplier: 5.5 },
      { tier: 7, brand: 'SCANIA STEERING', color: '#00BCD4', multiplier: 7.0 },
      { tier: 8, brand: 'DAF STEERING', color: '#3F51B5', multiplier: 9.0 },
      { tier: 9, brand: 'MERCEDES STEERING', color: '#1A237E', multiplier: 12.0 },
      { tier: 10, brand: 'CATERPILLAR STEER', color: '#FFD700', multiplier: 16.0 },
    ],
  },
  {
    id: 'alternador',
    name: 'Alternador',
    emoji: '🔋',
    description: 'Energía eléctrica sin fin. El alternador de marca carga tu CPS.',
    baseCPS: 1907,
    baseCost: 251658240,
    tiers: [
      { tier: 1, brand: 'HELLA', color: '#607D8B', multiplier: 1.0 },
      { tier: 2, brand: 'BOSCH', color: '#795548', multiplier: 1.5 },
      { tier: 3, brand: 'DENSO ALT', color: '#E91E63', multiplier: 2.2 },
      { tier: 4, brand: 'VALEO ALT', color: '#2196F3', multiplier: 3.0 },
      { tier: 5, brand: 'PRESTOLITE', color: '#FF9800', multiplier: 4.0 },
      { tier: 6, brand: 'DELCO REMY', color: '#9C27B0', multiplier: 5.5 },
      { tier: 7, brand: 'CUMMINS ALT', color: '#00BCD4', multiplier: 7.0 },
      { tier: 8, brand: 'VOLVO ALT', color: '#3F51B5', multiplier: 9.0 },
      { tier: 9, brand: 'MACK ALT', color: '#1A237E', multiplier: 12.0 },
      { tier: 10, brand: 'CATERPILLAR ALT', color: '#FFD700', multiplier: 16.0 },
    ],
  },
  {
    id: 'scanner',
    name: 'Scanner Diagnóstico',
    emoji: '🔍',
    description: 'Diagnóstico total de la mula. El mejor scanner optimiza cada CPS.',
    baseCPS: 4768,
    baseCost: 2013265920,
    tiers: [
      { tier: 1, brand: 'OBD GENERIC', color: '#607D8B', multiplier: 1.0 },
      { tier: 2, brand: 'LAUNCH', color: '#795548', multiplier: 1.5 },
      { tier: 3, brand: 'AUTEL', color: '#E91E63', multiplier: 2.2 },
      { tier: 4, brand: 'BOSCH KTS', color: '#2196F3', multiplier: 3.0 },
      { tier: 5, brand: 'VOLVO VCADS', color: '#FF9800', multiplier: 4.0 },
      { tier: 6, brand: 'CUMMINS INSITE', color: '#9C27B0', multiplier: 5.5 },
      { tier: 7, brand: 'DETROIT DDL', color: '#00BCD4', multiplier: 7.0 },
      { tier: 8, brand: 'MACK V-MAC', color: '#3F51B5', multiplier: 9.0 },
      { tier: 9, brand: 'CATERPILLAR ET', color: '#1A237E', multiplier: 12.0 },
      { tier: 10, brand: 'CUMMINS INLINE', color: '#FFD700', multiplier: 16.0 },
    ],
  },
];

export function getSponsorPower(id: string): SponsorPower | undefined {
  return SPONSOR_POWERS.find((p) => p.id === id);
}

/** Tier de marca activo para un nivel dado (nivel 0 → tier 1 como preview). */
export function getBrandTier(power: SponsorPower, level: number): BrandTier {
  const idx =
    level <= 0
      ? 0
      : Math.min(power.tiers.length - 1, Math.floor((level - 1) / LEVELS_PER_TIER));
  return power.tiers[idx];
}

/** Costo del siguiente nivel: baseCost × 1.15^level. */
export function getSponsorPowerCost(power: SponsorPower, currentLevel: number): number {
  return Math.ceil(power.baseCost * Math.pow(POWER_COST_GROWTH, currentLevel));
}

/** CPS que aporta un poder: powerLevel × baseCPS × brandMultiplier (tier actual). */
export function getSponsorPowerCPS(power: SponsorPower, level: number): number {
  if (level <= 0) return 0;
  return level * power.baseCPS * getBrandTier(power, level).multiplier;
}

/** Progreso dentro del tier actual (0..LEVELS_PER_TIER). */
export function getTierProgress(level: number): number {
  if (level <= 0) return 0;
  return ((level - 1) % LEVELS_PER_TIER) + 1;
}
