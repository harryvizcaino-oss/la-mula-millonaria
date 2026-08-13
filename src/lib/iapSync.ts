import { supabase, isSupabaseConfigured } from './supabase';
import { useIapStore } from '@/store/iapStore';

/**
 * Sync best-effort de entitlements IAP (`ad_free_until`, `starter_iap_bought`)
 * contra `game_state`. Upsert PARCIAL: no toca columnas de CPS/tickets.
 * Si las columnas aún no existen (migración 011 no aplicada), catch y no-op.
 */

export const IAP_SAVE_DEBOUNCE_MS = 5000;

/** Fecha far-future que Postgres acepta; el store usa MAX_SAFE_INTEGER = lifetime. */
const LIFETIME_ISO = '9999-12-31T23:59:59.000Z';
const LIFETIME_YEAR = 9000;

export interface IapEntitlementRow {
  ad_free_until: string | null;
  starter_iap_bought: boolean;
}

type IapSnapshot = {
  adFreeUntil: number | null;
  starterBought: boolean;
};

/** Cache: si PostgREST reporta columna inexistente, no reintentar en esta sesión. */
let iapColumnsMissing = false;

function isMissingColumnError(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const msg = (error.message ?? '').toLowerCase();
  return (
    error.code === 'PGRST204' ||
    error.code === '42703' ||
    msg.includes('ad_free_until') ||
    msg.includes('starter_iap_bought') ||
    msg.includes('schema cache') ||
    msg.includes('does not exist')
  );
}

function isoToMs(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;
  if (new Date(ms).getUTCFullYear() >= LIFETIME_YEAR) return Number.MAX_SAFE_INTEGER;
  return ms;
}

function msToIso(ms: number | null): string | null {
  if (ms == null) return null;
  // MAX_SAFE_INTEGER no cabe en Date; lifetime → sentinel Postgres.
  if (!Number.isFinite(ms) || ms >= Date.UTC(LIFETIME_YEAR, 0, 1)) return LIFETIME_ISO;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return LIFETIME_ISO;
  return d.toISOString();
}

function snapshotFromStore(): IapSnapshot {
  const s = useIapStore.getState();
  return { adFreeUntil: s.adFreeUntil, starterBought: s.starterBought };
}

/** Carga entitlements del servidor y los fusiona en iapStore. */
export async function loadIapEntitlements(userId: string): Promise<IapEntitlementRow | null> {
  if (!isSupabaseConfigured || iapColumnsMissing) return null;
  const { data, error } = await supabase
    .from('game_state')
    .select('ad_free_until, starter_iap_bought')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    if (isMissingColumnError(error)) {
      iapColumnsMissing = true;
      console.warn('[iapSync] Columns missing — skip entitlements sync');
      return null;
    }
    console.error('[iapSync] Failed to load entitlements:', error);
    return null;
  }
  if (!data) return null;
  const row = data as IapEntitlementRow;
  useIapStore.getState().hydrateFromServer({
    adFreeUntil: isoToMs(row.ad_free_until),
    starterBought: !!row.starter_iap_bought,
  });
  return row;
}

/** Upsert parcial de las dos columnas IAP (no pisa CPS). */
export async function saveIapEntitlementsNow(userId: string, state: IapSnapshot): Promise<boolean> {
  if (!isSupabaseConfigured || iapColumnsMissing) return false;
  const payload = {
    id: userId,
    ad_free_until: msToIso(state.adFreeUntil),
    starter_iap_bought: !!state.starterBought,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('game_state').upsert(payload);
  if (error) {
    if (isMissingColumnError(error)) {
      iapColumnsMissing = true;
      console.warn('[iapSync] Columns missing — skip entitlements save');
      return false;
    }
    console.warn('[iapSync] Save failed:', error.message);
    return false;
  }
  return true;
}

/* ------------------------------------------------------------------ */
/*  Debounce de guardado (5s trailing)                                 */
/* ------------------------------------------------------------------ */

let iapSaveTimer: ReturnType<typeof setTimeout> | null = null;

/** Programa un guardado 5s después del último cambio de estado. */
export function scheduleIapSave(userId: string, getState: () => IapSnapshot = snapshotFromStore) {
  if (!isSupabaseConfigured || iapColumnsMissing) return;
  if (iapSaveTimer) clearTimeout(iapSaveTimer);
  iapSaveTimer = setTimeout(() => {
    iapSaveTimer = null;
    void saveIapEntitlementsNow(userId, getState());
  }, IAP_SAVE_DEBOUNCE_MS);
}

/** Fuerza el guardado pendiente (beforeunload / visibilitychange). */
export function flushScheduledIapSave(userId: string, getState: () => IapSnapshot = snapshotFromStore) {
  if (iapSaveTimer) {
    clearTimeout(iapSaveTimer);
    iapSaveTimer = null;
  }
  void saveIapEntitlementsNow(userId, getState());
}
