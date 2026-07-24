import { useState, useEffect, useCallback } from 'react';
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

/**
 * Ranking diario mundial en tiempo real (cps_day).
 * Se suscribe a `postgres_changes` en `leaderboard_global` con debounce de 2s
 * para no saturar la UI cuando muchos jugadores actualizan simultáneamente.
 */
export function useDailyRank(userId: string | undefined) {
  const [state, setState] = useState<DailyRankState>({
    top: [],
    myRank: null,
    totalPlayers: 0,
    loading: true,
  });

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    try {
      // Top 10 del día
      const topResult = await supabase
        .from('leaderboard_global')
        .select('user_id, username, avatar_url, cps_day')
        .order('cps_day', { ascending: false })
        .limit(10);

      // Fallback silencioso a cps_total si cps_day aún no existe
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

      // Total de jugadores activos hoy
      let totalPlayers = 0;
      try {
        const countResult = await supabase
          .from('leaderboard_global')
          .select('*', { count: 'exact', head: true })
          .gt('cps_day', 0);
        totalPlayers = countResult.count ?? 0;
      } catch {
        // cps_day puede no existir aún; fallback a total de jugadores
        const fallbackCount = await supabase
          .from('leaderboard_global')
          .select('*', { count: 'exact', head: true });
        totalPlayers = fallbackCount.count ?? 0;
      }

      // Mi posición (cuántos tienen más CPS hoy que yo)
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
          // Si falla (columna no existe, error de red), no mostramos rank
          myRank = null;
        }
      }

      setState({
        top: topData as DailyRankEntry[],
        myRank,
        totalPlayers,
        loading: false,
      });
    } catch (err) {
      console.error('[useDailyRank] Failed to load:', err);
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [userId]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    let debounce: ReturnType<typeof setTimeout> | null = null;

    const safeLoad = () => {
      if (!cancelled) void load();
    };

    safeLoad();

    const channel = supabase
      .channel('daily_rank_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leaderboard_global' },
        () => {
          if (debounce) clearTimeout(debounce);
          debounce = setTimeout(safeLoad, 2000);
        }
      )
      .subscribe();

    // Poll de respaldo cada 30s
    const poll = setInterval(safeLoad, 30000);

    return () => {
      cancelled = true;
      if (debounce) clearTimeout(debounce);
      clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [load]);

  return state;
}
