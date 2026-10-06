/**
 * Resolución de assets de imagen con formato optimizado.
 *
 * Los PNG pesados (camiones, logos, badges, efectos) se pre-convirtieron a
 * AVIF en `public/assets-avif` (misma ruta relativa a public/, extensión .avif).
 * `assetUrl` prefiere AVIF cuando el navegador lo soporta y cae al PNG original
 * en caso contrario, de modo que no hay que tocar cada referencia de imagen.
 *
 * AVIF está soportado por todos los navegadores modernos (Chrome 85+,
 * Firefox 93+, Safari 16.4+). El fallback cubre navegadores viejos.
 */

const AVIF_SUPPORTED =
  typeof document !== 'undefined' &&
  (() => {
    try {
      return document.createElement('canvas').toDataURL('image/avif').indexOf('data:image/avif') === 0;
    } catch {
      return false;
    }
  })();

/**
 * Mapea una ruta absoluta bajo `public/` a su variante AVIF en `public/assets-avif`.
 * Ej. `/assets/camion.png` → `/assets-avif/assets/camion.avif`
 *     `/brand-logo-norte.png` → `/assets-avif/brand-logo-norte.avif`
 */
function toAvif(path: string): string {
  const withoutSlash = path.replace(/^\/+/, '');
  return `/assets-avif/${withoutSlash.replace(/\.png$/i, '.avif')}`;
}

/** Devuelve la URL AVIF si el navegador la soporta; si no, la original. */
export function assetUrl(path: string): string {
  if (!AVIF_SUPPORTED || !/\.png$/i.test(path)) return path;
  return toAvif(path);
}
