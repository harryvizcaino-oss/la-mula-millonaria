import { create } from 'zustand';

export interface GlobalEventDef {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  durationSec: number;
  goal: number;
  rewardMillas: number;
  rewardTickets: number;
}

// Duraciones acortadas (5 min) respecto al diseño de 1h para que el evento
// sea visible/completable en una sesión; la cadencia 4-8h se mantiene entre eventos.
export const GLOBAL_EVENT_DEFS: GlobalEventDef[] = [
  {
    id: 'caravana',
    name: 'Caravana Nacional',
    description: '¡Todos los clics valen x3 durante el evento!',
    emoji: '🚛',
    color: '#F59E0B',
    durationSec: 300,
    goal: 600,
    rewardMillas: 5000,
    rewardTickets: 3,
  },
  {
    id: 'dia_camionero',
    name: 'Día del Camionero',
    description: 'Recompensas especiales para toda la comunidad.',
    emoji: '🎉',
    color: '#3B82F6',
    durationSec: 300,
    goal: 400,
    rewardMillas: 2500,
    rewardTickets: 5,
  },
  {
    id: 'tormenta',
    name: 'Tormenta en la Carretera',
    description: 'Evento desafío: ¡resiste la tormenta clickeando!',
    emoji: '⛈️',
    color: '#A855F7',
    durationSec: 300,
    goal: 900,
    rewardMillas: 10000,
    rewardTickets: 8,
  },
];

export interface ActiveGlobalEvent extends GlobalEventDef {
  endsAt: number;
  progress: number;
  completed: boolean;
}

export interface EventResult {
  id: number;
  name: string;
  success: boolean;
  rewardMillas: number;
  rewardTickets: number;
}

const FIRST_EVENT_DELAY_MS = 90_000; // primer evento ~90s tras abrir el juego
const MIN_EVENT_GAP_MS = 4 * 60 * 60 * 1000; // 4h
const MAX_EVENT_GAP_MS = 8 * 60 * 60 * 1000; // 8h

function randomGap(): number {
  return MIN_EVENT_GAP_MS + Math.random() * (MAX_EVENT_GAP_MS - MIN_EVENT_GAP_MS);
}

export interface EventState {
  activeEvent: ActiveGlobalEvent | null;
  nextEventAt: number;
  lastResult: EventResult | null;

  startEvent: () => void;
  endEvent: () => void;
  updateProgress: (amount: number) => void;
  clearResult: () => void;
}

let resultId = 0;

export const useEventStore = create<EventState>()((set, get) => ({
  activeEvent: null,
  nextEventAt: Date.now() + FIRST_EVENT_DELAY_MS,
  lastResult: null,

  startEvent: () => {
    if (get().activeEvent) return;
    const def = GLOBAL_EVENT_DEFS[Math.floor(Math.random() * GLOBAL_EVENT_DEFS.length)];
    set({
      activeEvent: {
        ...def,
        endsAt: Date.now() + def.durationSec * 1000,
        progress: Math.floor(def.goal * 0.08), // la comunidad ya arrancó
        completed: false,
      },
    });
  },

  endEvent: () => {
    const state = get();
    const ev = state.activeEvent;
    if (!ev) return;
    const success = ev.completed || ev.progress >= ev.goal;
    resultId += 1;
    set({
      activeEvent: null,
      nextEventAt: Date.now() + randomGap(),
      lastResult: {
        id: resultId,
        name: ev.name,
        success,
        // participación: 10% de la recompensa si falla
        rewardMillas: success ? ev.rewardMillas : Math.floor(ev.rewardMillas * 0.1),
        rewardTickets: success ? ev.rewardTickets : 0,
      },
    });
  },

  updateProgress: (amount) => {
    const state = get();
    const ev = state.activeEvent;
    if (!ev || ev.completed) return;
    const progress = Math.min(ev.goal, ev.progress + amount);
    set({ activeEvent: { ...ev, progress, completed: progress >= ev.goal } });
  },

  clearResult: () => set({ lastResult: null }),
}));
