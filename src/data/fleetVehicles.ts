// ─────────────────────────────────────────────────────────────────────────────
// SECTION B: FLEET SYSTEM WITH REAL TRUCK BRANDS
// 10 vehículos reales. La flota es un MULTIPLICADOR (×) del CPS por click,
// no una suma. Se compra con Golden Tickets (🎟️), no con CPS.
// ─────────────────────────────────────────────────────────────────────────────

export interface FleetVehicle {
  id: string;
  brand: string;
  model: string;
  multiplier: number;
  tickets: number;
  color: string;
  country: string;
  emoji: string;
}

export const DEFAULT_FLEET_ID = 'chevrolet';

export const FLEET_VEHICLES: FleetVehicle[] = [
  {
    id: 'chevrolet',
    brand: 'CHEVROLET',
    model: 'NHR/NPR/FRR/FVR',
    multiplier: 1.0,
    tickets: 0,
    color: '#E31937',
    country: 'USA',
    emoji: '🚚',
  },
  {
    id: 'freightliner',
    brand: 'FREIGHTLINER',
    model: 'Cascadia/M2',
    multiplier: 1.5,
    tickets: 5,
    color: '#0066B2',
    country: 'USA',
    emoji: '🚛',
  },
  {
    id: 'kenworth',
    brand: 'KENWORTH',
    model: 'T800/T880',
    multiplier: 2.0,
    tickets: 15,
    color: '#FF0000',
    country: 'USA',
    emoji: '🚛',
  },
  {
    id: 'volvo',
    brand: 'VOLVO',
    model: 'FM/FH',
    multiplier: 3.0,
    tickets: 40,
    color: '#003B7E',
    country: 'Sweden',
    emoji: '🚚',
  },
  {
    id: 'scania',
    brand: 'SCANIA',
    model: 'R-Series/P-Series',
    multiplier: 4.5,
    tickets: 100,
    color: '#041E42',
    country: 'Sweden',
    emoji: '🚛',
  },
  {
    id: 'mercedes',
    brand: 'MERCEDES-BENZ',
    model: 'Actros/Arocs',
    multiplier: 7.0,
    tickets: 250,
    color: '#00ADEF',
    country: 'Germany',
    emoji: '🚚',
  },
  {
    id: 'international',
    brand: 'INTERNATIONAL',
    model: 'ProStar/Lonestar',
    multiplier: 10.0,
    tickets: 600,
    color: '#E4002B',
    country: 'USA',
    emoji: '🚛',
  },
  {
    id: 'daf',
    brand: 'DAF',
    model: 'XF/CF',
    multiplier: 15.0,
    tickets: 1500,
    color: '#FF6600',
    country: 'Netherlands',
    emoji: '🚚',
  },
  {
    id: 'foton',
    brand: 'FOTON',
    model: 'Auman TX/EST',
    multiplier: 25.0,
    tickets: 4000,
    color: '#003399',
    country: 'China',
    emoji: '🚛',
  },
  {
    id: 'tesla',
    brand: 'TESLA',
    model: 'Tesla Semi',
    multiplier: 50.0,
    tickets: 10000,
    color: '#CC0000',
    country: 'USA',
    emoji: '🚛',
  },
];

export function getFleetVehicle(id: string): FleetVehicle | undefined {
  return FLEET_VEHICLES.find((v) => v.id === id);
}

/** Multiplicador de flota actual (×). Cualquier id desconocido cae al default ×1. */
export function getFleetMultiplier(selectedFleet: string): number {
  return getFleetVehicle(selectedFleet)?.multiplier ?? 1;
}
