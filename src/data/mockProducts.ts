export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  priceCOP: number;
  millasCost: number;
  description: string;
  featured?: boolean;
  rating?: number;
  reviewCount?: number;
  // Campos del catalogo VTEX real (ausentes en mocks)
  imageUrl?: string;    // foto real; si falta se usa el placeholder con gradiente `image`
  redeemable?: boolean; // false = sin precio curado en vtexPrices → no redimible
  link?: string;        // URL del producto en redpostventa.com
  skuId?: string;       // itemId de VTEX — para armar link al carrito
  sellerId?: string;    // seller de VTEX
}

export const categories = [
  { id: 'all', label: 'Todos', icon: 'Grid3x3' },
  { id: 'Electronica', label: 'Electronica', icon: 'Monitor' },
  { id: 'Hogar', label: 'Hogar', icon: 'Home' },
  { id: 'Deportes', label: 'Deportes', icon: 'Dumbbell' },
  { id: 'Moda', label: 'Moda', icon: 'Shirt' },
  { id: 'Accesorios', label: 'Accesorios', icon: 'Watch' },
  { id: 'Gift Cards', label: 'Gift Cards', icon: 'Gift' },
] as const;

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Audifonos Bluetooth Pro con Cancelacion de Ruido',
    brand: 'TechSound',
    category: 'Electronica',
    image: 'gradient-purple',
    priceCOP: 85000,
    millasCost: 8500,
    description: 'Audifonos over-ear con cancelacion activa de ruido, 30h de bateria y sonido Hi-Res. Conexion Bluetooth 5.3 y microfono integrado para llamadas claras.',
    featured: true,
    rating: 4.5,
    reviewCount: 128,
  },
  {
    id: '2',
    name: 'Mochila Transporte 40L Resistente al Agua',
    brand: 'CargaMax',
    category: 'Accesorios',
    image: 'gradient-blue',
    priceCOP: 120000,
    millasCost: 12000,
    description: 'Mochila impermeable de 40 litros con compartimento acolchado para laptop, multiples bolsillos organizadores y correas ergonómicas.',
    featured: true,
    rating: 4.8,
    reviewCount: 89,
  },
  {
    id: '3',
    name: 'Botella Termica 1L Acero Inoxidable',
    brand: 'EcoVida',
    category: 'Deportes',
    image: 'gradient-green',
    priceCOP: 42000,
    millasCost: 4200,
    description: 'Botella termica de doble pared en acero inoxidable 18/8. Mantiene bebidas frias 24h y calientes 12h. Libre de BPA.',
    rating: 4.2,
    reviewCount: 245,
  },
  {
    id: '4',
    name: 'Gift Card $50,000 COP La Mula Millonaria',
    brand: 'La Mula Millonaria',
    category: 'Gift Cards',
    image: 'gradient-amber',
    priceCOP: 50000,
    millasCost: 50000,
    description: 'Gift Card valida por $50,000 COP en nuestro marketplace VTEX. Valida por 30 dias desde su activacion. No combinable con otras promociones.',
    featured: true,
    rating: 5.0,
    reviewCount: 312,
  },
  {
    id: '5',
    name: 'Reloj Inteligente FitPro con GPS',
    brand: 'TechSound',
    category: 'Electronica',
    image: 'gradient-indigo',
    priceCOP: 250000,
    millasCost: 25000,
    description: 'Smartwatch con GPS integrado, monitor de ritmo cardiaco, SpO2, y mas de 100 modos deportivos. Pantalla AMOLED de 1.43".',
    rating: 4.6,
    reviewCount: 67,
  },
  {
    id: '6',
    name: 'Luces LED USB para Escritorio Gamer',
    brand: 'Lumina',
    category: 'Electronica',
    image: 'gradient-pink',
    priceCOP: 35000,
    millasCost: 3500,
    description: 'Barra de luces LED RGB con control por app. 16 millones de colores, sincronizacion con musica y modos predefinidos. Alimentacion USB.',
    rating: 4.0,
    reviewCount: 156,
  },
  {
    id: '7',
    name: 'Organizador de Maletero Plegable',
    brand: 'HogarPlus',
    category: 'Hogar',
    image: 'gradient-orange',
    priceCOP: 68000,
    millasCost: 6800,
    description: 'Organizador plegable para maletero de auto con 3 compartimentos, laterales reforzados y fondo antideslizante. Capacidad de 60 litros.',
    rating: 4.3,
    reviewCount: 78,
  },
  {
    id: '8',
    name: 'Guantes de Conduccion de Cuero Premium',
    brand: 'DriveSafe',
    category: 'Accesorios',
    image: 'gradient-red',
    priceCOP: 55000,
    millasCost: 5500,
    description: 'Guantes de conduccion en cuero genuino con perforaciones para ventilacion, palma acolchada y cierre de muneca ajustable.',
    rating: 4.7,
    reviewCount: 43,
  },
  {
    id: '9',
    name: 'Camiseta Tecnica DryFit para Conductores',
    brand: 'CargaMax',
    category: 'Moda',
    image: 'gradient-teal',
    priceCOP: 45000,
    millasCost: 4500,
    description: 'Camiseta deportiva de tejido tecnico DryFit que absorbe el sudor y se seca rapidamente. Corte ergonomico para maxima comodidad al conducir.',
    rating: 4.4,
    reviewCount: 112,
  },
  {
    id: '10',
    name: 'Gift Card $100,000 COP La Mula Millonaria',
    brand: 'La Mula Millonaria',
    category: 'Gift Cards',
    image: 'gradient-gold',
    priceCOP: 100000,
    millasCost: 100000,
    description: 'Gift Card valida por $100,000 COP en nuestro marketplace VTEX. Incluye envio gratis en todos los productos participantes.',
    featured: true,
    rating: 4.9,
    reviewCount: 198,
  },
  {
    id: '11',
    name: 'Set de Pesas Ajustables 20kg',
    brand: 'FitPro',
    category: 'Deportes',
    image: 'gradient-cyan',
    priceCOP: 180000,
    millasCost: 18000,
    description: 'Set de mancuernas ajustables de 2.5kg a 20kg con sistema de cambio rapido. Incluye soporte y placas de acero recubiertas.',
    rating: 4.6,
    reviewCount: 54,
  },
  {
    id: '12',
    name: 'Gorra Trucker Vintage Mesh',
    brand: 'DriveSafe',
    category: 'Moda',
    image: 'gradient-rose',
    priceCOP: 32000,
    millasCost: 3200,
    description: 'Gorra estilo trucker con paneles de malla para ventilacion, visera curvada y cierre snapback ajustable. Logo bordado de La Mula Millonaria.',
    rating: 4.3,
    reviewCount: 167,
  },
  {
    id: '13',
    name: 'Cargador Inalambrico Rapido 15W',
    brand: 'TechSound',
    category: 'Electronica',
    image: 'gradient-violet',
    priceCOP: 48000,
    millasCost: 4800,
    description: 'Base de carga inalambrica Qi con soporte ajustable. Carga rapida de 15W para dispositivos compatibles. LED indicador de estado.',
    rating: 4.1,
    reviewCount: 203,
  },
  {
    id: '14',
    name: 'Almohada Ergonomica de Viaje',
    brand: 'HogarPlus',
    category: 'Hogar',
    image: 'gradient-sky',
    priceCOP: 52000,
    millasCost: 5200,
    description: 'Almohada de viaje viscoelastica con funda lavable, soporte cervical y bolsa de transporte. Ideal para largos viajes en carretera.',
    rating: 4.5,
    reviewCount: 91,
  },
  {
    id: '15',
    name: 'Gift Card $20,000 COP La Mula Millonaria',
    brand: 'La Mula Millonaria',
    category: 'Gift Cards',
    image: 'gradient-lime',
    priceCOP: 20000,
    millasCost: 20000,
    description: 'Gift Card valida por $20,000 COP. El regalo perfecto para un camionero. Canjeable en todos los productos del marketplace.',
    rating: 4.8,
    reviewCount: 276,
  },
];

