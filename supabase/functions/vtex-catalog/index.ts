// Supabase Edge Function: vtex-catalog
// Proxy read-only al catálogo público de redpostventa.com (VTEX).
// La API de VTEX no envía CORS headers, así que el navegador no puede
// llamarla directo — esta función hace de intermediario y devuelve un
// JSON slim con CORS abierto y cache de 5 minutos (igual que VTEX).
//
// Uso:
//   GET /vtex-catalog?path=products&ft=texto&category=1062317&from=0&to=10
//   GET /vtex-catalog?path=categories
//
// Despliegue: ver tasks/T8-vtex-catalog.md

const VTEX_BASE = 'https://www.redpostventa.com/api/catalog_system/pub';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SlimProduct {
  id: string;
  name: string;
  brand: string;
  image: string | null;
  price: number | null;
  available: number | null;
  category: string;
  link: string;
  skuId: string | null;
  sellerId: string | null;
}

// La tienda tiene productos con datos corruptos que hacen que VTEX
// responda 500 con un string en vez del array — se tolera y se devuelve [].
function toSlimProducts(raw: unknown): SlimProduct[] {
  if (!Array.isArray(raw)) return [];
  const out: SlimProduct[] = [];
  for (const p of raw) {
    if (typeof p !== 'object' || p === null) continue;
    const item = p.items?.[0];
    const seller = item?.sellers?.[0] ?? {};
    const offer = seller?.commertialOffer ?? {};
    const categories = Array.isArray(p.categories)
      ? p.categories.filter((c: unknown) => typeof c === 'string')
      : [];
    out.push({
      id: String(p.productId ?? ''),
      name: String(p.productName ?? ''),
      brand: String(p.brand ?? ''),
      image: item?.images?.[0]?.imageUrl ?? null,
      price: typeof offer.Price === 'number' ? offer.Price : null,
      available: typeof offer.AvailableQuantity === 'number' ? offer.AvailableQuantity : null,
      category: categories[0]?.replace(/^\/|\/$/g, '') ?? '',
      link: String(p.link ?? ''),
      skuId: item?.itemId != null ? String(item.itemId) : null,
      sellerId: seller?.sellerId != null ? String(seller.sellerId) : null,
    });
  }
  return out;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  const url = new URL(req.url);
  const path = url.searchParams.get('path') ?? 'products';

  try {
    if (path === 'categories') {
      const res = await fetch(`${VTEX_BASE}/category/tree/3`);
      if (!res.ok) return json({ error: `VTEX ${res.status}` }, 502);
      return json(await res.json());
    }

    // path=products — paginación acotada: rangos grandes rompen VTEX en esta tienda
    const from = Math.max(0, Number(url.searchParams.get('from') ?? '0') || 0);
    const to = Math.min(from + 10, Math.max(from, Number(url.searchParams.get('to') ?? String(from + 10)) || from + 10));
    const params = new URLSearchParams({ _from: String(from), _to: String(to) });
    const ft = url.searchParams.get('ft')?.trim();
    if (ft) params.set('ft', ft);
    const category = url.searchParams.get('category')?.trim();
    if (category) params.set('fq', `C:/${category}/`);

    const res = await fetch(`${VTEX_BASE}/products/search?${params}`);
    if (!res.ok && res.status !== 206) return json({ products: [], total: 0 });
    const products = toSlimProducts(await res.json());
    const total = Number(res.headers.get('resources')?.split('/')[1] ?? products.length) || products.length;
    return json({ products, total });
  } catch (err) {
    return json({ error: String(err) }, 502);
  }
});
