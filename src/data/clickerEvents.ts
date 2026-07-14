export type ClickerEventType = 'clickBoost' | 'productionBoost' | 'instantProduction' | 'discount';

export interface ClickerGameEvent {
  id: string;
  name: string;
  emoji: string;
  type: ClickerEventType;
  duration: number; // seconds
  multiplier: number;
  description: string;
  color: string;
}

export const CLICKER_EVENTS: ClickerGameEvent[] = [
  {
    id: 'via-libre',
    name: 'Vía Libre',
    emoji: '🚦',
    type: 'clickBoost',
    duration: 13,
    multiplier: 7,
    description: '¡Semáforo en verde! x7 de poder de clic.',
    color: '#22C55E',
  },
  {
    id: 'caravana',
    name: 'Caravana Express',
    emoji: '🚛',
    type: 'productionBoost',
    duration: 10,
    multiplier: 777,
    description: 'Una caravana cruza la pantalla. x777 de producción.',
    color: '#F59E0B',
  },
  {
    id: 'descanso',
    name: 'Puesto de Descanso',
    emoji: '🍽️',
    type: 'instantProduction',
    duration: 0,
    multiplier: 1,
    description: 'Ganas 15 minutos de producción al instante.',
    color: '#3B82F6',
  },
  {
    id: 'sin-pico-placa',
    name: 'Día sin Pico y Placa',
    emoji: '📅',
    type: 'discount',
    duration: 30,
    multiplier: 0.5,
    description: 'Todos los edificios cuestan la mitad.',
    color: '#EC4899',
  },
  {
    id: 'lluvia-pesos',
    name: 'Lluvia de Pesos',
    emoji: '💸',
    type: 'instantProduction',
    duration: 0,
    multiplier: 1,
    description: '¡Toca las monedas que caen!',
    color: '#FACC15',
  },
];

export function pickRandomEvent(): ClickerGameEvent {
  const weights = [0.35, 0.2, 0.2, 0.15, 0.1];
  const rand = Math.random();
  let cumulative = 0;
  for (let i = 0; i < CLICKER_EVENTS.length; i++) {
    cumulative += weights[i];
    if (rand < cumulative) return CLICKER_EVENTS[i];
  }
  return CLICKER_EVENTS[0];
}
