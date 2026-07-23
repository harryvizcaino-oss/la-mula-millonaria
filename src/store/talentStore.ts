import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useClickerStore } from '@/store/clickerStore';

const TALENT_STORAGE_KEY = 'truckSurfers_talents_v1';

export type TalentBranch = 'power' | 'combo' | 'crit' | 'tickets';

export interface TalentDef {
  id: string;
  branch: TalentBranch;
  level: number; // 1..3 dentro de la rama
  name: string;
  description: string;
  cost: number; // estrellas de prestigio ⭐
  emoji: string;
}

export const TALENT_BRANCHES: { id: TalentBranch; name: string; emoji: string; color: string }[] = [
  { id: 'power', name: 'Poder', emoji: '💪', color: '#F59E0B' },
  { id: 'combo', name: 'Combo', emoji: '🔥', color: '#EF4444' },
  { id: 'crit', name: 'Crítico', emoji: '🎯', color: '#A855F7' },
  { id: 'tickets', name: 'Tickets', emoji: '🎟️', color: '#22C55E' },
];

// 12 talentos: 4 ramas × 3 niveles. Cada nivel requiere el anterior de su rama.
export const TALENTS: TalentDef[] = [
  // Poder: +5% CPS por click por nivel
  { id: 'power-1', branch: 'power', level: 1, name: 'Puntería I', description: '+5% CPS por click', cost: 1, emoji: '💪' },
  { id: 'power-2', branch: 'power', level: 2, name: 'Puntería II', description: '+5% CPS por click', cost: 2, emoji: '💪' },
  { id: 'power-3', branch: 'power', level: 3, name: 'Puntería III', description: '+5% CPS por click', cost: 3, emoji: '💪' },
  // Combo: +0.5s de ventana de combo por nivel
  { id: 'combo-1', branch: 'combo', level: 1, name: 'Reflejos I', description: '+0.5s de ventana de combo', cost: 1, emoji: '🔥' },
  { id: 'combo-2', branch: 'combo', level: 2, name: 'Reflejos II', description: '+0.5s de ventana de combo', cost: 2, emoji: '🔥' },
  { id: 'combo-3', branch: 'combo', level: 3, name: 'Reflejos III', description: '+0.5s de ventana de combo', cost: 3, emoji: '🔥' },
  // Crítico: +2% de probabilidad por nivel
  { id: 'crit-1', branch: 'crit', level: 1, name: 'Ojo de Águila I', description: '+2% chance de crítico', cost: 1, emoji: '🎯' },
  { id: 'crit-2', branch: 'crit', level: 2, name: 'Ojo de Águila II', description: '+2% chance de crítico', cost: 2, emoji: '🎯' },
  { id: 'crit-3', branch: 'crit', level: 3, name: 'Ojo de Águila III', description: '+2% chance de crítico', cost: 3, emoji: '🎯' },
  // Tickets: +10% de spawn chance por nivel
  { id: 'tickets-1', branch: 'tickets', level: 1, name: 'Suerte I', description: '+10% spawn de tickets', cost: 1, emoji: '🎟️' },
  { id: 'tickets-2', branch: 'tickets', level: 2, name: 'Suerte II', description: '+10% spawn de tickets', cost: 2, emoji: '🎟️' },
  { id: 'tickets-3', branch: 'tickets', level: 3, name: 'Suerte III', description: '+10% spawn de tickets', cost: 3, emoji: '🎟️' },
];

export function getTalent(id: string): TalentDef | undefined {
  return TALENTS.find((t) => t.id === id);
}

/** Nivel alcanzado en una rama (0-3): el mayor nodo comprado. */
function branchLevel(levels: Record<string, number>, branch: TalentBranch): number {
  let max = 0;
  for (const t of TALENTS) {
    if (t.branch === branch && (levels[t.id] ?? 0) > 0) max = Math.max(max, t.level);
  }
  return max;
}

/** +5% de CPS por click por nivel de la rama Poder (multiplicador aditivo: 0.05-0.15). */
export function getTalentPowerBonus(): number {
  return branchLevel(useTalentStore.getState().levels, 'power') * 0.05;
}

/** +500ms de ventana de combo por nivel de la rama Combo. */
export function getTalentComboWindowMs(): number {
  return branchLevel(useTalentStore.getState().levels, 'combo') * 500;
}

/** +2% de probabilidad de crítico por nivel de la rama Crítico. */
export function getTalentCritBonus(): number {
  return branchLevel(useTalentStore.getState().levels, 'crit') * 0.02;
}

/** +10% de spawn chance de tickets por nivel de la rama Tickets (multiplicador aditivo: 0.1-0.3). */
export function getTalentTicketBonus(): number {
  return branchLevel(useTalentStore.getState().levels, 'tickets') * 0.1;
}

export interface TalentState {
  levels: Record<string, number>; // talentId -> nivel comprado (0 = no comprado)

  buy: (talentId: string) => { success: boolean; reason?: string };
}

export const useTalentStore = create<TalentState>()(
  persist(
    (set, get) => ({
      levels: {},

      buy: (talentId) => {
        const talent = getTalent(talentId);
        if (!talent) return { success: false, reason: 'Talento no existe' };
        const state = get();
        if ((state.levels[talentId] ?? 0) > 0) return { success: false, reason: 'Ya comprado' };
        // Requiere el nivel anterior de la misma rama
        if (talent.level > 1) {
          const prevId = `${talent.branch}-${talent.level - 1}`;
          if ((state.levels[prevId] ?? 0) <= 0) {
            return { success: false, reason: 'Compra el nivel anterior primero' };
          }
        }
        // Se paga con estrellas de prestigio del clickerStore
        if (!useClickerStore.getState().spendStars(talent.cost)) {
          return { success: false, reason: 'Estrellas insuficientes' };
        }
        set({ levels: { ...state.levels, [talentId]: talent.level } });
        return { success: true };
      },
    }),
    {
      name: TALENT_STORAGE_KEY,
      partialize: (state) => ({ levels: state.levels }),
    }
  )
);
