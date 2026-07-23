/**
 * Rewarded ads (opt-in). En producción esto se conectaría a una red de
 * anuncios real (AdMob/Unity Ads); por ahora simula el anuncio con un timer.
 *
 * `showRewardedAd()` resuelve `true` cuando el anuncio terminó de verse y
 * `false` si el usuario lo cerró antes (vía AbortSignal). Fuera del
 * navegador (tests/SSR) resuelve `true` inmediatamente.
 */

export interface RewardedAdOptions {
  /** Duración del anuncio simulado (default 5s). */
  durationMs?: number;
  /** Abortar la señal equivale a que el usuario cierre el anuncio. */
  signal?: AbortSignal;
}

export const REWARDED_AD_DURATION_MS = 5000;

export function showRewardedAd(options: RewardedAdOptions = {}): Promise<boolean> {
  const { durationMs = REWARDED_AD_DURATION_MS, signal } = options;

  if (typeof window === 'undefined') return Promise.resolve(true);

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (watched: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      resolve(watched);
    };
    const onAbort = () => finish(false);
    const timer = setTimeout(() => finish(true), durationMs);

    if (signal) {
      if (signal.aborted) {
        finish(false);
      } else {
        signal.addEventListener('abort', onAbort);
      }
    }
  });
}
