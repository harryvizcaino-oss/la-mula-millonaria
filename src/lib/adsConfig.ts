import { useIapStore } from '@/store/iapStore';

export const BANNER_HEIGHT_PX = 50;
export const INTERSTITIAL_MIN_MS = 4 * 60 * 1000;
export const INTERSTITIAL_SESSION_GRACE_MS = 60_000;

/** Publisher id de AdSense; vacío = no cargar el script. */
export const ADSENSE_CLIENT: string | undefined = (() => {
  const raw = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;
  const value = raw?.trim();
  return value || undefined;
})();

export const houseAd = {
  href: '/marketplace',
  label: 'Repuestos en redpostventa.com',
} as const;

export function isAdsEnabled(): boolean {
  return !useIapStore.getState().isAdFree();
}
