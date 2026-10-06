import { useSyncExternalStore } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface DailyRankEntry {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  cps_day: number;
}

interface DailyRankState {
  top: DailyRankEntry[];
  myRank: number | null;
  totalPlayers: number;
  loading: boolean;
}

const EMPTY: DailyRankState = { top: [], myRank: null, totalPlayers: 0, loading: true };

/**
 * Suscripción global ÚNICA al ranking diario (singleton).
 *
 * El canal de Supabase Realtime NO se puede suscribir dos veces con el mismo
 * nombre: el segundo `.on('postgres_changes')` lanza "cannot add callbacks
 * after subscribe()" y rompe el render de /game. Aquí mantenemos un solo
 * canal compartido y una lista de listeners; cada `useDailyRank` se engancha
 * a esa única fuente, sin crear canales duplicados.
 */

type Listener = () => void;

let state: DailyRankState = EMPTY;
const listeners = new Set<Listener>();
let channel: ReturnType<typeof supabase.channel> | null = null;
let started = false;
let userId: string | undefined;
let poll: ReturnType<typeof setInterval> | null = null;
let debounce: ReturnType<typeof setTimeout> | null = null;

function emit() {
  for (const l of listeners) l();
}

function setState(next: DailyRankState) {
  state = next;
  emit();
}

function snapshot(): DailyRankState {
  return state;
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  if (listeners.size === 1) start();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stop();
  };
}

function stop() {
  if (poll) {
    clearInterval(poll);
    poll = null;
  }
  if (debounce) {
    clearTimeout(debounce);
    debounce = null;
  }
  if (channel) {
    void supabase.removeChannel(channel);
    channel = null;
  }
  started = false;
}

async function load() {
  if (!isSupabaseConfigured) {
    setState({ top: [], myRank: null, totalPlayers: 0, loading: false });
    return;
  }

  try {
    const topResult = await supabase
      .from('leaderboard_global')
      .select('user_id, username, avatar_url, cps_day')
      .order('cps_day', { ascending: false })
      .limit(10);

    let topData = (topResult.data ?? []) as DailyRankEntry[];
    if (topResult.error) {
      const fallback = await supabase
        .from('leaderboard_global')
        .select('user_id, username, avatar_url, cps_total')
        .order('cps_total', { ascending: false })
        .limit(10);
      topData = (fallback.data ?? []).map((row) => ({
        user_id: row.user_id,
        username: row.username,
        avatar_url: row.avatar_url,
        cps_day: row.cps_total,
      })) as DailyRankEntry[];
    }

    let totalPlayers = 0;
    try {
      const countResult = await supabase
        .from('leaderboard_global')
        .select('*', { count: 'exact', head: true })
        .gt('cps_day', 0);
      totalPlayers = countResult.count ?? 0;
    } catch {
      const fallbackCount = await supabase
        .from('leaderboard_global')
        .select('*', { count: 'exact', head: true });
      totalPlayers = fallbackCount.count ?? 0;
    }

    let myRank: number | null = null;
    if (userId) {
      try {
        const meResult = await supabase
          .from('leaderboard_global')
          .select('cps_day')
          .eq('user_id', userId)
          .maybeSingle();
        const myCpsDay = meResult.data?.cps_day ?? 0;
        const rankResult = await supabase
          .from('leaderboard_global')
          .select('*', { count: 'exact', head: true })
          .gt('cps_day', myCpsDay);
        myRank = (rankResult.count ?? 0) + 1;
      } catch {
        myRank = null;
      }
    }

    setState({ top: topData, myRank, totalPlayers, loading: false });
  } catch (err) {
    console.error('[useDailyRank] Failed to load:', err);
    setState({ ...snapshot(), loading: false });
  }
}

function start() {
  if (started) return;
  started = true;

  if (isSupabaseConfigured) {
    channel = supabase
      .channel('daily_rank_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leaderboard_global' },
        () => {
          if (debounce) clearTimeout(debounce);
          debounce = setTimeout(() => void load(), 2000);
        }
      )
      .subscribe();
  }

  void load();

  // Poll de respaldo cada 30s
  poll = setInterval(() => void load(), 30_000);
}

export function useDailyRank(currentUserId: string | undefined) {
  // Actualiza el userId global (para el cálculo de myRank en el singleton)
  userId = currentUserId;

  // useSyncExternalStore arranca la suscripción única al montar el primer
  // listener y la detiene al desmontar el último.
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
