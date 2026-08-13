export type IapSkuKind = 'tickets' | 'ad_free' | 'season_premium' | 'starter';
export type IapSkuBadge = 'best' | 'once';

export interface IapSku {
  id: string;
  kind: IapSkuKind;
  title: string;
  subtitle: string;
  priceCop: number;
  tickets?: number;
  lootBox?: number;
  adFreeDays?: number | 'lifetime';
  badge?: IapSkuBadge;
}

export const IAP_SKUS: IapSku[] = [
  {
    id: 'mula.tickets.50',
    kind: 'tickets',
    title: '50 Tickets Dorados',
    subtitle: 'Paquete chico',
    priceCop: 4900,
    tickets: 50,
  },
  {
    id: 'mula.tickets.150',
    kind: 'tickets',
    title: '150 Tickets Dorados',
    subtitle: 'Mejor precio por ticket',
    priceCop: 11900,
    tickets: 150,
    badge: 'best',
  },
  {
    id: 'mula.tickets.400',
    kind: 'tickets',
    title: '400 Tickets Dorados',
    subtitle: 'Paquete grande',
    priceCop: 24900,
    tickets: 400,
  },
  {
    id: 'mula.tickets.1000',
    kind: 'tickets',
    title: '1.000 Tickets + Caja',
    subtitle: 'Incluye 1 caja de loot',
    priceCop: 49900,
    tickets: 1000,
    lootBox: 1,
  },
  {
    id: 'mula.starter',
    kind: 'starter',
    title: 'Pack de inicio',
    subtitle: '80 tickets, una sola vez',
    priceCop: 7900,
    tickets: 80,
    badge: 'once',
  },
  {
    id: 'mula.adfree.30',
    kind: 'ad_free',
    title: 'Sin anuncios 30 días',
    subtitle: 'Quita banners e interstitials',
    priceCop: 9900,
    adFreeDays: 30,
  },
  {
    id: 'mula.adfree.life',
    kind: 'ad_free',
    title: 'Sin anuncios de por vida',
    subtitle: 'Pago único',
    priceCop: 29900,
    adFreeDays: 'lifetime',
  },
  {
    id: 'mula.season.premium',
    kind: 'season_premium',
    title: 'Pase Premium — Ruta Nacional',
    subtitle: 'Desbloquea el track premium de la temporada',
    priceCop: 14900,
  },
];

export function getIapSku(id: string): IapSku | undefined {
  return IAP_SKUS.find((sku) => sku.id === id);
}

export function formatCop(n: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);
}
