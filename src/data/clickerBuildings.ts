export interface ClickerBuilding {
  id: string;
  name: string;
  description: string;
  emoji: string;
  baseCost: number;
  baseClickBonus: number; // clicks added per click per owned level
  color: string;
}

export const CLICKER_BUILDINGS: ClickerBuilding[] = [
  {
    id: 'motoneta',
    name: 'Motoneta de Reparto',
    description: 'Ágil para entregas urbanas cortas.',
    emoji: '🛵',
    baseCost: 15,
    baseClickBonus: 2,
    color: '#F59E0B',
  },
  {
    id: 'camioneta',
    name: 'Camioneta de Carga',
    description: 'Perfecta para carga ligera de barrio.',
    emoji: '🚐',
    baseCost: 100,
    baseClickBonus: 5,
    color: '#3B82F6',
  },
  {
    id: 'plataforma',
    name: 'Camión de Plataforma',
    description: 'Lleva contenedores y maquinaria.',
    emoji: '🚛',
    baseCost: 500,
    baseClickBonus: 11,
    color: '#EF4444',
  },
  {
    id: 'tractomula',
    name: 'Tractomula Clásica',
    description: 'La reina de las carreteras colombianas.',
    emoji: '🚚',
    baseCost: 3000,
    baseClickBonus: 23,
    color: '#F97316',
  },
  {
    id: 'volqueta',
    name: 'Volqueta de Obra',
    description: 'Carga pesada de arena y piedra.',
    emoji: '⛟',
    baseCost: 10000,
    baseClickBonus: 47,
    color: '#EAB308',
  },
  {
    id: 'furgon',
    name: 'Furgón Refrigerado',
    description: 'Transporta flores y alimentos perecederos.',
    emoji: '🧊',
    baseCost: 40000,
    baseClickBonus: 95,
    color: '#06B6D4',
  },
  {
    id: 'tanque',
    name: 'Carro Tanque',
    description: 'Líquidos a gran escala.',
    emoji: '🛢️',
    baseCost: 200000,
    baseClickBonus: 191,
    color: '#64748B',
  },
  {
    id: 'tren',
    name: 'Tren de Carretera',
    description: 'Doble trailer, doble capacidad.',
    emoji: '🚛',
    baseCost: 1000000,
    baseClickBonus: 383,
    color: '#8B5CF6',
  },
  {
    id: 'minero',
    name: 'Camión Minero XXL',
    description: 'Monstruo de la minería con 8 ruedas.',
    emoji: '⛏️',
    baseCost: 5000000,
    baseClickBonus: 767,
    color: '#22C55E',
  },
  {
    id: 'autonomo',
    name: 'Flota Autónoma',
    description: 'Camiones del futuro sin conductor.',
    emoji: '🤖',
    baseCost: 25000000,
    baseClickBonus: 1535,
    color: '#EC4899',
  },
];



export function getBuildingCost(building: ClickerBuilding, owned: number): number {
  // Money cost (used for reference)
  return Math.ceil(building.baseCost * (1 + owned * 0.5));
}

export function getBuildingTicketCost(building: ClickerBuilding, owned: number): number {
  // Golden ticket cost: much cheaper than money
  return Math.max(1, Math.ceil((building.baseCost / 30) * (1 + owned * 0.5)));
}
