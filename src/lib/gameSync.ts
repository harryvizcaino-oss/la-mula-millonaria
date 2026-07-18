import { supabase, isSupabaseConfigured } from './supabase';
import { enqueueOp, flushPendingOps } from './offlineQueue';
import { useDailyStore } from '@/store/dailyStore';
import type { ClickerHydration, ClickerState } from '@/store/clickerStore';

/**
 * Sincronización del estado del juego con Supabase Postgres.
 * El store de Zustand (localStorage) sigue siendo la fuente de verdad en
 * tiempo real; este módulo solo persiste snapshots debounced y los restaura
 * al iniciar sesión. Nunca bloquea el gameplay: cualquier fallo de red se
 * degrada a la cola offline (ver lib/offlineQueue.ts).
 */

export const SAVE_DEBOUNCE_MS = 5000;

/** Fila tal como queda en la tabla `game_state` (migración 001). */
export interface GameStateRow {
  id: string;
  cps: number;
  cps_total: number;
  golden_tickets: number;
  power_levels: Record<string, number>;
  fleet_unlocked: string[];
  active_fleet_id: string;
  upgrades: Record<string, boolean>;
  total_clicks: number;
  total_earned: number;
  stars: number;
  ascensions: number;
  autoclick_level: number;
  last_tick_at: number;
  millas: number;
  streak_days: number;
  last_claim_date: string | null;
  multiplier_target: number | null;
  bar_fill_percent: number;
  current_multiplier: number;
  updated_at: string;
}

/** dailyStore guarda la fecha como "YYYY-M-D" local; la columna es `date`. */
function toIsoDate(dayKey: string): string | null {
  if (!dayKey) return null;
  const parts = dayKey.split('-').map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, m, d] = parts;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/**
 * Snapshot completo del clicker store → fila de `game_state`.
 * `millas` NO se incluye a propósito: MillasProvider es dueño de esa columna
 * y la actualiza con upserts parciales para no pisarse entre sí.
 */
export function serializeGameState(userId: string, state: ClickerState) {
  const daily = useDailyStore.getState();
  return {
    id: userId,
    cps: state.cpsBalance,
    cps_total: state.cpsTotal,
    golden_tickets: state.goldenTickets,
    power_levels: state.powerLevels,
    fleet_unlocked: state.fleetOwned,
    active_fleet_id: state.selectedFleet,
    upgrades: state.upgrades,
    total_clicks: Math.floor(state.totalClicks),
    total_earned: state.totalEarned,
    stars: state.stars,
    ascensions: state.ascensions,
    autoclick_level: state.autoclickLevel,
    last_tick_at: state.lastTickAt,
    streak_days: daily.currentStreak,
    last_claim_date: toIsoDate(daily.lastLoginDate),
    updated_at: new Date().toISOString(),
  };
}

export function rowToHydration(row: GameStateRow): ClickerHydration {
  return {
    powerLevels: row.power_levels ?? undefined,
    upgrades: row.upgrades ?? undefined,
    fleetOwned: Array.isArray(row.fleet_unlocked) ? row.fleet_unlocked : undefined,
    selectedFleet: row.active_fleet_id ?? undefined,
    cpsTotal: row.cps_total ?? undefined,
    cpsBalance: row.cps ?? undefined,
    totalClicks: row.total_clicks ?? undefined,
    totalEarned: row.total_earned ?? undefined,
    stars: row.stars ?? undefined,
    ascensions: row.ascensions ?? undefined,
    goldenTickets: row.golden_tickets ?? undefined,
    autoclickLevel: row.autoclick_level ?? undefined,
    lastTickAt: row.last_tick_at ?? undefined,
  };
}

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

/** Upsert inmediato del snapshot. Encola la operación si no hay red o falla. */
export async function saveGameStateNow(userId: string, state: ClickerState): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const payload = serializeGameState(userId, state);
  if (isOffline()) {
    enqueueOp({ kind: 'game_state', userId, payload });
    return false;
  }
  const { error } = await supabase.from('game_state').upsert(payload);
  if (error) {
    console.warn('[gameSync] Save failed, op queued:', error.message);
    enqueueOp({ kind: 'game_state', userId, payload });
    return false;
  }
  return true;
}

/** Upsert parcial de millas (columna `millas` únicamente). */
export async function saveMillasNow(userId: string, millas: number): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const payload = { id: userId, millas: Math.floor(millas), updated_at: new Date().toISOString() };
  if (isOffline()) {
    enqueueOp({ kind: 'millas', userId, payload });
    return false;
  }
  const { error } = await supabase.from('game_state').upsert(payload);
  if (error) {
    console.warn('[gameSync] Millas save failed, op queued:', error.message);
    enqueueOp({ kind: 'millas', userId, payload });
    return false;
  }
  return true;
}

/** Carga la fila de `game_state` del usuario (null si no existe/hay error). */
export async function loadGameState(userId: string): Promise<GameStateRow | null> {
  if (!isSupabaseConfigured || isOffline()) return null;
  const { data, error } = await supabase
    .from('game_state')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.error('[gameSync] Failed to load game state:', error);
    return null;
  }
  return (data as GameStateRow | null) ?? null;
}

/* ------------------------------------------------------------------ */
/*  Debounce de guardado (5s trailing)                                 */
/* ------------------------------------------------------------------ */

let saveTimer: ReturnType<typeof setTimeout> | null = null;

/** Programa un guardado 5s después del último cambio de estado. */
export function scheduleSave(userId: string, getState: () => ClickerState) {
  if (!isSupabaseConfigured) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    void saveGameStateNow(userId, getState());
  }, SAVE_DEBOUNCE_MS);
}

/** Fuerza el guardado pendiente (beforeunload / visibilitychange). */
export function flushScheduledSave(userId: string, getState: () => ClickerState) {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  void saveGameStateNow(userId, getState());
}

/* ------------------------------------------------------------------ */
/*  Flush de la cola offline al recuperar conexión                     */
/* ------------------------------------------------------------------ */

let onlineListenerInstalled = false;

/** Instala (una sola vez) el listener de `online` que vacía la cola. */
export function installOnlineFlush() {
  if (onlineListenerInstalled || typeof window === 'undefined') return;
  onlineListenerInstalled = true;
  window.addEventListener('online', () => {
    void flushPendingOps().then((flushed) => {
      if (flushed > 0) console.info(`[gameSync] Synced ${flushed} pending op(s) after reconnect`);
    });
  });
}
