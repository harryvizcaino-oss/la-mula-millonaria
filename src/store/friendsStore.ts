import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * Wave 3 (F10) — Amigos y caravanas (modelo local + presencia best-effort).
 *
 * Códigos aceptados (anti-farm): `MULA-XXXX` (4 hex), invite_code de 8 hex
 * (`profiles.invite_code`, migración 002) o un UUID de usuario. Tope
 * `MAX_FRIENDS` (alineado con el cap de caravana).
 *
 * Presencia (`refreshActivity`):
 * - Amigos con `id` UUID: si hay sesión Supabase, lee
 *   `leaderboard_global.updated_at` + `cps_total` (select público, mig. 001)
 *   y `profiles.updated_at` (select público). `game_state.last_tick_at` NO
 *   es usable para terceros (RLS `game_state_select_own`).
 * - Amigos locales (`local_*`): simulación actual (25% chance activo).
 * Offline / sin sesión: todo el pool usa el fallback simulado.
 *
 * Bonus caravana: +1% por amigo activo, tope +5% (`MAX_CARAVAN_BONUS`).
 */

const FRIENDS_STORAGE_KEY = 'truckSurfers_friends_v1';
const ACTIVE_WINDOW_MS = 30 * 60 * 1000; // 30 min
const MAX_CARAVAN_BONUS = 0.05; // tope +5%
/** Máx. amigos locales — evita farmar el +5% con códigos inventados. */
export const MAX_FRIENDS = 5;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MULA_CODE_RE = /^MULA-[0-9A-F]{4}$/i;
const INVITE_CODE_RE = /^[0-9A-F]{8}$/i;

export function isUuid(id: string): boolean {
  return UUID_RE.test(id);
}

/** Formato estricto: MULA-XXXX | invite_code 8 hex | UUID. */
export function isValidFriendCode(code: string): boolean {
  const c = code.trim();
  return MULA_CODE_RE.test(c) || INVITE_CODE_RE.test(c) || UUID_RE.test(c);
}

export interface LocalFriend {
  id: string;
  code: string;
  name: string;
  avatar: string;
  cpsTotal: number; // snapshot (live o simulado)
  lastActive: number; // timestamp de última actividad
  addedAt: number;
  lastConviteAt: number; // último convite de caravana enviado
  /** true si la última refresh trajo datos de Supabase para este amigo */
  livePresence?: boolean;
}

export interface IncomingConvite {
  id: number;
  friendId: string;
  friendName: string;
}

/** Perfil resuelto vía invite_code / UUID antes de agregar. */
export interface ResolvedFriendProfile {
  id: string;
  name?: string;
  avatar?: string;
  cpsTotal?: number;
}

export type AddFriendResult =
  | { success: true; friend: LocalFriend }
  | { success: false; reason: 'empty' | 'self' | 'duplicate' | 'invalid' | 'full' };

