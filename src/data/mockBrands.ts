export interface BrandPartner {
  id: number;
  name: string;
  logo: string;
  tagline: string;
  color: string;
  tier: 'Oro' | 'Plata' | 'Bronce';
  trucks: number;
  impressions: string;
  clicks: string;
  engagement: string;
  category: string;
}

export const brandPartners: BrandPartner[] = [
  {
    id: 1,
    name: 'Transportes del Norte',
    logo: '/brand-logo-norte.png',
    tagline: 'Conectando el pais, kilometro a kilometro',
    color: '#1E40AF',
    tier: 'Oro',
    trucks: 5,
    impressions: '2.4M',
    clicks: '48K',
    engagement: '4.8%',
    category: 'Transporte de carga',
  },
  {
    id: 2,
    name: 'Carga Express',
    logo: '/brand-logo-express.png',
    tagline: 'Rapidez y seguridad en cada envio',
    color: '#DC2626',
    tier: 'Oro',
    trucks: 4,
    impressions: '1.8M',
    clicks: '36K',
    engagement: '4.2%',
    category: 'Logistica express',
  },
  {
    id: 3,
    name: 'Logistica Andina',
    logo: '/brand-logo-andina.png',
    tagline: 'Soluciones logisticas sostenibles',
    color: '#059669',
    tier: 'Plata',
    trucks: 3,
    impressions: '980K',
    clicks: '22K',
    engagement: '3.6%',
    category: 'Logistica sostenible',
  },
  {
    id: 4,
    name: 'EcoTransporte',
    logo: '/brand-logo-eco.png',
    tagline: 'Transporte eco-amigable del futuro',
    color: '#10B981',
    tier: 'Plata',
    trucks: 2,
    impressions: '720K',
    clicks: '15K',
    engagement: '3.9%',
    category: 'Transporte verde',
  },
  {
    id: 5,
    name: 'Transporte Veloz',
    logo: '/brand-logo-veloz.png',
    tagline: 'Velocidad que cumple',
    color: '#EA580C',
    tier: 'Bronce',
    trucks: 2,
    impressions: '450K',
    clicks: '9K',
    engagement: '3.2%',
    category: 'Transporte rapido',
  },
  {
    id: 6,
    name: 'El Camion',
    logo: '/brand-logo-camion.png',
    tagline: 'El amigo de tu carga',
    color: '#EAB308',
    tier: 'Bronce',
    trucks: 1,
    impressions: '310K',
    clicks: '6K',
    engagement: '2.8%',
    category: 'Transporte local',
  },
];

export interface PricingPackage {
  id: string;
  name: string;
  price: string;
  color: string;
  borderColor: string;
  features: string[];
  recommended?: boolean;
}

export const pricingPackages: PricingPackage[] = [
  {
    id: 'bronce',
    name: 'Bronce',
    price: '$500/mes',
    color: '#CD7F32',
    borderColor: '#CD7F32',
    features: [
      '1 camion con tu branding',
      'Logo en vallas publicitarias',
      'Reporte mensual de impresiones',
    ],
  },
  {
    id: 'plata',
    name: 'Plata',
    price: '$1,200/mes',
    color: '#C0C0C0',
    borderColor: '#C0C0C0',
    recommended: true,
    features: [
      '3 camiones con tu branding',
      '1 power-up patrocinado',
      'Vallas + billboards',
      'Reporte semanal + dashboard',
      'Productos en marketplace',
    ],
  },
  {
    id: 'oro',
    name: 'Oro',
    price: '$2,500/mes',
    color: '#FFD700',
    borderColor: '#FFD700',
    features: [
      '5 camiones con tu branding',
      '3 power-ups patrocinados',
      'Todo lo de Plata +',
      'Pantalla de carga personalizada',
      'Push notifications con tu marca',
      'Reporte en tiempo real',
    ],
  },
];

export const valuePropositions = [
  {
    id: 1,
    title: 'Publicidad Inmersiva',
    description: 'Tu marca aparece integrada en el juego como parte del entorno. Los jugadores ven tu logo mientras se divierten, sin interrupciones.',
    stat: '89% recordacion de marca',
    icon: 'Eye',
    iconColor: '#F59E0B',
  },
  {
    id: 2,
    title: 'Audiencia Comprometida',
    description: 'Nuestros jugadores pasan un promedio de 25 minutos diarios en el juego. Tu marca esta presente en cada sesion.',
    stat: '25 min/dia promedio',
    icon: 'Users',
    iconColor: '#3B82F6',
  },
  {
    id: 3,
    title: 'Resultados Medibles',
    description: 'Dashboard completo con impresiones, clicks, redenciones y conversiones. ROI transparente y medible.',
    stat: 'CTR promedio: 4.2%',
    icon: 'BarChart3',
    iconColor: '#10B981',
  },
];

export const inGameFeatures = [
  { id: 1, icon: 'Truck', color: '#F59E0B', text: 'Tu logo aparece en los trailers que los jugadores esquivan' },
  { id: 2, icon: 'Zap', color: '#F59E0B', text: 'Power-ups con nombre de tu marca: "Boost Carga Express"' },
  { id: 3, icon: 'Image', color: '#3B82F6', text: 'Vallas publicitarias visibles en el fondo del juego' },
  { id: 4, icon: 'ShoppingBag', color: '#10B981', text: 'Tus productos disponibles para redencion con TicaMillas' },
];
