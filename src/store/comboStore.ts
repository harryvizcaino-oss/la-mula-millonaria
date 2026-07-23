import { create } from 'zustand';

export const COMBO_WINDOW_MS = 2000;

export interface ComboTierDef {
  min: number;
  mult: number;
  tier: number;
}

// x1 (1-5), x2 (6-15), x3 (16-30), x5 (31-50), x10 (51+)
const COMBO_TIERS: ComboTierDef[] = [
  { min: 51, mult: 10, tier: 4 },
  { min: 31, mult: 5, tier: 3 },
  { min: 16, mult: 3, tier: 2 },
  { min: 6, mult: 2, tier: 1 },
  { min: 1, mult: 1, tier: 0 },
];

export function comboTierFor(count: number): ComboTierDef {
  for (const t of COMBO_TIERS) {
    if (count >= t.min) return t;
  }
  return COMBO_TIERS[COMBO_TIERS.length - 1];
}

export interface ComboState {
  comboCount: number;
  comboMultiplier: number;
  comboTier: number;
  lastClickAt: number;
  comboActive: boolean;

  incrementCombo: () => void;
  breakCombo: () => void;
  resetCombo: () => void;
  /** Restaura un combo roto (p. ej. tras ver un anuncio de "Revivir combo"). */
  restoreCombo: (count: number) => void;
}

export const useComboStore = create<ComboState>()((set, get) => ({
  comboCount: 0,
  comboMultiplier: 1,
  comboTier: 0,
  lastClickAt: 0,
  comboActive: false,

  incrementCombo: () => {
    const now = Date.now();
    const state = get();
    const withinWindow = state.comboActive && now - state.lastClickAt <= COMBO_WINDOW_MS;
    const comboCount = withinWindow ? state.comboCount + 1 : 1;
    const tierDef = comboTierFor(comboCount);
    set({
      comboCount,
      comboMultiplier: tierDef.mult,
      comboTier: tierDef.tier,
      lastClickAt: now,
      comboActive: true,
    });
  },

  breakCombo: () => {
    set({ comboCount: 0, comboMultiplier: 1, comboTier: 0, comboActive: false });
  },

  resetCombo: () => {
    set({ comboCount: 0, comboMultiplier: 1, comboTier: 0, lastClickAt: 0, comboActive: false });
  },

  restoreCombo: (count: number) => {
    if (count <= 0) return;
    const tierDef = comboTierFor(count);
    set({
      comboCount: count,
      comboMultiplier: tierDef.mult,
      comboTier: tierDef.tier,
      lastClickAt: Date.now(),
      comboActive: true,
    });
  },
}));
