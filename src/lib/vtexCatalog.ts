// Cliente del catálogo VTEX de redpostventa.com vía la Supabase Edge
// Function `vtex-catalog` (proxy — la API de VTEX no permite CORS).
//
// Si Supabase no está configurado o la función no responde, todas las
// funciones devuelven `null` y el Marketplace cae a `mockProducts`.
// Spec completa: tasks/T8-vtex-catalog.md

import { isSupabaseConfigured } from '@/lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export interface VtexProduct {
  id: string;
  name: string;
  brand: string;
  image: string | null;
  price: number | null; // COP
  available: number | null;
  category: string;
  link: string;
}

export interface VtexCategory {
  id: number;
  name: string;
  children: VtexCategory[];
}

interface FetchProductsOptions {
  query?: string;
  categoryId?: string;
  from?: number;
  to?: number;
}

async function callFunction<T>(params: URLSearchParams): Promise<T | null> {
  if (!isSupabaseConfigured || !SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/vtex-catalog?${params}`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Productos del catálogo real. `null` = catálogo no disponible (usar mocks). */
export async function fetchVtexProducts(
  opts: FetchProductsOptions = {},
): Promise<{ products: VtexProduct[]; total: number } | null> {
  const params = new URLSearchParams({ path: 'products' });
  if (opts.query) params.set('ft', opts.query);
  if (opts.categoryId) params.set('category', opts.categoryId);
  if (opts.from != null) params.set('from', String(opts.from));
  if (opts.to != null) params.set('to', String(opts.to));
  return callFunction(params);
}

/** Árbol de categorías de la tienda. `null` = no disponible. */
export async function fetchVtexCategories(): Promise<VtexCategory[] | null> {
  return callFunction(new URLSearchParams({ path: 'categories' }));
}
