// Retos de vía — sesiones cortas (30–60s) ligadas al Mapa Nacional.
// No mueven el CPS del clicker; son sabor + recompensa opcional.

import { ROUTE_CITIES } from '@/data/routes';

export type RoadChallengeKind = 'climb' | 'descent' | 'toll' | 'storm' | 'port';

export interface RoadChallengeDef {
  id: RoadChallengeKind;
  name: string;
  emoji: string;
  blurb: string;
  /** Segundos estimados para UI. */
  durationSec: number;
  cta: string;
}

export const ROAD_CHALLENGES: RoadChallengeDef[] = [
  {
    id: 'climb',
    name: 'Subida a la Cordillera',
    emoji: '⛰️',
    blurb: 'Mantén el ritmo: toca para subir. Si paras, la mula pierde altura.',
    durationSec: 45,
    cta: 'ACELERAR',
  },
  {
    id: 'descent',
    name: 'Bajada controlada',
    emoji: '🛞',
    blurb: 'Frena en la zona verde. Tres intentos en la pendiente.',
    durationSec: 40,
    cta: 'FRENAR',
  },
  {
    id: 'toll',
    name: 'Peaje express',
    emoji: '🎫',
    blurb: 'Toca placa, efectivo y listo en el orden correcto.',
    durationSec: 35,
    cta: 'PASAR',
  },
  {
    id: 'storm',
    name: 'Tormenta en la vía',
    emoji: '🌧️',
    blurb: 'Esquiva los charcos: toca izquierda o derecha a tiempo.',
    durationSec: 40,
    cta: 'ESQUIVAR',
  },
  {
    id: 'port',
    name: 'Llegada al puerto',
    emoji: '⚓',
    blurb: 'Ráfaga de clicks: descarga la mula en 8 segundos.',
    durationSec: 8,
    cta: 'DESCARGAR',
  },
];

export interface RoadSegment {
  id: string;
  fromCityId: string;
  toCityId: string;
  challengeId: RoadChallengeKind;
  /** Nombre de sabor colombiano del tramo. */
  title: string;
}

/** Ciclo de mecánicas sobre los 9 tramos entre 10 ciudades. */
const KIND_CYCLE: RoadChallengeKind[] = [
  'climb',
  'descent',
  'toll',
  'storm',
  'port',
  'climb',
  'descent',
  'toll',
  'storm',
];

const SEGMENT_TITLES = [
  'Alto de Letras',
  'Bajada al Valle',
  'Peaje La Línea',
  'Tormenta Caribe',
  'Puerto de la Arenosa',
  'Cuestas de Manizales',
  'Cañón del Chicamocha',
  'Peaje Frontera',
  'Bahía de Santa Marta',
];

export const ROAD_SEGMENTS: RoadSegment[] = ROUTE_CITIES.slice(0, -1).map((from, i) => {
  const to = ROUTE_CITIES[i + 1];
  return {
    id: `${from.id}-${to.id}`,
    fromCityId: from.id,
    toCityId: to.id,
    challengeId: KIND_CYCLE[i] ?? 'climb',
    title: SEGMENT_TITLES[i] ?? `${from.name} → ${to.name}`,
  };
});

export function getRoadChallenge(id: RoadChallengeKind): RoadChallengeDef | undefined {
  return ROAD_CHALLENGES.find((c) => c.id === id);
}

export function getRoadSegment(id: string): RoadSegment | undefined {
  return ROAD_SEGMENTS.find((s) => s.id === id);
}

/** Tramo activo: de la ciudad actual a la siguiente en la ruta. */
export function getActiveSegment(currentCityId: string): RoadSegment | undefined {
  const idx = ROUTE_CITIES.findIndex((c) => c.id === currentCityId);
  if (idx < 0 || idx >= ROUTE_CITIES.length - 1) {
    // En la última ciudad: último tramo (replay sabor)
    return ROAD_SEGMENTS[ROAD_SEGMENTS.length - 1];
  }
  return ROAD_SEGMENTS[idx];
}

export const FREE_ROAD_CHALLENGES_PER_DAY = 3;
export const ROAD_BUFF_DURATION_MS = 10 * 60 * 1000; // +1% click 10 min
export const ROAD_BUFF_BONUS = 0.01;
export const ROAD_TICKET_COST = 1;
