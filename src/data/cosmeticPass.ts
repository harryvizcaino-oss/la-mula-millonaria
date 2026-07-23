// ─────────────────────────────────────────────────────────────────────────────
// PASE COSMÉTICO (F16) — "Mula Glamour"
// 20 niveles, se sube con estrellas de pase (1 por minuto de sesión activa,
// +10 por ascensión, +5 por set de álbum completado). Track gratis con
// recompensas pequeñas; track premium (500 🎟️) SOLO con cosméticos (sin bonus
// de CPS). Temporadas de 30 días.
// Las recompensas se aplican en la capa UI (la página del pase).
// ─────────────────────────────────────────────────────────────────────────────

export const COSMETIC_PASS_STARS_PER_LEVEL = 25;
export const COSMETIC_PASS_MAX_LEVEL = 20;
/** Costo del premium en Golden Tickets (una sola vez por temporada). */
export const COSMETIC_PASS_PREMIUM_COST_TICKETS = 500;
/** Duración de la temporada del pase cosmético: 30 días. */
export const COSMETIC_PASS_SEASON_MS = 30 * 24 * 60 * 60 * 1000;

export type CosmeticReward =
  | { kind: 'millas'; amount: number }
  | { kind: 'cps'; amount: number }
  | { kind: 'tickets'; amount: number }
  /** Un coleccionable aleatorio del álbum (F14). */
  | { kind: 'collectible' }
  /** Pieza cosmética exclusiva (id de src/data/truckSkins.ts). */
  | { kind: 'cosmetic'; partId: string };

export interface CosmeticPassLevel {
  level: number; // 1..20
  free: CosmeticReward;
  premium: CosmeticReward;
}

export interface CosmeticPassSeason {
  id: string;
  name: string;
  startAt: number; // ms epoch
  endAt: number; // ms epoch
}

/** Cosméticos premium por nivel (los demás niveles premium dan tickets/coleccionables). */
const PREMIUM_COSMETICS: Record<number, string> = {
  2: 'sticker-rayo',
  3: 'frame-gold',
  5: 'trail-gold',
  8: 'lights-galactic',
  10: 'trail-fire',
  11: 'horn-sinfonica',
  14: 'trail-neon',
  15: 'trailer-luxury',
  17: 'skin-camaleon',
  20: 'frame-diamond',
};

function premiumReward(level: number): CosmeticReward {
  const partId = PREMIUM_COSMETICS[level];
  if (partId) return { kind: 'cosmetic', partId };
  if (level % 4 === 0) return { kind: 'collectible' };
  return { kind: 'tickets', amount: 10 + level * 2 };
}

function freeReward(level: number): CosmeticReward {
  if (level % 5 === 0) return { kind: 'collectible' };
  if (level % 2 === 0) return { kind: 'tickets', amount: Math.max(2, Math.floor(level / 2)) };
  return { kind: 'millas', amount: level * 2_000 };
}

export const COSMETIC_PASS_TRACK: CosmeticPassLevel[] = Array.from(
  { length: COSMETIC_PASS_MAX_LEVEL },
  (_, i) => {
    const level = i + 1;
    return { level, free: freeReward(level), premium: premiumReward(level) };
  }
);

export function getCosmeticPassLevel(level: number): CosmeticPassLevel | undefined {
  return COSMETIC_PASS_TRACK.find((l) => l.level === level);
}

/** Nivel alcanzado con estrellas acumuladas (0..20). */
export function levelForStars(stars: number): number {
  return Math.min(
    COSMETIC_PASS_MAX_LEVEL,
    Math.floor(Math.max(0, stars) / COSMETIC_PASS_STARS_PER_LEVEL)
  );
}

/** Temporada actual: ventanas de 30 días desde el epoch (id `CP-n`). */
export function getCurrentCosmeticSeason(now: number = Date.now()): CosmeticPassSeason {
  const index = Math.floor(now / COSMETIC_PASS_SEASON_MS);
  return {
    id: `CP-${index}`,
    name: 'Mula Glamour',
    startAt: index * COSMETIC_PASS_SEASON_MS,
    endAt: (index + 1) * COSMETIC_PASS_SEASON_MS,
  };
}