function hashCode(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

function localFriendId(code: string): string {
  return `local_${hashCode(code.toLowerCase()).toString(16)}`;
}

function generateMyCode(): string {
  const bytes = new Uint8Array(2);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return `MULA-${hex}`;
}

/** Nombre legible a partir del código (`MULA-AB12` → `Camionero AB12`). */
function nameFromCode(code: string): string {
  if (MULA_CODE_RE.test(code)) {
    return `Camionero ${code.slice(5).toUpperCase()}`;
  }
  if (INVITE_CODE_RE.test(code)) {
    return `Camionero ${code.toUpperCase().slice(0, 4)}`;
  }
  if (isUuid(code)) {
    return `Camionero ${code.slice(0, 4).toUpperCase()}`;
  }
  const cleaned = code.replace(/^friend[_-]/i, '').replace(/^MULA-/i, 'Camionero ');
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function simulateFriendTick(f: LocalFriend, now: number): LocalFriend {
  let next = f;
  if (Math.random() < 0.25) next = { ...next, lastActive: now };
  next = {
    ...next,
    cpsTotal: next.cpsTotal + Math.floor(Math.random() * 5000),
    livePresence: false,
  };
  return next;
}

export interface FriendsState {
  myCode: string;
  friends: LocalFriend[];
  incomingConvite: IncomingConvite | null;
  /** Última refresh usó datos reales de al menos un amigo UUID. */
  presenceLive: boolean;

  addFriend: (code: string, resolved?: ResolvedFriendProfile) => AddFriendResult;
  removeFriend: (id: string) => void;
  sendConvite: (id: string) => boolean;
  /** Dispara refresh (sync fire-and-forget; presencia live es async). */
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
      presenceLive: false,

      addFriend: (code, resolved) => {
        const normalized = code.trim();
        if (!normalized) return { success: false, reason: 'empty' };
        if (!isValidFriendCode(normalized) && !resolved?.id) {
          return { success: false, reason: 'invalid' };
        }
        const state = get();
        if (normalized.toUpperCase() === state.myCode.toUpperCase()) {
          return { success: false, reason: 'self' };
        }
        if (state.friends.length >= MAX_FRIENDS) {
          return { success: false, reason: 'full' };
        }
        if (state.friends.some((f) => f.code.toLowerCase() === normalized.toLowerCase())) {
          return { success: false, reason: 'duplicate' };
        }
        if (resolved?.id && state.friends.some((f) => f.id === resolved.id)) {
          return { success: false, reason: 'duplicate' };
        }

        const h = hashCode(normalized);
        const id =
          resolved?.id && isUuid(resolved.id)
            ? resolved.id
            : isUuid(normalized)
              ? normalized.toLowerCase()
              : localFriendId(normalized);

        const friend: LocalFriend = {
          id,
          code: normalized,
          name: resolved?.name?.trim() || nameFromCode(normalized),
          avatar:
            resolved?.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(normalized)}`,
          cpsTotal: resolved?.cpsTotal ?? 10_000 + (h % 5_000_000),
          lastActive: Date.now(),
          addedAt: Date.now(),
          lastConviteAt: 0,
          livePresence: Boolean(resolved?.id && isUuid(resolved.id)),
        };
        set({ friends: [...state.friends, friend] });
        return { success: true, friend };
      },

      removeFriend: (id) => {
        set((state) => ({ friends: state.friends.filter((f) => f.id !== id) }));
      },

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

      refreshActivity: () => {
        const state = get();
        if (state.friends.length === 0) return;

        const now = Date.now();
        const uuidFriends = state.friends.filter((f) => isUuid(f.id));
        const canTryLive = isSupabaseConfigured && uuidFriends.length > 0;

        const applyIncoming = (friends: LocalFriend[], presenceLive: boolean) => {
          let incomingConvite = get().incomingConvite;
          if (!incomingConvite && Math.random() < 0.15) {
            const active = friends.filter((f) => now - f.lastActive < ACTIVE_WINDOW_MS);
            const pool = active.length > 0 ? active : friends;
            const f = pool[Math.floor(Math.random() * pool.length)];
            if (f) incomingConvite = { id: now, friendId: f.id, friendName: f.name };
          }
          set({ friends, incomingConvite, presenceLive });
        };

        if (!canTryLive) {
          applyIncoming(
            state.friends.map((f) => simulateFriendTick(f, now)),
            false
          );
          return;
        }

        // Best-effort live presence; si falla, cae a simulación.
        void (async () => {
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData.session) {
              applyIncoming(
                get().friends.map((f) => simulateFriendTick(f, now)),
                false
              );
              return;
            }

            const ids = uuidFriends.map((f) => f.id);
            const [{ data: lbRows }, { data: profileRows }] = await Promise.all([
              supabase
                .from('leaderboard_global')
                .select('user_id, cps_total, updated_at')
                .in('user_id', ids),
              supabase.from('profiles').select('id, updated_at, username, avatar_url').in('id', ids),
            ]);
            // Nota: game_state.last_tick_at no se lee aquí — RLS solo permite
            // la fila propia (game_state_select_own). Usamos updated_at público.

            const lbById = new Map(
              (lbRows ?? []).map((r) => [
                r.user_id as string,
                {
                  cps: Number(r.cps_total) || 0,
                  at: r.updated_at ? new Date(r.updated_at as string).getTime() : 0,
                },
              ])
            );
            const profileById = new Map(
              (profileRows ?? []).map((p) => [
                p.id as string,
                {
                  at: p.updated_at ? new Date(p.updated_at as string).getTime() : 0,
                  name: (p.username as string | null) ?? undefined,
                  avatar: (p.avatar_url as string | null) ?? undefined,
                },
              ])
            );

            let anyLive = false;
            const friends = get().friends.map((f) => {
              if (!isUuid(f.id)) return simulateFriendTick(f, now);

              const lb = lbById.get(f.id);
              const profile = profileById.get(f.id);
              if (!lb && !profile) return simulateFriendTick(f, now);

              anyLive = true;
              const lastAt = Math.max(lb?.at ?? 0, profile?.at ?? 0, f.lastActive);
              return {
                ...f,
                cpsTotal: lb?.cps ?? f.cpsTotal,
                lastActive: lastAt > 0 ? lastAt : f.lastActive,
                name: profile?.name?.trim() || f.name,
                avatar: profile?.avatar || f.avatar,
                livePresence: true,
              };
            });

            applyIncoming(friends, anyLive);
          } catch {
            applyIncoming(
              get().friends.map((f) => simulateFriendTick(f, now)),
              false
            );
          }
        })();
      },

      clearIncomingConvite: () => set({ incomingConvite: null }),

      getActiveFriends: () => {
        const now = Date.now();
        return get().friends.filter((f) => now - f.lastActive < ACTIVE_WINDOW_MS);
      },

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
