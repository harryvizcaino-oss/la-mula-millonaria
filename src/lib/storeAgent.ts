/**
 * Agente de Tienda MVP — reglas locales + feed RedPostventa.
 *
 * TODO(agent-omni): cablear Omni agent-first real (RPV) cuando exista endpoint
 * autenticado; hoy es 100% determinístico sobre CatalogProduct[].
 */

import type { CatalogProduct } from '@/lib/redpostventaCatalog';

/** Misma tasa que Marketplace: 1 COP = 10.000 TicaMillas. */
export const MILLAS_PER_COP = 10_000;

export interface StoreAgentContext {
  millas: number;
  cpsBalance: number;
  fleetId?: string;
  query?: string;
}

export type StoreAgentSuggestionKind = 'affordable' | 'almost' | 'near';

export interface StoreAgentSuggestion {
  kind: StoreAgentSuggestionKind;
  product: CatalogProduct;
  millasCost: number;
  /** Millas que faltan (solo kind === 'almost'). */
  shortfall?: number;
  /** Distancia absoluta al presupuesto (kind === 'near'). */
  gap?: number;
  reason: string;
}

export interface StoreAgentResult {
  affordable: StoreAgentSuggestion[];
  almost: StoreAgentSuggestion[];
  near: StoreAgentSuggestion[];
  /** Lista plana priorizada para UI (affordable → almost → near, sin duplicar id). */
  suggestions: StoreAgentSuggestion[];
}

function formatMillas(n: number): string {
  return Math.max(0, Math.floor(n)).toLocaleString('es-CO');
}

/** Costo en TicaMillas; `null` si no hay precio COP. */
export function millasCostOf(product: CatalogProduct): number | null {
  if (product.price == null || !Number.isFinite(product.price) || product.price < 0) return null;
  return Math.round(product.price * MILLAS_PER_COP);
}

function matchesQuery(product: CatalogProduct, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = `${product.name} ${product.brand} ${product.category} ${product.categories.join(' ')}`.toLowerCase();
  return hay.includes(q);
}

/** Soft bias: flota conocida → preferir catálogo de repuestos/camión en empates. */
function fleetAffinityScore(product: CatalogProduct, fleetId?: string): number {
  if (!fleetId) return 0;
  const hay = `${product.name} ${product.brand} ${product.category}`.toLowerCase();
  const brand = fleetId.toLowerCase().replace(/-/g, ' ');
  let score = 0;
  if (brand && hay.includes(brand)) score += 3;
  if (/(camion|camión|truck|repuesto|filtro|llanta|aceite|freno)/i.test(hay)) score += 1;
  return score;
}

/**
 * Sugerencias determinísticas a partir del balance y el catálogo.
 * - redimibles con millas actuales
 * - "te faltan X millas para Y"
 * - top 3 por cercanía de precio
 */
export function suggestStoreProducts(
  ctx: StoreAgentContext,
  products: CatalogProduct[],
): StoreAgentResult {
  const millas = Math.max(0, Math.floor(ctx.millas));
  const query = ctx.query?.trim() ?? '';

  // cpsBalance reservado para Omni / gift cards CPS; no inventamos lógica aquí.
  void ctx.cpsBalance;

  const priced = products
    .filter((p) => p.available !== false)
    .map((p) => {
      const cost = millasCostOf(p);
      if (cost == null || cost <= 0) return null;
      if (!matchesQuery(p, query)) return null;
      return { product: p, millasCost: cost };
    })
    .filter((x): x is { product: CatalogProduct; millasCost: number } => x != null);

  const affinity = (p: CatalogProduct) => fleetAffinityScore(p, ctx.fleetId);

  // 1) Asequibles: los más caros que aún caben (mejor uso del saldo).
  const affordable: StoreAgentSuggestion[] = priced
    .filter((x) => x.millasCost <= millas)
    .sort((a, b) => {
      const d = b.millasCost - a.millasCost;
      if (d !== 0) return d;
      return affinity(b.product) - affinity(a.product);
    })
    .slice(0, 5)
    .map((x) => ({
      kind: 'affordable' as const,
      product: x.product,
      millasCost: x.millasCost,
      reason: `Puedes redimirlo ahora · ${formatMillas(x.millasCost)} M`,
    }));

  // 2) Casi: te faltan X para Y (menor shortfall primero).
  const almost: StoreAgentSuggestion[] = priced
    .filter((x) => x.millasCost > millas)
    .map((x) => ({ ...x, shortfall: x.millasCost - millas }))
    .sort((a, b) => {
      const d = a.shortfall - b.shortfall;
      if (d !== 0) return d;
      return affinity(b.product) - affinity(a.product);
    })
    .slice(0, 5)
    .map((x) => ({
      kind: 'almost' as const,
      product: x.product,
      millasCost: x.millasCost,
      shortfall: x.shortfall,
      reason: `Te faltan ${formatMillas(x.shortfall)} millas para ${x.product.name}`,
    }));

  // 3) Top 3 por cercanía absoluta al presupuesto.
  const near: StoreAgentSuggestion[] = [...priced]
    .map((x) => ({ ...x, gap: Math.abs(x.millasCost - millas) }))
    .sort((a, b) => {
      const d = a.gap - b.gap;
      if (d !== 0) return d;
      return affinity(b.product) - affinity(a.product);
    })
    .slice(0, 3)
    .map((x) => ({
      kind: 'near' as const,
      product: x.product,
      millasCost: x.millasCost,
      gap: x.gap,
      reason:
        x.millasCost <= millas
          ? `Cercano a tu saldo · sobran ${formatMillas(millas - x.millasCost)} M`
          : `Cercano a tu saldo · faltan ${formatMillas(x.millasCost - millas)} M`,
    }));

  const seen = new Set<string>();
  const suggestions: StoreAgentSuggestion[] = [];
  for (const list of [affordable, almost, near]) {
    for (const s of list) {
      if (seen.has(s.product.id)) continue;
      seen.add(s.product.id);
      suggestions.push(s);
    }
  }

  return { affordable, almost, near, suggestions };
}
