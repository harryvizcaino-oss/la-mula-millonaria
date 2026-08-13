# Pendientes externos — La Mula Millonaria

Dependencias **fuera del código del juego**: contratos, consolas, secretos y apps de terceros. El cableado in-app (banner, Recargar, mock checkout, rewarded timer) ya existe; esto es lo que falta para producción real.

**Actualizado:** 13 ago 2026

---

## Resumen

| # | Pri | Ítem | Bloqueo | Env / consola |
|---|-----|------|---------|----------------|
| 1 | P0 | **Google AdSense / Ad Manager** (web) | Cuenta publisher + unidades de anuncio + política de contenido | `VITE_ADSENSE_CLIENT` |
| 2 | P0 | **Credibanco live** (mismo merchant RPV o comercio “Mula”) | Contrato adquirente + sandbox QA | BFF, no Vite |
| 3 | P0 | **BFF checkout IAP** | Endpoint que crea orden + sesión hosted Credibanco | `VITE_IAP_CHECKOUT_URL` |
| 4 | P0 | **Supabase `011_iap_entitlements.sql`** | `db push` al proyecto del juego | columnas `ad_free_until`, tabla `iap_orders` |
| 5 | P1 | **Google AdMob** (si hay app nativa / WebView) | App AdMob + IDs banner/interstitial/rewarded | distinto de AdSense web |
| 6 | P1 | **AdSense Rewarded / Ad Manager rewarded** | Unidad rewarded + SDK; hoy el rewarded es timer 5s | `src/lib/rewardedAd.ts` |
| 7 | P1 | **Apple IAP / Google Play Billing** | Solo si hay App Store / Play; **no** Credibanco para moneda virtual | SKUs `mula.*` |
| 8 | P2 | **Firebase Cloud Messaging** (push real) | Hoy Notification API local, sin SW | reemplaza F11 |
| 9 | P2 | **GA4 / Firebase Analytics** | Eventos `iap_paid`, `ad_impression`, `ad_reward` | medición ARPU |
| 10 | P2 | **House ads RPV** (opcional fill) | Slot CMS / feed promocional eco20 | si AdSense no llena |

---

## 1. Google Ads (web) — P0

Red de anuncios para la **versión con ads** (banner `/game` + interstitial). Ad-free no carga red.

| Campo | Detalle |
|-------|---------|
| **Producto Google** | **AdSense** (sitio) o **Google Ad Manager** (GAM) si hay inventario propio / house ads. **AdMob** solo si envuelves en app. |
| **Qué hay en código** | `GameAdBanner` (50px, `data-ad` si hay client), `InterstitialAd` house, `VITE_ADSENSE_CLIENT`. Sin script AdSense real todavía. |
| **Qué falta** | 1) Cuenta AdSense/GAM aprobada (sitio `lamula…` / dominio Vercel). 2) Unidades: **display 320×50** (banner juego) + **interstitial** (o display 300×250 a pantalla completa). 3) Política: contenido de juego + IAP; no ads en menores si no hay age gate. 4) Pegar `ca-pub-…` en `VITE_ADSENSE_CLIENT` (Vercel). 5) Sustituir house ad cuando el slot llene. |
| **Quién** | Ads / marketing + dueño del dominio. |
| **Criterio OK** | Impresiones reales en `/game`; 0 impresiones si `iapStore.isAdFree()`; rewarded opt-in separado. |

**No mezclar:** AdSense (web) ≠ AdMob (app). Si hay Capacitor/Play, hay que pedir **otra** app AdMob y cumplir políticas de ads + IAP.

---

## 2–4. Pagos reales (Credibanco + BFF + DB)

Mismo PSP que RedPostventa. Secretos **nunca** en Vite.

| Pieza | Dónde |
|-------|--------|
| Hosted checkout + webhook HMAC | Monorepo RPV `docs/PAGOS-CREDIBANCO.md` o BFF propio del juego |
| Cliente juego | `POST VITE_IAP_CHECKOUT_URL` `{ skuId }` + bearer Supabase → `{ checkoutUrl }` |
| Acreditación | Webhook `paid` → `fulfillSku` / `iap_orders.status` + `game_state.ad_free_until` (service role) |
| Sandbox hoy | URL vacía → mock 800 ms local |

Credibanco RPV sigue en stub (`CREDIBANCO_SKIP_NETWORK`) hasta contrato. Ver `docs/PENDIENTES-APIS-EXTERNAS.md` en REDPOSTVENTA-2.0.

**Aplicar migración:** `supabase db push` de `011_iap_entitlements.sql` en el proyecto Supabase del **juego**.

---

## 5–7. App nativa (cuando exista)

| Store | Qué usar | Qué no |
|-------|----------|--------|
| iOS App Store | StoreKit IAP para 🎟️, ad-free, pases | Credibanco para bienes virtuales (rechazo review) |
| Google Play | Play Billing | Igual: IAP para digital goods |
| Web / PWA | Credibanco hosted | AdSense |

SKUs estables: `mula.tickets.50`, `mula.adfree.30`, `mula.season.premium`, etc. (`src/data/iapSkus.ts`). Adapter `credibanco | app_store | play_billing`.

---

## 8–10. Otros terceros (no bloquean MVP web)

- **FCM + service worker:** push fuera de la pestaña (racha, liga). Hoy solo Notification API local.
- **GA4:** medir fill de ads vs churn y conversión Recargar.
- **Fill de ads:** si AdSense no aprueba o eCPM bajo, house ads a catálogo RPV (`houseAd` en `adsConfig.ts`).

---

## No son pendientes externos (ya in-app)

Catálogo agentic RPV (`VITE_REDPOSTVENTA_API_URL`), auth Google/Apple (Supabase, docs `GOOGLE_OAUTH_SETUP.md`), rewarded **simulado**, Recargar UI, banner house, flag ad-free local.
