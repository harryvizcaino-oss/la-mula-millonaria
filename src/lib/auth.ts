import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Shape que consumen las páginas (antes venía del backend tRPC `auth.me`).
 * Se construye desde el user de Supabase Auth + la fila de `profiles`.
 */
export interface AppUser {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
}

function oauthRedirectTo(): string {
  return `${window.location.origin}/auth/callback`;
}

export async function signInWithGoogle() {
  if (!isSupabaseConfigured) return { error: new Error('Supabase no configurado') };
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: oauthRedirectTo() },
  });
}

export async function signInWithApple() {
  if (!isSupabaseConfigured) return { error: new Error('Supabase no configurado') };
  return supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: { redirectTo: oauthRedirectTo() },
  });
}

export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function signOut() {
  if (!isSupabaseConfigured) return;
  await supabase.auth.signOut();
}

/** Lee la fila de `profiles` del usuario (null si no existe o no hay config). */
export async function fetchProfile(userId: string) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, level')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.error('[auth] Failed to fetch profile:', error);
    return null;
  }
  return data;
}

export function toAppUser(
  user: User,
  profile: { username: string | null; avatar_url: string | null } | null
): AppUser {
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    name: profile?.username ?? meta.full_name ?? meta.name ?? user.email ?? null,
    email: user.email ?? null,
    avatar: profile?.avatar_url ?? meta.avatar_url ?? meta.picture ?? null,
  };
}

/**
 * Fallback client-side del trigger `handle_new_user` (ver migración 001):
 * garantiza que existan `profiles` y `game_state` para el usuario recién
 * registrado. Usa upsert con ignoreDuplicates para ser idempotente.
 */
export async function ensureUserRecords(user: User) {
  if (!isSupabaseConfigured) return;
  const meta = user.user_metadata ?? {};
  const username: string | null = meta.full_name ?? meta.name ?? user.email ?? null;
  const avatarUrl: string | null = meta.avatar_url ?? meta.picture ?? null;

  const { error: profileError } = await supabase.from('profiles').upsert(
    { id: user.id, username, avatar_url: avatarUrl },
    { onConflict: 'id', ignoreDuplicates: true }
  );
  if (profileError) console.error('[auth] Failed to ensure profile:', profileError);

  const { error: stateError } = await supabase
    .from('game_state')
    .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true });
  if (stateError) console.error('[auth] Failed to ensure game_state:', stateError);
}
