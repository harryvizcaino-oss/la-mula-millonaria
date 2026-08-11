// Cliente del catálogo RedPostventa 2.0 (comercio agéntico).
//
// Fuente pública: GET {BASE}/api/agentic/feed?format=native
// Llamada DIRECTA desde el browser (CORS OK en prod) — sin Edge Function.
//
// Si la URL no está disponible o el fetch falla, las funciones devuelven
// `null` para que Marketplace/Home caigan a mocks sin ruido.

const DEFAULT_API_URL = 'https://eco20-web-production.up.railway.app';

/** Producto del feed nativo, mapeado a COP enteros. */
export interface CatalogProduct {
  id: string;
  name: string;
  brand: string;
  image: string | null;
  /** Precio en COP enteros (price_cents / 100). `null` si el feed no trae precio. */
  price: number | null;
  /** Precio de lista en COP enteros, si viene. */
  listPrice: number | null;
  available: boolean;
  /** Categoría principal (primera del array del feed). */
  category: string;
  /** Todas las categorías del feed (incluye la principal). */
  categories: string[];
  link: string;
  sku: string | null;
}

/** Alias preferido por el ecosistema RedPostventa. */
export type RedpostventaProduct = CatalogProduct;

export interface CatalogCategory {
  id: string;
  name: string;
}

export interface FetchCatalogOptions {
  /** Búsqueda de texto (`q=`). */
  query?: string;
  /** Índice inclusivo de inicio (slice local tras el feed). */
  from?: number;
  /** Índice inclusivo de fin (slice local tras el feed). */
  to?: number;
  /** Máximo de productos a pedir al feed (default 48). */
  limit?: number;
}

interface AgenticFeedProduct {
  id?: unknown;
  sku?: unknown;
  title?: unknown;
  name?: unknown;
  brand?: unknown;
  image_url?: unknown;
  image?: unknown;
  price_cents?: unknown;
  list_price_cents?: unknown;
  availability?: unknown;
  categories?: unknown;
  url?: unknown;
  link?: unknown;
}

interface AgenticFeedResponse {
  products?: unknown;
  total?: unknown;
}

function getApiBase(): string | null {
  const fromEnv = (import.meta.env.VITE_REDPOSTVENTA_API_URL as string | undefined)?.trim();
  const base = fromEnv || DEFAULT_API_URL;
  if (!base) return null;
  return base.replace(/\/+$/, '');
}

function centsToCop(cents: unknown): number | null {
  if (typeof cents !== 'number' || !Number.isFinite(cents)) return null;
  return Math.floor(cents / 100);
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mapAvailability(availability: unknown): boolean {
  if (typeof availability !== 'string') return false;
  const key = availability.toLowerCase();
  return key === 'in_stock' || key === 'available' || key === 'in stock';
}

function mapCategories(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c) => asString(c))
    .filter((c): c is string => c != null);
}

function mapProduct(raw: AgenticFeedProduct): CatalogProduct | null {
  const id = asString(raw.id) ?? asString(raw.sku);
  const name = asString(raw.title) ?? asString(raw.name);
  if (!id || !name) return null;

  const categories = mapCategories(raw.categories);
  const category = categories[0] ?? '';

  return {
    id,
    name,
    brand: asString(raw.brand) ?? '',
    image: asString(raw.image_url) ?? asString(raw.image),
    price: centsToCop(raw.price_cents),
    listPrice: centsToCop(raw.list_price_cents),
    available: mapAvailability(raw.availability),
    category,
    categories,
    link: asString(raw.url) ?? asString(raw.link) ?? '',
    sku: asString(raw.sku),
  };
}

function categoryIdFromName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'categoria';
}

/**
 * Deriva categorías únicas (nivel 1) a partir de productos ya mapeados.
 * No hay endpoint público de árbol de categorías en el feed agéntico.
 */
export function deriveCategories(products: CatalogProduct[]): CatalogCategory[] {
  const seen = new Map<string, CatalogCategory>();
  for (const p of products) {
    const name = p.category.trim();
    if (!name) continue;
    const id = categoryIdFromName(name);
    if (!seen.has(id)) seen.set(id, { id, name });
  }
  return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

/**
 * Productos del catálogo real vía feed agéntico.
 * `null` = catálogo no disponible (usar mocks).
 */
export async function fetchCatalogProducts(
  opts: FetchCatalogOptions = {},
): Promise<{ products: CatalogProduct[]; total: number } | null> {
  const base = getApiBase();
  if (!base) return null;

  const params = new URLSearchParams({ format: 'native' });
  const limitFromRange =
    opts.from != null && opts.to != null ? Math.max(1, opts.to - opts.from + 1) : undefined;
  const limit = opts.limit ?? limitFromRange ?? 48;
  params.set('limit', String(Math.max(1, Math.min(limit, 200))));
  if (opts.query?.trim()) params.set('q', opts.query.trim());

  try {
    const res = await fetch(`${base}/api/agentic/feed?${params.toString()}`);
    if (!res.ok) return null;

    const data = (await res.json()) as AgenticFeedResponse;
    if (!Array.isArray(data.products)) return null;

    const products: CatalogProduct[] = [];
    for (const item of data.products) {
      if (!item || typeof item !== 'object') continue;
      const mapped = mapProduct(item as AgenticFeedProduct);
      if (mapped) products.push(mapped);
    }

    const sliced =
      opts.from != null || opts.to != null
        ? products.slice(opts.from ?? 0, (opts.to ?? products.length - 1) + 1)
        : products;

    const total =
      typeof data.total === 'number' && Number.isFinite(data.total)
        ? data.total
        : sliced.length;

    return { products: sliced, total };
  } catch {
    return null;
  }
}

/**
 * Categorías públicas.
 * No hay endpoint simple de árbol; pide un lote al feed y deriva nombres únicos.
 * `null` si el feed no responde.
 */
export async function fetchCatalogCategories(
  opts: Pick<FetchCatalogOptions, 'limit'> = {},
): Promise<CatalogCategory[] | null> {
  const result = await fetchCatalogProducts({ limit: opts.limit ?? 100 });
  if (!result) return null;
  return deriveCategories(result.products);
}

/** Alias semánticos para el cableado Marketplace/Home. */
export const fetchRedpostventaProducts = fetchCatalogProducts;
export const fetchRedpostventaCategories = fetchCatalogCategories;