export function getGradientClass(gradientName: string): string {
  const gradients: Record<string, string> = {
    'gradient-purple': 'from-purple-600 to-indigo-600',
    'gradient-blue': 'from-blue-600 to-cyan-600',
    'gradient-green': 'from-emerald-600 to-teal-600',
    'gradient-amber': 'from-amber-500 to-orange-500',
    'gradient-indigo': 'from-indigo-600 to-purple-700',
    'gradient-pink': 'from-pink-500 to-rose-500',
    'gradient-orange': 'from-orange-500 to-red-500',
    'gradient-red': 'from-red-600 to-rose-700',
    'gradient-teal': 'from-teal-500 to-emerald-600',
    'gradient-gold': 'from-yellow-500 to-amber-600',
    'gradient-cyan': 'from-cyan-600 to-blue-600',
    'gradient-rose': 'from-rose-500 to-pink-600',
    'gradient-violet': 'from-violet-600 to-purple-600',
    'gradient-sky': 'from-sky-500 to-blue-600',
    'gradient-lime': 'from-lime-500 to-green-600',
  };
  return gradients[gradientName] || 'from-gray-600 to-gray-700';
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'Electronica': 'Headphones',
    'Hogar': 'Home',
    'Deportes': 'Dumbbell',
    'Moda': 'Shirt',
    'Accesorios': 'Briefcase',
    'Gift Cards': 'Gift',
  };
  return icons[category] || 'Package';
}
