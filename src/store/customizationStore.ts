import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_EQUIPPED,
  getTruckPart,
  type EquippedParts,
} from '@/data/truckSkins';

const CUSTOMIZATION_STORAGE_KEY = 'truckSurfers_customization_v1';

export interface CustomizationState {
  owned: string[]; // piezas compradas
  equipped: EquippedParts; // pieza equipada por categoría

  /**
   * Marca una pieza como comprada. El cobro (millas/tickets/CPS) lo hace la
   * UI antes de llamar a buy(), porque cada moneda vive en un store distinto.
   */
  buy: (partId: string) => boolean;
  /** Equipa una pieza comprada (reemplaza la de su categoría). */
  equip: (partId: string) => boolean;
}

export const useCustomizationStore = create<CustomizationState>()(
  persist(
    (set, get) => ({
      owned: [],
      equipped: { ...DEFAULT_EQUIPPED },

      buy: (partId: string) => {
        const state = get();
        const part = getTruckPart(partId);
        if (!part || state.owned.includes(partId)) return false;
        set({ owned: [...state.owned, partId] });
        return true;
      },

      equip: (partId: string) => {
        const state = get();
        const part = getTruckPart(partId);
        if (!part || !state.owned.includes(partId)) return false;
        set({ equipped: { ...state.equipped, [part.category]: partId } });
        return true;
      },
    }),
    {
      name: CUSTOMIZATION_STORAGE_KEY,
      partialize: (state) => ({
        owned: state.owned,
        equipped: state.equipped,
      }),
    }
  )
);
