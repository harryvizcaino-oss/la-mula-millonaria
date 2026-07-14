import { create } from 'zustand';

interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
  showTutorial: boolean;
}

interface GameState {
  settings: GameSettings;
  setSoundEnabled: (enabled: boolean) => void;
  setMusicEnabled: (enabled: boolean) => void;
  setDifficulty: (difficulty: 'easy' | 'normal' | 'hard') => void;
  setShowTutorial: (show: boolean) => void;
}

const defaultSettings: GameSettings = {
  soundEnabled: true,
  musicEnabled: true,
  difficulty: 'normal',
  showTutorial: true,
};

export const useGameStore = create<GameState>((set) => ({
  settings: defaultSettings,
  setSoundEnabled: (enabled) =>
    set((state) => ({ settings: { ...state.settings, soundEnabled: enabled } })),
  setMusicEnabled: (enabled) =>
    set((state) => ({ settings: { ...state.settings, musicEnabled: enabled } })),
  setDifficulty: (difficulty) =>
    set((state) => ({ settings: { ...state.settings, difficulty } })),
  setShowTutorial: (show) =>
    set((state) => ({ settings: { ...state.settings, showTutorial: show } })),
}));
