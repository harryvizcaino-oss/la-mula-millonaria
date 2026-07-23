import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  getCollectible,
  getSet,
  isSetComplete,
  rollRandomCollectible,
  type CollectibleDef,
} from '@/data/collectibles';
import { useCosmeticPassStore } from '@/store/cosmeticPassStore';

const COLLECTIBLES_STORAGE_KEY = 'truckSurfers_collectibles_v1';

export interface CollectibleDrop {
  def: CollectibleDef;
  isNew: boolean;
  /** true si este drop completó el set del coleccionable. */
  setCompleted: boolean;
}

export interface CollectibleState {
  owned: string[]; // ids de coleccionables obtenidos (únicos)
  totalDrops: number; // drops totales (incluye duplicados)

  /**
   * Otorga un coleccionable por id. Si es nuevo y completa su set, suma las
   * +5 estrellas del pase cosmético (F16) automáticamente.
   */
  grant: (id: string) => CollectibleDrop | null;
  /** Otorga un coleccionable aleatorio ponderado por rareza. */
  grantRandom: () => CollectibleDrop;
  /** Tira un drop con probabilidad `chance` (0..1). Null si no cayó nada. */
  rollDrop: (chance: number) => CollectibleDrop | null;
}

export const useCollectibleStore = create<CollectibleState>()(
  persist(
    (set, get) => ({
      owned: [],
      totalDrops: 0,

      grant: (id) => {
        const def = getCollectible(id);
        if (!def) return null;
        const state = get();
        const isNew = !state.owned.includes(id);
        let setCompleted = false;
        if (isNew) {
          const owned = [...state.owned, id];
          // F16: completar un set del álbum da +5 estrellas del pase cosmético
          setCompleted = isSetComplete(def.setId, owned);
          if (setCompleted) useCosmeticPassStore.getState().addStars(5);
          set({ owned, totalDrops: state.totalDrops + 1 });
        } else {
          set({ totalDrops: state.totalDrops + 1 });
        }
        return { def, isNew, setCompleted };
      },

      grantRandom: () => {
        const def = rollRandomCollectible();
        return get().grant(def.id)!;
      },

      rollDrop: (chance) => {
        if (chance <= 0 || Math.random() >= chance) return null;
        return get().grantRandom();
      },
    }),
    {
      name: COLLECTIBLES_STORAGE_KEY,
      partialize: (state) => ({ owned: state.owned, totalDrops: state.totalDrops }),
    }
  )
);

export { getSet };
