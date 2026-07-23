import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Feature Amigos (T5) sobre las tablas `profiles` (invite_code, migración
 * 002) y `friends` (migración 001 + policies de 002).
 *
 * Todo es best-effort: sin config/sesión, o si la migración 002 aún no se
 * aplicó (columna invite_code inexistente), las funciones devuelven
 * null/[]/'error' y la UI degrada sin crashear.
 */

/** Perfil mínimo de otro usuario encontrado por código de invitación. */
export interface InviteProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  level: number | null;
}

/** Solicitud pendiente recibida (friend_id = yo), con datos del emisor. */
export interface PendingRequest {
  id: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
}

/** Amigo aceptado con sus datos de ranking (`leaderboard_global`). */
export interface FriendEntry {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  level: number | null;
  cps_total: number;
}

export type SendRequestResult =
  | 'sent'
  | 'self'
  | 'already-friends'
  | 'already-pending'
  | 'error';

/** Código de 8 chars hex mayúsculas (mismo charset que el backfill de 002). */
function generateInviteCode(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/**
 * Lee `profiles.invite_code` del usuario; si falta, genera uno y lo guarda
 * (reintenta ante colisión del UNIQUE). Null si no hay config o si la
 * migración 002 aún no se aplicó.
 */
export async function getMyInviteCode(userId: string): Promise<string | null> {
  if (!isSupabaseConfigured || !userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('invite_code')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    // Esperado mientras la migración 002 no esté aplicada.
    console.warn('[friends] invite_code no disponible:', error.message);
    return null;
  }
  if (data?.invite_code) return data.invite_code;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateInviteCode();
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ invite_code: code })
      .eq('id', userId);
    if (!updateError) return code;
    if (updateError.code !== '23505') {
      console.warn('[friends] no se pudo guardar invite_code:', updateError.message);
      return null;
    }
  }
  return null;
}

/** Busca un perfil por código de invitación (null si no existe o falla). */
export async function findUserByInviteCode(code: string): Promise<InviteProfile | null> {
  if (!isSupabaseConfigured) return null;
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, level')
    .eq('invite_code', normalized)
    .maybeSingle();
  if (error) {
    console.warn('[friends] búsqueda por invite_code falló:', error.message);
    return null;
  }
  return data;
}

/**
 * Crea una solicitud de amistad (status 'pending'). Guards: no a uno mismo,
 * no duplicada en ninguna dirección (pendiente o aceptada).
 */
export async function sendFriendRequest(
  myId: string,
  friendId: string
): Promise<SendRequestResult> {
  if (!isSupabaseConfigured || !myId || !friendId) return 'error';
  if (myId === friendId) return 'self';

  const { data: existing, error: checkError } = await supabase
    .from('friends')
    .select('id, status')
    .or(
      `and(user_id.eq.${myId},friend_id.eq.${friendId}),` +
        `and(user_id.eq.${friendId},friend_id.eq.${myId})`
    );
  if (checkError) {
    console.warn('[friends] no se pudo verificar duplicados:', checkError.message);
    return 'error';
  }
  if (existing && existing.length > 0) {
    return existing.some((r) => r.status === 'accepted')
      ? 'already-friends'
      : 'already-pending';
  }

  const { error } = await supabase
    .from('friends')
    .insert({ user_id: myId, friend_id: friendId, status: 'pending' });
  if (error) {
    console.warn('[friends] no se pudo enviar la solicitud:', error.message);
    return 'error';
  }
  return 'sent';
}

/** Solicitudes pendientes recibidas (friend_id = yo), con perfil del emisor. */
export async function getPendingRequests(userId: string): Promise<PendingRequest[]> {
  if (!isSupabaseConfigured || !userId) return [];

  const { data: rows, error } = await supabase
    .from('friends')
    .select('id, user_id, created_at')
    .eq('friend_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('[friends] no se pudieron cargar solicitudes:', error.message);
    return [];
  }
  if (!rows || rows.length === 0) return [];

  const ids = rows.map((r) => r.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', ids);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  return rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    username: byId.get(r.user_id)?.username ?? null,
    avatar_url: byId.get(r.user_id)?.avatar_url ?? null,
    created_at: r.created_at,
  }));
}

/** Acepta una solicitud recibida (RLS: solo el receptor puede actualizarla). */
export async function acceptFriendRequest(rowId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !rowId) return false;
  const { error } = await supabase
    .from('friends')
    .update({ status: 'accepted' })
    .eq('id', rowId);
  if (error) {
    console.warn('[friends] no se pudo aceptar la solicitud:', error.message);
    return false;
  }
  return true;
}

/** Rechaza una solicitud recibida (borra la fila; RLS: participantes). */
export async function declineFriendRequest(rowId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !rowId) return false;
  const { error } = await supabase.from('friends').delete().eq('id', rowId);
  if (error) {
    console.warn('[friends] no se pudo rechazar la solicitud:', error.message);
    return false;
  }
  return true;
}

/**
 * Amigos aceptados en ambas direcciones, con su `cps_total` de
 * `leaderboard_global` (0 si aún no tienen fila de ranking).
 */
export async function getFriends(userId: string): Promise<FriendEntry[]> {
  if (!isSupabaseConfigured || !userId) return [];

  const { data: rows, error } = await supabase
    .from('friends')
    .select('user_id, friend_id')
    .eq('status', 'accepted')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`);
  if (error) {
    console.warn('[friends] no se pudieron cargar amigos:', error.message);
    return [];
  }
  if (!rows || rows.length === 0) return [];

  const ids = rows.map((r) => (r.user_id === userId ? r.friend_id : r.user_id));

  const [{ data: profiles }, { data: leaderboard }] = await Promise.all([
    supabase.from('profiles').select('id, username, avatar_url, level').in('id', ids),
    supabase
      .from('leaderboard_global')
      .select('user_id, cps_total')
      .in('user_id', ids),
  ]);
  const cpsById = new Map((leaderboard ?? []).map((l) => [l.user_id, l.cps_total]));

  return (profiles ?? []).map((p) => ({
    user_id: p.id,
    username: p.username,
    avatar_url: p.avatar_url,
    level: p.level,
    cps_total: cpsById.get(p.id) ?? 0,
  }));
}
