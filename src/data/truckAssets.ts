// ─────────────────────────────────────────────────────────────────────────────
// TRUCK ASSETS — PNG profesionales (NUNCA svg/emoji para camiones).
// chevrolet/freightliner → mula base naranja; kenworth → T800 amarillo;
// volvo → FH blanco; scania → R naranja; el resto cae a la mula base.
// `assetUrl` prefiere la variante AVIF optimizada cuando está disponible.
// ─────────────────────────────────────────────────────────────────────────────

import { assetUrl } from '@/lib/assetUrl';

export const TRUCK_ASSETS: Record<string, string> = {
  chevrolet: assetUrl('/assets/camion_base_orange_front.png'),
  freightliner: assetUrl('/assets/camion_base_orange_front.png'),
  kenworth: assetUrl('/assets/camion_kenworth_yellow.png'),
  volvo: assetUrl('/assets/camion_volvo_white.png'),
  scania: assetUrl('/assets/camion_scania_orange.png'),
};

export const DEFAULT_TRUCK_ASSET = assetUrl('/assets/camion_base_orange_front.png');

/** Asset PNG del camión para un vehículo de flota (cualquier id desconocido → mula base). */
export function getTruckAsset(fleetId: string): string {
  return TRUCK_ASSETS[fleetId] ?? DEFAULT_TRUCK_ASSET;
}
