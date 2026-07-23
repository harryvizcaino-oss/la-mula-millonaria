/**
 * Wave 3 (F9) — Ligas semanales.
 *
 * Escalera lineal de 30 divisiones: 6 ligas × 5 rangos.
 * División 0 = Bronce I (más baja), 29 = Leyenda V (más alta).
 * El puntaje semanal es el CPS ganado entre lunes 00:00 y el siguiente lunes
 * 00:00 (hora local). Al cerrar la semana se compara contra el umbral de la
 * división actual: >= umbral → asciende; < 15% del umbral → desciende.
 */

export interface LeagueDef {
  id: string;
  name: string;
  emoji: string;
  color: string; // color principal del badge
}

export const LEAGUES: LeagueDef[] = [
  { id: 'bronce', name: 'Bronce', emoji: '🥉', color: '#CD7F32' },
  { id: 'plata', name: 'Plata', emoji: '🥈', color: '#C0C0C0' },
  { id: 'oro', name: 'Oro', emoji: '🥇', color: '#FFD700' },
  { id: 'platino', name: 'Platino', emoji: '💠', color: '#7DD3FC' },
  { id: 'diamante', name: 'Diamante', emoji: '💎', color: '#38BDF8' },
  { id: 'leyenda', name: 'Leyenda', emoji: '👑', color: '#A855F7' },
];

export const TIERS_PER_LEAGUE = 5;
export const TIER_NAMES = ['I', 'II', 'III', 'IV', 'V'] as const;
export const DIVISION_COUNT = LEAGUES.length * TIERS_PER_LEAGUE; // 30

export function leagueOfDivision(division: number): LeagueDef {
  const idx = Math.min(LEAGUES.length - 1, Math.floor(division / TIERS_PER_LEAGUE));
  return LEAGUES[Math.max(0, idx)];
}

export function tierOfDivision(division: number): string {
  return TIER_NAMES[Math.max(0, Math.min(TIERS_PER_LEAGUE - 1, division % TIERS_PER_LEAGUE))];
}

/** CPS semanal necesario para ascender desde esta división. */
export function promotionThreshold(division: number): number {
  return Math.floor(20_000 * Math.pow(3.2, division));
}

/** Por debajo de este CPS semanal se desciende de división. */
export function demotionThreshold(division: number): number {
  return Math.floor(promotionThreshold(division) * 0.15);
}

export interface DivisionRewards {
  millas: number;
  tickets: number;
  cps: number;
}

/** Recompensa de fin de semana según la división alcanzada. */
export function divisionRewards(division: number): DivisionRewards {
  const d = Math.max(0, division);
  return {
    millas: 500 * (d + 1),
    tickets: 1 + Math.floor(d / 3),
    cps: 1_000 * (d + 1),
  };
}

/** Lunes 00:00 local de la semana de `d` (inicio de la semana de liga). */
export function getWeekStart(d: Date = new Date()): Date {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  // getDay(): 0=domingo … 6=sábado → lunes es 1
  const offset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - offset);
  return start;
}

/** Clave de semana: fecha ISO local del lunes ('YYYY-MM-DD'). */
export function getWeekKey(d: Date = new Date()): string {
  const start = getWeekStart(d);
  const mm = String(start.getMonth() + 1).padStart(2, '0');
  const dd = String(start.getDate()).padStart(2, '0');
  return `${start.getFullYear()}-${mm}-${dd}`;
}

/** Próximo lunes 00:00 local (cierre de la semana actual). */
export function getNextWeekStart(d: Date = new Date()): Date {
  const start = getWeekStart(d);
  start.setDate(start.getDate() + 7);
  return start;
}
