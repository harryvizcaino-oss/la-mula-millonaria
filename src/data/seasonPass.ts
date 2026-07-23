// ─────────────────────────────────────────────────────────────────────────────
// PASE DE TEMPORADA (F6) — "Ruta Nacional"
// 30 niveles, 100 XP por nivel. Recompensas gratis y premium por nivel.
// Las recompensas se pagan en CPS (addEarnings) y Golden Tickets.
// ─────────────────────────────────────────────────────────────────────────────

export const SEASON_XP_PER_LEVEL = 100;
export const SEASON_MAX_LEVEL = 30;
/** Costo del pase premium en Golden Tickets. */
export const SEASON_PREMIUM_COST_TICKETS = 250;

export interface SeasonReward {
  type: 'cps' | 'tickets';
  amount: number;
}

export interface SeasonLevel {
  level: number; // 1..30
  free: SeasonReward;
  premium: SeasonReward;
}

export interface SeasonDef {
  id: string;
  name: string;
  startAt: number; // ms epoch
  endAt: number; // ms epoch
}

/** Track de 30 niveles: CPS creciente + tickets cada 5 (gratis) / cada 3 (premium). */
export const SEASON_TRACK: SeasonLevel[] = Array.from({ length: SEASON_MAX_LEVEL }, (_, i) => {
  const level = i + 1;
  const free: SeasonReward =
    level % 5 === 0
      ? { type: 'tickets', amount: Math.max(2, Math.floor(level / 5) * 2) }
      : { type: 'cps', amount: level * 2500 };
  const premium: SeasonReward =
    level % 3 === 0
      ? { type: 'tickets', amount: Math.max(3, Math.floor(level / 3) * 3) }
      : { type: 'cps', amount: level * 10000 };
  return { level, free, premium };
});

export function getSeasonLevel(level: number): SeasonLevel | undefined {
  return SEASON_TRACK.find((l) => l.level === level);
}

/** Nivel alcanzado con una XP acumulada (0..30). */
export function levelForXp(xp: number): number {
  return Math.min(SEASON_MAX_LEVEL, Math.floor(Math.max(0, xp) / SEASON_XP_PER_LEVEL));
}

/** Temporada actual: trimestre calendario (id `YYYY-Qn`). */
export function getCurrentSeason(now: Date = new Date()): SeasonDef {
  const year = now.getFullYear();
  const quarter = Math.floor(now.getMonth() / 3); // 0..3
  const start = new Date(year, quarter * 3, 1);
  const end = new Date(year, quarter * 3 + 3, 1);
  return {
    id: `${year}-Q${quarter + 1}`,
    name: 'Ruta Nacional',
    startAt: start.getTime(),
    endAt: end.getTime(),
  };
}
