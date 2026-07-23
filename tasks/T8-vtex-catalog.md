# T8 — Catálogo VTEX real en la Tienda

**Decisión de producto (2026-07-22, v2):** el Marketplace muestra el catálogo real de redpostventa.com (VTEX). El costo en TicaMillas se **deriva del precio COP a la tasa de redención de efectivo** (`MILLAS_PER_COP = 10_000` — una llanta de $2M COP cuesta ~20.000M millas). Modelo de negocio: el juego monetiza con publicidad; los productos reales son objetivos aspiracionales de muy largo plazo que sostienen la retención, y la moneda del juego se gasta principalmente en consumibles in-game. (Supersede la decisión v1 de precios curados a mano.) El canje sigue siendo client-side como hoy.

## Hallazgos de la API VTEX

- Base pública: `https://www.redpostventa.com/api/catalog_system/pub`
- Productos: `GET /products/search?_from=0&_to=10[&ft=texto][&fq=C:/<categoryId>/]` → JSON array (HTTP 206, header `resources: from-to/total`).
- Categorías: `GET /category/tree/3` → árbol con `id`, `name`, `children`.
- **Quirks de esta tienda (blindar el cliente contra esto):**
  - `_to >= 14` (y algunos rangos como `_from=11`) responden **500 con un string** (`"Object reference not set..."`) en vez de array. La tienda tiene productos con datos corruptos del lado de VTEX.
  - Total reportado: 16 productos; solo 11 responden bien hoy (todos llantas TBR, $1.16M–$2.38M COP).
- **CORS:** la API no envía `Access-Control-Allow-Origin` → el navegador NO puede llamarla directo. Se requiere proxy.

## Arquitectura

```
Marketplace.tsx → src/lib/vtexCatalog.ts → Supabase Edge Function `vtex-catalog` → API VTEX
                                              (proxy + slim mapping + CORS + cache 300s)
```

- **Edge Function:** `supabase/functions/vtex-catalog/index.ts`. Pública (read-only), devuelve JSON slim: `{ id, name, brand, image, price, available, category, link }` o el árbol de categorías. Tolera los 500 de VTEX devolviendo lo que haya.
- **Cliente:** `src/lib/vtexCatalog.ts`. Si no hay `VITE_SUPABASE_URL` o la función falla → devuelve `null` y Marketplace cae a `mockProducts` (comportamiento offline actual, intacto).
- **Precio en millas:** derivado en `Marketplace.tsx` (`MILLAS_PER_COP = 10_000`, la tasa de redención de efectivo). Producto sin precio COP: se muestra pero no se puede redimir ("Solo en redpostventa.com").

## Despliegue de la Edge Function (manual, una vez)

```bash
npm i -g supabase            # o: brew install supabase/tap/supabase
supabase login
supabase link --project-ref <tu-project-ref>   # el de VITE_SUPABASE_URL
supabase functions deploy vtex-catalog
```

Sin función desplegada la Tienda sigue funcionando con mocks (no rompe nada).

## Criterios de aceptación

- [x] La Tienda lista productos reales con foto, marca y precio COP.
- [x] El buscador filtra vía `ft=` y las pestañas de categoría vía `fq=C:/id/`.
- [x] Productos con precio curado se redimen con millas por el flujo existente (`/redemption`).
- [x] Productos sin precio curado muestran estado no-redimible.
- [x] Sin Supabase configurado o con la función caída: cae a mocks sin errores en consola.
- [x] Paleta rojo/blanco/gris/negro intacta; diseño visual de las cards sin cambios.
