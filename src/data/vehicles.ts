export type VehicleShape = 'tractor' | 'van' | 'tanker' | 'bus' | 'suv' | 'motorcycle';

export interface VehicleConfig {
  id: string;
  name: string;
  price: number;
  description: string;
  emoji: string;
  bodyColor: string;
  bodyDarkColor: string;
  cabinColor: string;
  stripeColor: string;
  windowColor: string;
  lightColor: string;
  wheelColor: string;
  rimColor: string;
  widthScale: number;
  heightScale: number;
  shape: VehicleShape;
}

export const VEHICLES: VehicleConfig[] = [
  {
    id: 'tractor',
    name: 'Tractocamión Clásico',
    price: 0,
    description: 'El rojo confiable con el que empezó todo.',
    emoji: '🚛',
    bodyColor: '#DC2626',
    bodyDarkColor: '#991B1B',
    cabinColor: '#B91C1C',
    stripeColor: '#F8FAFC',
    windowColor: '#93C5FD',
    lightColor: '#FACC15',
    wheelColor: '#1F2937',
    rimColor: '#94A3B8',
    widthScale: 1,
    heightScale: 1,
    shape: 'tractor',
  },
  {
    id: 'van',
    name: 'Furgón Refrigerado',
    price: 5000,
    description: 'Blanco con franjas azules, ideal para carga perecedera.',
    emoji: '🚐',
    bodyColor: '#F8FAFC',
    bodyDarkColor: '#E2E8F0',
    cabinColor: '#F1F5F9',
    stripeColor: '#2563EB',
    windowColor: '#93C5FD',
    lightColor: '#FACC15',
    wheelColor: '#1F2937',
    rimColor: '#94A3B8',
    widthScale: 0.95,
    heightScale: 0.95,
    shape: 'van',
  },
  {
    id: 'tanker',
    name: 'Camión Cisterna',
    price: 10000,
    description: 'Plateado con tanque cilíndrico para líquidos.',
    emoji: '🚚',
    bodyColor: '#CBD5E1',
    bodyDarkColor: '#94A3B8',
    cabinColor: '#64748B',
    stripeColor: '#475569',
    windowColor: '#93C5FD',
    lightColor: '#FACC15',
    wheelColor: '#1F2937',
    rimColor: '#CBD5E1',
    widthScale: 1.05,
    heightScale: 1,
    shape: 'tanker',
  },
  {
    id: 'bus',
    name: 'Bus de Transporte',
    price: 15000,
    description: 'Amarillo/verde, capacidad para 40 pasajeros.',
    emoji: '🚌',
    bodyColor: '#EAB308',
    bodyDarkColor: '#CA8A04',
    cabinColor: '#15803D',
    stripeColor: '#15803D',
    windowColor: '#93C5FD',
    lightColor: '#FACC15',
    wheelColor: '#1F2937',
    rimColor: '#94A3B8',
    widthScale: 1.2,
    heightScale: 1.05,
    shape: 'bus',
  },
  {
    id: 'suv',
    name: 'Camioneta 4x4',
    price: 20000,
    description: 'Negra y robusta, para terrenos difíciles.',
    emoji: '🚗',
    bodyColor: '#18181B',
    bodyDarkColor: '#09090B',
    cabinColor: '#27272A',
    stripeColor: '#52525B',
    windowColor: '#60A5FA',
    lightColor: '#F97316',
    wheelColor: '#111827',
    rimColor: '#D4D4D8',
    widthScale: 0.95,
    heightScale: 0.85,
    shape: 'suv',
  },
  {
    id: 'motorcycle',
    name: 'Moto de Courier',
    price: 25000,
    description: 'Rápida y ágil, para entregas urbanas.',
    emoji: '🏍️',
    bodyColor: '#DC2626',
    bodyDarkColor: '#991B1B',
    cabinColor: '#DC2626',
    stripeColor: '#FACC15',
    windowColor: '#93C5FD',
    lightColor: '#FACC15',
    wheelColor: '#1F2937',
    rimColor: '#94A3B8',
    widthScale: 0.55,
    heightScale: 0.55,
    shape: 'motorcycle',
  },
];

const SELECTED_VEHICLE_KEY = 'truckSurfers_selectedVehicle';
const UNLOCKED_VEHICLES_KEY = 'truckSurfers_unlockedVehicles';

export function getDefaultVehicleId(): string {
  return VEHICLES[0].id;
}

export function getSelectedVehicleId(): string {
  try {
    const raw = localStorage.getItem(SELECTED_VEHICLE_KEY);
    if (raw && VEHICLES.some((v) => v.id === raw)) return raw;
  } catch {
    // ignore
  }
  return getDefaultVehicleId();
}

export function setSelectedVehicleId(id: string): void {
  try {
    localStorage.setItem(SELECTED_VEHICLE_KEY, id);
  } catch {
    // ignore
  }
}

export function getUnlockedVehicleIds(): string[] {
  try {
    const raw = localStorage.getItem(UNLOCKED_VEHICLES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed)) {
        return parsed.filter((id) => VEHICLES.some((v) => v.id === id));
      }
    }
  } catch {
    // ignore
  }
  return [getDefaultVehicleId()];
}

export function unlockVehicleId(id: string): void {
  try {
    const unlocked = new Set(getUnlockedVehicleIds());
    unlocked.add(id);
    localStorage.setItem(UNLOCKED_VEHICLES_KEY, JSON.stringify(Array.from(unlocked)));
  } catch {
    // ignore
  }
}

export function isVehicleUnlocked(id: string): boolean {
  return getUnlockedVehicleIds().includes(id);
}

export function getVehicleById(id: string): VehicleConfig {
  return VEHICLES.find((v) => v.id === id) ?? VEHICLES[0];
}
