/**
 * Rewarded ads (opt-in). En producción esto se conectaría a AdSense Rewarded
 * (o AdMob) cuando exista `VITE_ADSENSE_CLIENT`. El IAP "sin anuncios" NO
 * bloquea rewarded: el jugador eligió ver el anuncio a cambio de una
 * recompensa.
 *
 * Mientras falte el client id (o hasta cablear el SDK), se usa el mock de
 * timer. Abortar la señal sigue resolviendo `false`.
 */

import { ADSENSE_CLIENT } from '@/lib/adsConfig';

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

  // Ad-free no aplica aquí: rewarded sigue permitido.
  // Si falta VITE_ADSENSE_CLIENT (o el SDK aún no está cableado), mock de timer.
  if (ADSENSE_CLIENT) {
    // Producción: AdSense Rewarded iría aquí. Hasta entonces, mismo mock.
  }

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
