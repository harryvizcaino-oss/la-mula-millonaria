// ─────────────────────────────────────────────────────────────────────────────
// ÁLBUM DE COLECCIONABLES (F14)
// 23 coleccionables en 5 sets temáticos. Se obtienen por drops (clicks,
// compras de poder, tiers, misiones, eventos, minijuegos, ascensión) o
// comprando sobres en el álbum. Completar un set da un bonus permanente
// pequeño al CPS por click (aplicado en calculateClickPower).
// ─────────────────────────────────────────────────────────────────────────────

export type CollectibleRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface CollectibleSet {
  id: string;
  name: string;
  emoji: string;
  description: string;
  /** Bonus al CPS por click al completar el set (porcentaje). */
  bonusPct: number;
}

export interface CollectibleDef {
  id: string;
  setId: string;
  name: string;
  emoji: string;
  rarity: CollectibleRarity;
}

export const COLLECTIBLE_SETS: CollectibleSet[] = [
  {
    id: 'legendary-trucks',
    name: 'Camiones Legendarios',
    emoji: '🚛',
    description: 'Las mulas que hicieron historia en las vías de Colombia.',
    bonusPct: 2,
  },
  {
    id: 'sponsor-brands',
    name: 'Marcas Patrocinadoras',
    emoji: '🔧',
    description: 'Los repuestos y marcas que mueven la economía del juego.',
    bonusPct: 2,
  },
  {
    id: 'colombia-cities',
    name: 'Ciudades de Colombia',
    emoji: '🗺️',
    description: 'Las paradas de la Ruta Nacional, de Bogotá a Barranquilla.',
    bonusPct: 1,
  },
  {
    id: 'epic-powerups',
    name: 'Power-ups Épicos',
    emoji: '🚀',
    description: 'Los poderes que sacan chispas del camión.',
    bonusPct: 1,
  },
  {
    id: 'special-events',
    name: 'Eventos Especiales',
    emoji: '🎉',
    description: 'Recuerdos de caravanas, ascensiones y fiestas del gremio.',
    bonusPct: 3,
  },
];

export const COLLECTIBLES: CollectibleDef[] = [
  // ── Camiones Legendarios ──
  { id: 'truck-mula', setId: 'legendary-trucks', name: 'La Mula Fiel', emoji: '🚛', rarity: 'common' },
  { id: 'truck-kenworth', setId: 'legendary-trucks', name: 'Kenworth W900', emoji: '🚚', rarity: 'common' },
  { id: 'truck-scania', setId: 'legendary-trucks', name: 'Scania V8', emoji: '🛻', rarity: 'rare' },
  { id: 'truck-diablo', setId: 'legendary-trucks', name: 'Diablo Rojo', emoji: '🏎️', rarity: 'epic' },
  { id: 'truck-tesla', setId: 'legendary-trucks', name: 'Tesla Semi', emoji: '⚡', rarity: 'legendary' },

  // ── Marcas Patrocinadoras ──
  { id: 'brand-filtro', setId: 'sponsor-brands', name: 'Filtro de Oro', emoji: '🧰', rarity: 'common' },
  { id: 'brand-turbo', setId: 'sponsor-brands', name: 'Turbo Maestro', emoji: '💨', rarity: 'common' },
  { id: 'brand-motor', setId: 'sponsor-brands', name: 'Motor V8', emoji: '⚙️', rarity: 'rare' },
  { id: 'brand-frenos', setId: 'sponsor-brands', name: 'Frenos ABS Pro', emoji: '🛞', rarity: 'rare' },
  { id: 'brand-scanner', setId: 'sponsor-brands', name: 'Scanner X', emoji: '🔍', rarity: 'epic' },

  // ── Ciudades de Colombia ──
  { id: 'city-bogota', setId: 'colombia-cities', name: 'Bogotá', emoji: '🏙️', rarity: 'common' },
  { id: 'city-medellin', setId: 'colombia-cities', name: 'Medellín', emoji: '🌆', rarity: 'common' },
  { id: 'city-cali', setId: 'colombia-cities', name: 'Cali', emoji: '🌉', rarity: 'rare' },
  { id: 'city-barranquilla', setId: 'colombia-cities', name: 'Barranquilla', emoji: '🏖️', rarity: 'rare' },
  { id: 'city-bucaramanga', setId: 'colombia-cities', name: 'Bucaramanga', emoji: '⛰️', rarity: 'epic' },

  // ── Power-ups Épicos ──
  { id: 'powerup-nitro', setId: 'epic-powerups', name: 'Nitro Boost', emoji: '🚀', rarity: 'common' },
  { id: 'powerup-convoy', setId: 'epic-powerups', name: 'Convoy Completo', emoji: '🚛', rarity: 'rare' },
  { id: 'powerup-goldrain', setId: 'epic-powerups', name: 'Lluvia de Oro', emoji: '🌧️', rarity: 'epic' },
  { id: 'powerup-timewarp', setId: 'epic-powerups', name: 'Salto Temporal', emoji: '⏰', rarity: 'legendary' },

  // ── Eventos Especiales ──
  { id: 'event-caravana', setId: 'special-events', name: 'Gran Caravana', emoji: '🎉', rarity: 'rare' },
  { id: 'event-carrera', setId: 'special-events', name: 'Carrera Nocturna', emoji: '🏁', rarity: 'rare' },
  { id: 'event-volcan', setId: 'special-events', name: 'Ruta del Volcán', emoji: '🌋', rarity: 'epic' },
  { id: 'event-corona', setId: 'special-events', name: 'Corona del Asfalto', emoji: '👑', rarity: 'legendary' },
];

export function getCollectible(id: string): CollectibleDef | undefined {
  return COLLECTIBLES.find((c) => c.id === id);
}

export function getSet(setId: string): CollectibleSet | undefined {
  return COLLECTIBLE_SETS.find((s) => s.id === setId);
}

export function collectiblesOfSet(setId: string): CollectibleDef[] {
  return COLLECTIBLES.filter((c) => c.setId === setId);
}

export function isSetComplete(setId: string, owned: string[]): boolean {
  return collectiblesOfSet(setId).every((c) => owned.includes(c.id));
}

/** Bonus multiplicador total de los sets completados (1 + Σ bonusPct/100). */
export function computeAlbumBonus(owned: string[]): number {
  let bonus = 0;
  for (const set of COLLECTIBLE_SETS) {
    if (isSetComplete(set.id, owned)) bonus += set.bonusPct;
  }
  return 1 + bonus / 100;
}

/** Peso de cada rareza para los drops aleatorios. */
const RARITY_WEIGHTS: Record<CollectibleRarity, number> = {
  common: 60,
  rare: 26,
  epic: 11,
  legendary: 3,
};

/** Coleccionable aleatorio ponderado por rareza. */
export function rollRandomCollectible(): CollectibleDef {
  const total = COLLECTIBLES.reduce((acc, c) => acc + RARITY_WEIGHTS[c.rarity], 0);
  let roll = Math.random() * total;
  for (const c of COLLECTIBLES) {
    roll -= RARITY_WEIGHTS[c.rarity];
    if (roll <= 0) return c;
  }
  return COLLECTIBLES[0];
}

export const RARITY_LABELS: Record<CollectibleRarity, string> = {
  common: 'Común',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Legendario',
};

export const RARITY_COLORS: Record<CollectibleRarity, string> = {
  common: '#94A3B8',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
};
