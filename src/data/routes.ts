// ─────────────────────────────────────────────────────────────────────────────
// MAPA DE RUTAS (F7) — 10 ciudades colombianas.
// Cada ciudad se desbloquea al alcanzar un CPS TOTAL histórico y otorga un
// bonus permanente al CPS por click (pequeño, +2-5% por ciudad, acumulativo).
// ─────────────────────────────────────────────────────────────────────────────

export interface RouteCity {
  id: string;
  name: string;
  /** CPS total histórico requerido para desbloquear. */
  requiredCpsTotal: number;
  /** Bonus permanente al click power (porcentaje). */
  bonusPct: number;
  emoji: string;
  description: string;
}

export const ROUTE_CITIES: RouteCity[] = [
  {
    id: 'bogota',
    name: 'Bogotá',
    requiredCpsTotal: 0,
    bonusPct: 2,
    emoji: '🏙️',
    description: 'El punto de partida de toda mula: la capital te da la bienvenida.',
  },
  {
    id: 'medellin',
    name: 'Medellín',
    requiredCpsTotal: 100_000,
    bonusPct: 2,
    emoji: '⛰️',
    description: 'La ciudad de la eterna primavera, entre montañas y túneles.',
  },
  {
    id: 'cali',
    name: 'Cali',
    requiredCpsTotal: 1_000_000,
    bonusPct: 2,
    emoji: '💃',
    description: 'Salsa, caña de azúcar y la recta del Valle del Cauca.',
  },
  {
    id: 'barranquilla',
    name: 'Barranquilla',
    requiredCpsTotal: 10_000_000,
    bonusPct: 3,
    emoji: '🎭',
    description: 'La Arenosa: puerto, carnaval y calor de la Costa Caribe.',
  },
  {
    id: 'cartagena',
    name: 'Cartagena',
    requiredCpsTotal: 100_000_000,
    bonusPct: 3,
    emoji: '🏰',
    description: 'La heroica amurallada, joya del Caribe colombiano.',
  },
  {
    id: 'bucaramanga',
    name: 'Bucaramanga',
    requiredCpsTotal: 1_000_000_000,
    bonusPct: 3,
    emoji: '🌄',
    description: 'La ciudad bonita y el imponente Cañón del Chicamocha.',
  },
  {
    id: 'pereira',
    name: 'Pereira',
    requiredCpsTotal: 10_000_000_000,
    bonusPct: 4,
    emoji: '☕',
    description: 'Corazón del eje cafetero: montañas verdes y café premium.',
  },
  {
    id: 'manizales',
    name: 'Manizales',
    requiredCpsTotal: 100_000_000_000,
    bonusPct: 4,
    emoji: '🌋',
    description: 'Ciudad de las cuestas empinadas, bajo el Nevado del Ruiz.',
  },
  {
    id: 'cucuta',
    name: 'Cúcuta',
    requiredCpsTotal: 1_000_000_000_000,
    bonusPct: 5,
    emoji: '🌉',
    description: 'La ciudad fronteriza: puerta comercial con Venezuela.',
  },
  {
    id: 'santamarta',
    name: 'Santa Marta',
    requiredCpsTotal: 10_000_000_000_000,
    bonusPct: 5,
    emoji: '🏖️',
    description: 'La bahía más linda de América: el final de la Ruta Nacional.',
  },
];

export const DEFAULT_CITY_ID = ROUTE_CITIES[0].id;

export function getRouteCity(id: string): RouteCity | undefined {
  return ROUTE_CITIES.find((c) => c.id === id);
}

/** Ciudades desbloqueadas con un CPS total dado (en orden de la ruta). */
export function unlockedCitiesFor(cpsTotal: number): RouteCity[] {
  return ROUTE_CITIES.filter((c) => cpsTotal >= c.requiredCpsTotal);
}

/**
 * Multiplicador total del bonus de rutas: 1 + Σ bonusPct de las ciudades
 * desbloqueadas / 100. Acumulativo y permanente.
 */
export function computeRouteBonus(unlockedCityIds: string[]): number {
  let bonus = 0;
  for (const id of unlockedCityIds) {
    const city = getRouteCity(id);
    if (city) bonus += city.bonusPct;
  }
  return 1 + bonus / 100;
}
