import { supabase, isSupabaseConfigured } from './supabase';
import { getCurrentSeason } from '@/data/seasonPass';
import type { SeasonState } from '@/store/seasonStore';

/**
 * Sync best-effort del pase de temporada con Supabase (`season_progress`).
 * A diferencia de gameSync no encola operaciones offline: el estado local
 * (localStorage) manda y el próximo guardado exitoso pisa el servidor.
 */

export const SEASON_SAVE_DEBOUNCE_MS = 5000;

export interface SeasonProgressRow {
  user_id: string;
  season_id: string;
  xp: number;
  premium: boolean;
  claimed_levels: number[];
  claimed_premium: number[];
  updated_at: string;
}

type SeasonSnapshot = Pick<
  SeasonState,
  'seasonId' | 'xp' | 'premium' | 'claimedFree' | 'claimedPremium'
>;

/** Upsert inmediato del progreso de la temporada vigente. */
export async function saveSeasonNow(userId: string, state: SeasonSnapshot): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const payload = {
    user_id: userId,
    season_id: state.seasonId,
    xp: Math.floor(state.xp),
    premium: state.premium,
    claimed_levels: state.claimedFree,
    claimed_premium: state.claimedPremium,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('season_progress').upsert(payload);
  if (error) {
    console.warn('[seasonSync] Save failed:', error.message);
    return false;
  }
  return true;
}

/** Carga la fila de la temporada vigente (null si no existe/hay error). */
export async function loadSeasonProgress(userId: string): Promise<SeasonProgressRow | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('season_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('season_id', getCurrentSeason().id)
    .maybeSingle();
  if (error) {
    console.error('[seasonSync] Failed to load season progress:', error);
    return null;
  }
  return (data as SeasonProgressRow | null) ?? null;
}

/* ------------------------------------------------------------------ */
/*  Debounce de guardado (5s trailing)                                 */
/* ------------------------------------------------------------------ */

let seasonSaveTimer: ReturnType<typeof setTimeout> | null = null;

/** Programa un guardado 5s después del último cambio de estado. */
export function scheduleSeasonSave(userId: string, getState: () => SeasonSnapshot) {
  if (!isSupabaseConfigured) return;
  if (seasonSaveTimer) clearTimeout(seasonSaveTimer);
  seasonSaveTimer = setTimeout(() => {
    seasonSaveTimer = null;
    void saveSeasonNow(userId, getState());
  }, SEASON_SAVE_DEBOUNCE_MS);
}

/** Fuerza el guardado pendiente (beforeunload / visibilitychange). */
export function flushScheduledSeasonSave(userId: string, getState: () => SeasonSnapshot) {
  if (seasonSaveTimer) {
    clearTimeout(seasonSaveTimer);
    seasonSaveTimer = null;
  }
  void saveSeasonNow(userId, getState());
}
