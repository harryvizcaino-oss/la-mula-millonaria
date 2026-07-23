import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Wave 3 (F10) — Amigos y caravanas (modelo local, funciona offline).
 *
 * Los amigos se agregan con un código libre (ej. `MULA-XXXX` o `friend_nombre`).
 * Un amigo está "activo" si su `lastActive` cae dentro de ACTIVE_WINDOW_MS;
 * como no hay backend de presencia, `refreshActivity()` simula actividad de
 * los amigos (la UI la invoca periódicamente). Cada amigo activo da +1% al
 * CPS por click (tope +5%), aplicado en `calculateClickPower`.
 */

const FRIENDS_STORAGE_KEY = 'truckSurfers_friends_v1';
const ACTIVE_WINDOW_MS = 30 * 60 * 1000; // 30 min
const MAX_CARAVAN_BONUS = 0.05; // tope +5%

export interface LocalFriend {
  id: string;
  code: string;
  name: string;
  avatar: string;
  cpsTotal: number; // snapshot simulado
  lastActive: number; // timestamp de última actividad (presencia simulada)
  addedAt: number;
  lastConviteAt: number; // último convite de caravana enviado
}

export interface IncomingConvite {
  id: number;
  friendId: string;
  friendName: string;
}

export type AddFriendResult =
  | { success: true; friend: LocalFriend }
  | { success: false; reason: 'empty' | 'self' | 'duplicate' };

function hashCode(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `friend_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

function generateMyCode(): string {
  const bytes = new Uint8Array(2);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return `MULA-${hex}`;
}

/** Nombre legible a partir del código (`friend_pedro` → `Pedro`). */
function nameFromCode(code: string): string {
  const cleaned = code.replace(/^friend[_-]/i, '').replace(/^MULA-/i, 'Camionero ');
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export interface FriendsState {
  myCode: string;
  friends: LocalFriend[];
  incomingConvite: IncomingConvite | null; // convite recibido (simulado), para toast

  addFriend: (code: string) => AddFriendResult;
  removeFriend: (id: string) => void;
  sendConvite: (id: string) => boolean;
  refreshActivity: () => void;
  clearIncomingConvite: () => void;
  getActiveFriends: () => LocalFriend[];
  getCaravanBonus: () => number; // multiplicador aditivo: 0..0.05
}

export const useFriendsStore = create<FriendsState>()(
  persist(
    (set, get) => ({
      myCode: generateMyCode(),
      friends: [],
      incomingConvite: null,

      addFriend: (code) => {
        const normalized = code.trim();
        if (!normalized) return { success: false, reason: 'empty' };
        const state = get();
        if (normalized.toUpperCase() === state.myCode.toUpperCase()) {
          return { success: false, reason: 'self' };
        }
        if (state.friends.some((f) => f.code.toLowerCase() === normalized.toLowerCase())) {
          return { success: false, reason: 'duplicate' };
        }
        const h = hashCode(normalized);
        const friend: LocalFriend = {
          id: generateId(),
          code: normalized,
          name: nameFromCode(normalized),
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(normalized)}`,
          cpsTotal: 10_000 + (h % 5_000_000), // snapshot simulado
          lastActive: Date.now(), // recién agregado: arranca activo (en caravana)
          addedAt: Date.now(),
          lastConviteAt: 0,
        };
        set({ friends: [...state.friends, friend] });
        return { success: true, friend };
      },

      removeFriend: (id) => {
        set((state) => ({ friends: state.friends.filter((f) => f.id !== id) }));
      },

      // Convite de caravana: el amigo "responde" y queda activo.
      sendConvite: (id) => {
        const state = get();
        const friend = state.friends.find((f) => f.id === id);
        if (!friend) return false;
        const now = Date.now();
        set({
          friends: state.friends.map((f) =>
            f.id === id ? { ...f, lastConviteAt: now, lastActive: now } : f
          ),
        });
        return true;
      },

      // Simulación de presencia/progreso de amigos + convite entrante ocasional.
      refreshActivity: () => {
        const state = get();
        if (state.friends.length === 0) return;
        const now = Date.now();
        const friends = state.friends.map((f) => {
          let next = f;
          // 25% de chance de que el amigo esté jugando ahora
          if (Math.random() < 0.25) next = { ...next, lastActive: now };
          // Su CPS crece de a poco (snapshot vivo)
          next = { ...next, cpsTotal: next.cpsTotal + Math.floor(Math.random() * 5000) };
          return next;
        });
        let incomingConvite = state.incomingConvite;
        if (!incomingConvite && Math.random() < 0.15) {
          const active = friends.filter((f) => now - f.lastActive < ACTIVE_WINDOW_MS);
          const pool = active.length > 0 ? active : friends;
          const f = pool[Math.floor(Math.random() * pool.length)];
          incomingConvite = { id: now, friendId: f.id, friendName: f.name };
        }
        set({ friends, incomingConvite });
      },

      clearIncomingConvite: () => set({ incomingConvite: null }),

      getActiveFriends: () => {
        const now = Date.now();
        return get().friends.filter((f) => now - f.lastActive < ACTIVE_WINDOW_MS);
      },

      // +1% por amigo activo en caravana, tope +5%.
      getCaravanBonus: () => {
        const bonus = get().getActiveFriends().length * 0.01;
        return Math.min(MAX_CARAVAN_BONUS, bonus);
      },
    }),
    {
      name: FRIENDS_STORAGE_KEY,
      partialize: (state) => ({ myCode: state.myCode, friends: state.friends }),
    }
  )
);
