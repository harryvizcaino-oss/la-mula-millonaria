# AGENTS.md — La Mula Millonaria (Trucker Surfers Clicker)

## Project Overview

- **App name:** La Mula Millonaria
- **Repository:** `Documents/trucker-surfers/app`
- **Stack:** React 19 + TypeScript + Vite 7 + Tailwind CSS + Zustand + Framer Motion + Supabase (auth + Postgres)
- **Router:** `BrowserRouter` → routes like `/game`
- **Local dev:** `npm run dev` (serves on `http://localhost:3000/`)
- **Build:** `npm run build` (Vite build estático a `dist/public`)
- **Start (Railway):** `npm start` → `vite preview` sirviendo `dist/public` (frontend 100% estático; no hay servidor de API)
- **Type-check:** `npx tsc -b` (limpio, 0 errores)

## Game Logic (Clicker)

The clicker is a **per-click CPS economy** (NOT idle production per second). The currency is **CPS**: `cpsBalance` (spendable) and `cpsTotal` (historical, never decreases — feeds the ranking).

### Core Formula

```ts
cpsPerClick = (3 + sum(powerCPS)) * fleetMultiplier * upgradeMults * starMultiplier
powerCPS    = powerLevel * baseCPS * brandMultiplier   // brand = tier actual del poder
```

- Base click: `3` CPS.
- Powers: 10 sponsor powers, each up to 100 levels. Cost scales `baseCost * 1.15^level`, paid with **CPS** (`cpsBalance`).
- Brand tiers: every 10 levels the power switches to a new sponsor brand (10 tiers). The tier's `multiplier` multiplies that power's CPS.
- Fleet: 10 real truck brands. Each is a **multiplier (×)**, bought once with **Golden Tickets** (`goldenTickets`), stored as `fleetOwned: string[]` + `selectedFleet: string`. Buying auto-equips; `selectFleet` switches among owned.
- Player Level = SUM of all power levels (badge `Nv X` in header).
- Upgrade multipliers (`clickerUpgrades.ts`, types `click`/`global`) and prestige stars (`1 + stars * 0.01`) apply as external multipliers.
- **Displayed header:** `clickPower * activeClickMultiplier` (CPS frenzy multiplier).

### Sponsor Powers (`src/data/sponsorPowers.ts`)

| Power | baseCPS | baseCost |
|---|---|---|
| Filtro de Aire | 1 | 15 |
| Turbo Diésel | 3 | 120 |
| Suspensión | 8 | 960 |
| Motor V8 | 20 | 7.680 |
| Frenos ABS | 49 | 61.440 |
| Refrigeración | 122 | 491.520 |
| Embrague HD | 305 | 3.932.160 |
| Dirección | 762 | 31.457.280 |
| Alternador | 1.907 | 251.658.240 |
| Scanner | 4.768 | 2.013.265.920 |

Helpers: `getBrandTier(power, level)`, `getSponsorPowerCost`, `getSponsorPowerCPS`, `getTierProgress`. `MAX_SPONSOR_LEVEL = 100`, `LEVELS_PER_TIER = 10`.

### Fleet Vehicles (`src/data/fleetVehicles.ts`)

CHEVROLET ×1 (default, 0 🎟️), FREIGHTLINER ×1.5 (5), KENWORTH ×2 (15), VOLVO ×3 (40), SCANIA ×4.5 (100), MERCEDES-BENZ ×7 (250), INTERNATIONAL ×10 (600), DAF ×15 (1.500), FOTON ×25 (4.000), TESLA Semi ×50 (10.000).

### Tier-Change Animation (`src/components/game/SponsorPowerCard.tsx`)

On brand tier up: gold flash 300ms → brand name types letter by letter (dentro del `.brand-hero-badge`) → transición de color del badge/badge circular 500ms → gold confetti (`canvas-confetti`) → BOOM overlay (`BoomEffect`, disparado por el padre) → toast `Nueva marca desbloqueada: [BRAND]!`.

### BOOM Effect (`src/components/game/BoomEffect.tsx`)

V2: al comprar cualquier nivel de poder (y reforzado al cambiar de tier) se muestra un overlay `pointer-events: none` con el PNG `efecto_boom_poder_activado.png` (scale 0.3→1.2→1→1.5, opacity 0→1→1→0, 1.2s), screen flash dorado y confetti de 20-30 cuadrados de colores (`canvas-confetti`, `shapes: ['square']`). El padre (`Game.tsx`) pasa `trigger={{ id, tierUp }}` vía estado `boom`.

### Multiplier (CPS Frenzy)

- Cycle: 5 seconds.
- Threshold: 40 clicks per cycle.
- Each 40 clicks gained in a cycle adds +1 multiplier level.
- If under 40 clicks in a cycle, level decays by 1 (min 1).
- Counts clicks on the truck AND golden ticket collectibles.
- Badge is red, shows `xN`, no text label.
- Frenzy/combo/nitro/etc. multipliers also feed `cpsBalance`/`cpsTotal` via `store.addEarnings(extra)` after each click.

### Autoclick Superpower

- Purchased with **CPS** (`buyAutoclick()` checks and deducts `cpsBalance` internally).
- Cost: `5000 * 4^autoclickLevel`.
- Duration: `min(120000, 15000 + (level + 1) * 5000)` ms.
- Loop in `src/pages/Game.tsx` uses a `ref` for `handleTruckClick` so the interval is not destroyed on every simulated click.

### Money / CPS / Millas

- `useClickerStore` tracks `cpsBalance`, `cpsTotal`, `totalEarned`, `totalClicks`, `goldenTickets`, etc.
- `MillasProvider` (`src/providers/MillasProvider.tsx`) still holds parallel spendable `millas` (TicaMillas) used by the Marketplace cash redemption; clicks feed both economies.
- Production per second is 0; `ClickerEngine` is kept for compatibility/offline earnings but no longer adds idle income.

### Golden Tickets

- Floating collectible in `Game.tsx`.
- Spawn chance per click: `min(0.25, clicksSinceTicket * 0.0075)`.
- This is the **harder** spawn rate (halved from the original `0.015`).
- Each collected ticket gives `1` golden ticket.
- Tickets buy fleet vehicles and can be redeemed in the Marketplace for COP gift cards (see below).

## Storage Keys (Reset Strategy)

To force a reset, bump these keys:

- Millas: `truckSurfers_millas_v3`
- Clicker store: `truckSurfers_clicker_v5` (bumped to v5 for the CPS/brand/fleet model)

After changing keys, users must hard-refresh (`Cmd + Shift + R`) to discard old persisted state.

## Important Files

| File | Responsibility |
|---|---|
| `src/pages/Game.tsx` | Main clicker UI, click handler, autoclick loop, tabs (Poderes/Flota/Ascensión) |
| `src/store/clickerStore.ts` | Zustand store: sponsor powers, fleet, CPS economy, prestige, clickPower calculation |
| `src/data/sponsorPowers.ts` | 10 brand-sponsor powers × 10 brand tiers, costs, CPS helpers |
| `src/data/fleetVehicles.ts` | 10 real truck brands: multipliers and golden-ticket costs |
| `src/data/clickerUpgrades.ts` | Click/global upgrades (legacy multipliers, still applied) |
| `src/components/game/SponsorPowerCard.tsx` | Power card V8 (horizontal glossy 90px): badge circular 56px + título + MARCA HERO TEXT_BADGE 22px + stats `+N verdes` / costo + círculo de nivel glossy 40px (`level-circle-v8`, color del tier, "Nv"+número, pulsa al comprar) + buy button glossy 48px + tier-change animation |
| `src/components/game/BoomEffect.tsx` | Overlay BOOM al comprar poder/tier: PNG explosión + flash dorado + confetti cuadrados |
| `src/components/game/FleetVehicleCard.tsx` | Fleet card with ×multiplier and ticket cost |
| `src/components/game/FloatingNumber.tsx` | "+N" floating number at click point (1s CSS animation, self-dismiss) |
| `src/styles/ui-fixes.css` | UI fixes: floating numbers, truck assets, sponsor card V8, THICK milestone bar, epic power buttons, glossy tabs, game header |
| `src/providers/MillasProvider.tsx` | Spendable millas context + persistence |
| `src/components/ClickerEngine.tsx` | Legacy production loop (currently no-op for income) |
| `src/App.tsx` | Routes + mounts `ClickerEngine` |
| `src/pages/Marketplace.tsx` | Store + cash redemption (Gift Card) + VTEX gift cards (CPS) |
| `src/pages/Profile.tsx` | User profile page |
| `src/components/Navbar.tsx` | Bottom nav: Inicio, Ranking, Jugar, Tienda, Perfil |

## Server Sync (Supabase)

- **Auth:** Supabase Auth (OAuth Google/Apple, PKCE) reemplazó a Clerk en el frontend. `src/lib/auth.ts` expone `signInWithGoogle/signInWithApple/getCurrentUser/signOut`; `src/hooks/useAuth.ts` mantiene la interfaz `{ user: { id, name, email, avatar }, isAuthenticated, isLoading, logout, refresh }` que consumen las páginas. Callback OAuth en `/auth/callback` (`src/pages/AuthCallback.tsx`). Perfil + `game_state` se crean con el trigger `handle_new_user` (fallback client-side: `ensureUserRecords`).
- **Backend:** Supabase Postgres. Esquema en `supabase/migrations/001_initial_schema.sql`: `profiles`, `game_state`, `leaderboard_global`, `transactions`, `friends` (RLS en todas) + función `update_leaderboard()` (RPC) y trigger que la corre en cada cambio de `cps_total`. Env vars: `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (sin ellas la app corre offline/anónima). El backend legacy tRPC/MySQL/Clerk (`api/`, `db/`, drizzle) fue eliminado por completo (T3/T4); el frontend es 100% estático + Supabase.
- **Game sync (`src/lib/gameSync.ts` + `useClickerSync`):** upsert del snapshot a `game_state` con **debounce de 5s** (`store.debouncedSave`), carga al iniciar sesión (`store.loadFromSupabase` → `hydrate`), flush en `beforeunload`/`visibilitychange`. Mapping: `cps` = cpsBalance, `cps_total` = cpsTotal (ranking, nunca baja — el servidor conserva `greatest()`), `power_levels`, `fleet_unlocked`, `active_fleet_id`, `upgrades`, `total_clicks`, `total_earned`, `stars`, `ascensions`, `autoclick_level`, `last_tick_at`, `streak_days`, `last_claim_date`. La columna `millas` la escribe solo MillasProvider (upsert parcial, mismo debounce 5s).
- **Offline:** Zustand/localStorage es la fuente de verdad en tiempo real. Los guardados que fallan se encolan en localStorage (`truckSurfers_sync_queue_v1`, coalesced por usuario+kind, `src/lib/offlineQueue.ts`) y se reenvían con el evento `online`.
- **Leaderboard:** `src/pages/Leaderboard.tsx` lee `leaderboard_global` (top 50 por `cps_total`) con suscripción Realtime (`postgres_changes`) + poll de 30s de respaldo; cae a `mockPlayers` si está vacío/no configurado.
- **Transactions (`src/lib/transactions.ts`):** helper único sobre la tabla `transactions` (RLS: el dueño lee/inserta las suyas). `fetchTransactions(userId, limit)` (orden `created_at` desc) y `recordTransaction({ type, amount, description })` (best-effort: no-op sin config/sesión). Convención: `amount` positivo y el signo lo da `type` (`'spend'` = gasto; `'earn'/'reward'/'iap'/'ad'` = ingreso). `Profile` lee su historial y stats (`game_state.total_clicks/total_earned` + rank de `leaderboard_global`) desde Supabase; `Redemption` deduce millas vía MillasProvider, genera el gift card code en cliente y registra el `spend`.

## Marketplace / Tienda

- **URL:** `/#/marketplace`
- **Color palette:** restricted to red, white, grays, and blacks (matching `www.redpostventa.com` brand feel).
  - Primary red: `#ff3131`
  - Light red: `#ff4c4c`
  - Dark red: `#b91c1c`
  - Blacks: `#0D0E14`, `#1A1B26`, `#232433`
  - Grays: Tailwind `slate` scale
  - White
- **Layout order (top to bottom):**
  1. Balance pill row: fila compacta de pills (~36px) bajo el título "Tienda" — TicaMillas (M roja), 🎟️ Golden Tickets, ⚡ CPS, $ COP disponible (valores en formato compacto es-CO vía `formatCompact`).
  2. Card única "Redime" con tabs pill (activo rojo sólido, inactivo gris): tab "Efectivo" (redención de efectivo) y tab "Gift Cards CPS" (grid VTEX).
  3. Search bar (sticky at `top-14`).
  4. Category tabs.
  5. Product grid: cards horizontales densas (1 por fila en mobile, `sm:grid-cols-2`) — foto 68px a la izquierda, nombre/marca/precio (COP tachado + millas rojas) al centro, indicador compacto de asequibilidad a la derecha y barra fina de progreso (3px) al pie.
  6. Promo banners (después del grid para que el catálogo real aparezca en la primera pantalla).
- **VTEX gift cards (redpostventa.com):** $10 (100K CPS), $25 (250K), $50 (500K), $100 (1M), $250 (2.5M). Redeeming calls `store.redeemCps(cost)` — only `cpsBalance` decreases; `cpsTotal` (ranking) is untouched.
- **Cash redemption:**
  - Conversion: `100.000.000 TicaMillas = $10.000 COP`.
  - Golden Tickets convert through their existing `1 ticket = 1.000 TicaMillas` rate.
  - User inputs how many Millas and/or Tickets to redeem.
  - System deducts the selected amounts and generates a Gift Card code shown in a modal.
- Product redemption still exists below; tapping a product opens the detail bottom sheet and then `/redemption`.
- **Real VTEX catalog:** the product grid is fed by the real redpostventa.com catalog via `src/lib/vtexCatalog.ts` (Supabase Edge Function `vtex-catalog`). If Supabase is not configured or the function fails, it falls back to `mockProducts` silently (no console errors). Search → `ft=`, category tabs → VTEX level-1 tree (`categoryId`).
- TicaMillas cost for real products is **derived from the COP price at the cash redemption rate** (`MILLAS_PER_COP = 10_000` in `Marketplace.tsx` → a $2M COP tire costs ~20.000M millas). Business decision (2026-07-22, supersedes the earlier hand-curated map): real products are long-term aspirational goals that drive retention (revenue comes from ads), NOT quick redemptions; in-game currency is primarily spent on in-game consumables. Products without a COP price are shown but NOT redeemable (CTA "Solo en redpostventa.com").

## Navigation (Bottom Navbar)

Items in order:
1. Inicio (`/`)
2. Ranking (`/leaderboard`)
3. Jugar (`/game`) — center elevated button
4. Tienda (`/marketplace`)
5. Perfil (`/profile`)

**Mi Empresa was removed.** The previous `/empresa` route, page, terrain data, and store state no longer exist. The terrain/building feature was deleted.

**Navbar oscura glass (V9):** la barra es oscura en TODAS las páginas — `bg-[#0D0E14]/85 backdrop-blur-xl border-t border-white/10`. Ítems inactivos `text-slate-400` (`.nav-item-inactive` #94A3B8, hover slate-200), activo dorado #F59E0B (ícono + label + dot `.nav-dot` con glow dorado). Botón central Jugar conserva el gradiente dorado y glow; su label es `text-slate-400`.

## UI Conventions

- **Fuente única (V9):** toda la app usa **Fredoka** (Google Fonts, weights 400-700, cargada en `index.html`). Se eliminaron Inter, Baloo 2, Space Mono y JetBrains Mono; en `tailwind.config.js` las clases `font-fredoka`, `font-inter` y `font-mono` apuntan todas a Fredoka para no renombrar clases existentes, y el body base (`src/index.css`) también. NO reintroducir otras fuentes.

- **Sin header en `/game` (V2):** el fondo llega al borde superior y `TopAppBar` devuelve `null` en esa ruta. En su lugar hay indicadores flotantes (`position: absolute; top: 12px`, `.float-pill`, Space Mono 12px 600, blur 8px): 🎟️ tickets (roja) | 💵 balance (dorada) | ⚡ `+X` (verde) | 👑 `#rank` (naranja, + badge `⭐xN` de ascensión cuando aplica). Valores en formato compacto (`formatNumber`), valor completo en `title`. **V8:** ningún número de la pantalla de juego lleva el sufijo "CPS" (solo emoji + número).
- Arena (V8): `h-[100dvh]` (background full-screen, `rounded-b-[2rem]`), fondo según flota seleccionada (V2-4, crossfade 300ms con `AnimatePresence` keyed por URL): chevrolet/freightliner → `fondo_flota1_tropical.jpg`, kenworth → `fondo_flota2_desierto.jpg`, volvo → `fondo_flota3_montana.jpg`, scania/mercedes → `fondo_flota4_artico.jpg`, international/daf/foton/tesla → `fondo_flota5_cyberpunk.jpg` (`cover`, `center bottom`); capas bokeh/glow atenuadas (`.game-bg--subtle`, opacity 0.45).
- Área de juego (`.game-play-area`): absoluta `top: 0; bottom: calc(265px + safe-area)`, flex column centrada, `padding: 60px 0 20px`. Contador grande dorado (`.cps-counter-overlay`, solo el número — el label "CPS" se eliminó en V8; conserva `cpsGlow`/`cpsBounce`/`counter-milestone`/`cps-counter-blur`/`nitro-counter`) arriba del camión; camión centrado en el espacio restante. Hint/badge xN/AUTO en `top: 64%` de la arena; `.combo-display` flota sobre el stack (`bottom: 272px + safe-area`).
- **Stack inferior de la arena (`.arena-bottom-stack`, V8, bottom 0, padding-bottom que libra el navbar):** en orden de arriba a abajo: (1) 4 epic power buttons (`.epic-power`, círculos glossy 60px con `::before` gloss, label 8px uppercase y badge de inventario) — VELOCIDAD gold → `nitro`, CONGELAR cyan → `time_warp`, DINEROx2 orange → `convoy`, CAJA purple → `gold_rain` (activan los power-ups reales del `powerupStore`); (2) THICK progress bar 20px (`.milestone-v8-bar`, fill verde animado `barShine` + glow de borde, pulsa con cada click vía `truckBump`) con estrella dorada 32px (`.milestone-v8-star`) que muestra el multiplicador objetivo; (3) tabs glossy pill (`.game-tab-v8`, activo gold gradiente, inactivo glass `rgba(255,255,255,0.08)`). El FAB de `PowerupMenu` queda `fixed` a `bottom: 300px + safe-area` (sobre el stack).
- Camión: assets PNG con `.truck-image` (180px alto, idle `truckIdle` 3s, `truck-shake` al click). Mapeo en `src/data/truckAssets.ts` (kenworth/volvo/scania propios; el resto cae a la mula base naranja).
- Power card V8 (`.sponsor-card-v8`, horizontal glossy 90px): fondo `linear-gradient(180deg, #FAFBFC, #F0F2F5)`, radius 16px, padding 12px 14px, flex con gap 12px. 6 elementos: (1) badge glossy circular 56px (`.sponsor-v8-badge`, gradiente + borde + gloss `::before` con colores del tier vía `--product-color(-light/-dark)`, `ProductBadge` 38px dentro); (2) título del poder 14px bold `#1a1a2e`; (3) MARCA HERO 22px 900 uppercase (`.brand-hero-badge`, TEXT_BADGE con el color del tier — los logos de marca NO existen como imágenes, siempre texto); (4) stats row `+N` (verde Space Mono 16px) + label `verdes` (9px gris) + costo compacto (Space Mono 14px `#1a1a2e`); (5) círculo de nivel glossy 40px (`.level-circle-v8`, gradiente del color del tier, label "Nv" 7px + número Space Mono 15px, pulsa con `key={level}` al comprar — reintroducido a petición del usuario tras haberlo eliminado V8); (6) botón BUY glossy circular verde 48px (`.buy-btn-circle.buy-btn-circle--v8`, "+"). V8 eliminó: tier progress bar, "CPS/nivel", "CPS total", multiplicador x1.0, "Base +X" y el segundo botón.
- Buy buttons: `.buy-btn-circle` (poderes, variante V8 48px) y `.buy-btn-glossy` (flota, verde gradiente glossy).
- Números flotantes: componente `FloatingNumber` (`+N`, Space Mono 20px #FFD700, animación `floatNumberUp` 1s, z-index 1000).
- Milestone THICK bar (`.milestone-v8`, V8, reemplaza el milestone loader de 8px): progreso del CPS/click hacia el próximo milestone (×2 en 10, ×3 en 50, ×4 en 200, ×5 en 1.000, ×10 en 5.000, ×20 en 25.000, ×50 en 100.000, ×100 en 500.000, luego ×2 del objetivo actual). Barra 20px radius 10px, track `rgba(0,0,0,0.45)` + borde glass, fill `linear-gradient(90deg, #2ECC71, #27AE60, #2ECC71)` animado (`barShine` 2s) con glow verde y leading edge blanco (`::after`); estrella dorada 32px al final con el ×N objetivo. Row superior: solo `{actual} / {objetivo}` (sin "CPS"). El fill pulsa (`brightness`) con cada click (clase ligada a `truckBump`). Al alcanzar: gold flash (`.milestone-flash`), `¡×N ALCANZADO!` (`.milestone-hit-text`, sobre el stack) y mini confetti dorado. La barra del ciclo CPS Frenzy ya no se muestra; el nivel sigue en el badge xN y el label "Multiplicador" (≥30 clicks).
- Fleet cost in Golden Tickets (`🎟️`). Power cost in CPS.
- Active vehicle marked `TOP`.
- Home (V2-1): hero banner 55vh (`home_banner_juego_completo.jpg`, `.home-banner`, rounded-b 2rem) con overlay gradiente oscuro abajo y partículas doradas; título 3D gold metallic (`.home-title-3d`) sobre el banner; botón JUGAR gold glossy (`.home-play-btn`) solapado bajo el banner (`margin: -28px auto 0`); links gold "Como Jugar?"/"Ver Tienda" (`.home-link-gold`); menú de cuenta en cards limpias (`.home-section-card`); stats panel glassmorphism (`.home-stats-panel`). La sección "Catálogo de premios" del Home ahora muestra 3 productos reales del catálogo VTEX en cards horizontales idénticas a la Tienda (foto 64px + nombre/marca + COP tachado + millas rojas + "Te faltan" + botón flecha roja), con fallback a 4 mocks si VTEX falla. Sin fondo blanco/kinder.

## Notes for Future Agents

- Do NOT reintroduce idle `/s` production without explicit user request.
- Do NOT reintroduce per-owned additive fleet bonuses: fleet is a multiplier (×), powers are the additive part.
- `formatFull` floors numbers; use `Math.max(1, ...)` for displayed card values.
- Marketplace colors must stay within red/white/gray/black only.
- Cash redemption rate is `100_000_000 millas = 10_000 COP`.
- Always run `npx tsc -b && npm run build` before declaring done.
- `npx tsc -b` está limpio (0 errores); mantenerlo así. `npm run lint` tiene errores pre-existentes de reglas react-hooks/react-compiler en archivos no relacionados; no añadir nuevos.

## Epic Features (`src/store/` + `src/components/game/` + `src/styles/epic-features.css`)

- **Combos** (`comboStore.ts`): ventana de 2s entre clicks. Tiers x1 (1-5), x2 (6-15), x3 (16-30), x5 (31-50), x10 (51+). `ComboDisplay` muestra multiplicador + barra de 2s; burst de 20 partículas cada 10 de combo; shake continuo en x10.
- **Críticos**: `store.getCriticalChance()` = 5% base + 0.5%/nivel del upgrade `precision` (aún no existe en el catálogo; se soporta por id). Crítico = x10 + `CriticalHit` (vignette, starburst de 30, texto 48px).
- **Ascensión**: pestaña Ascensión reemplaza Prestigio. Botón habilitado si `totalEarned >= 1M * 10^ascensions` (máx 50). `AscensionCinematic` (~10.6s) llama `onAscend` a mitad (aplica `prestige()` + `addAscension()`). `prestige()` resetea poderes, flota (a Chevrolet) y `cpsBalance`; conserva `cpsTotal`/`totalEarned`/estrellas/tickets. Badge `⭐xN` en header y aura dorada permanente en el camión (`golden-aura`); aura legendaria con el hito `ascension-10`.
- **Eventos globales** (`eventStore.ts`): simulados; primer evento ~90s, luego cada 4-8h. Duración 5 min (diseño original 1h, acortado para sesiones). Cada click suma progreso + avance comunitario pasivo. `caravana` da x3 al click. Recompensas se entregan en `Game.tsx` al cerrar (millas + `store.addEarnings`).
- **Desbloqueos** (`unlockStore.ts`): hitos `km-1k` (small, 1.000 CPS), `km-1m` (medium, 1M CPS), `fleet-10` (large, los 10 vehículos de flota), `ascension-10` (epic). Ids legacy conservados por compatibilidad con el estado persistido. `UnlockCinematic` auto-cierra (3/5/8/12s) o al tocar.
- **Racha diaria** (`dailyStore.ts`): recompensas [100, 250, 500, 1000, 2500, 5000, 10000]; día 5 = +5 🎟️, día 7 = +20 🎟️. Falta 1 día = racha rota. UI en `DailyStreak` dentro de `Game.tsx`.
- **Power-ups** (`powerupStore.ts`): inventario persistido (`truckSurfers_powerups_v1`). nitro x50 click 10s, convoy x10 click 30s, gold_rain monedas clickeables 15s (máx 10 simultáneas), time_warp = `clickPower * 14400` instantáneo (4h a 1 click/s). Menú radial FAB bottom-left (`PowerupMenu`).
- `clickerStore` añade `ascensions`, `addAscension()`, `getCriticalChance()`, `addEarnings()` (suma a `cpsBalance` + `cpsTotal` + `totalEarned`). Nuevas claves de storage: `truckSurfers_daily_v1`, `truckSurfers_unlocks_v1`, `truckSurfers_powerups_v1`.
- Animaciones épicas usan solo `transform`/`opacity`; tope de ~30 partículas simultáneas por efecto.

## Wave 1 — Core de progresión (`src/store/` + `src/components/game/`)

- **Misiones** (`questStore.ts`, `truckSurfers_quests_v1`): 3 diarias + 1 semanal, tipos `clicks`/`comboTier`/`buyPower`/`collectTickets`/`earnCps`/`buyFleet`. Generación determinística por seed de fecha local (diaria rota cada día, semanal cada lunes). `ensureQuests()` rota si cambió el día/semana; `progress(type, amount)` (comboTier guarda el MÁX tier, el resto suma); `claim(id)` devuelve `{ cps?, tickets?, millas? }` y la página aplica la recompensa. UI: `QuestPanel.tsx` (bottom sheet), icono `ClipboardList` en el header flotante de `Game.tsx`.
- **Talentos** (`talentStore.ts`, `truckSurfers_talents_v1`): 12 talentos, 4 ramas × 3 niveles (Poder +5% click/nivel, Combo +0.5s ventana/nivel, Crítico +2%/nivel, Tickets +10% spawn/nivel). Se compran con `stars` vía `clickerStore.spendStars()` (nuevo, junto a `spendGoldenTickets()`); cada nivel requiere el anterior de su rama. Helpers: `getTalentPowerBonus/getTalentComboWindowMs/getTalentCritBonus/getTalentTicketBonus`. `calculateClickPower` y `getCriticalChance` (tope subido a 0.35) los aplican; la ventana de combo es `getComboWindowMs()` en `comboStore.ts`. UI: `TalentTree.tsx` en la pestaña "Talentos" de `Game.tsx`.
- **Logros** (`achievementStore.ts`, `truckSurfers_achievements_v1`): 24 logros (10 poderes max + flota 3/6/10 + CPS 1K/1M/1B/1T + clics 1K/100K/1M + combo x10 + ascensiones 1/10/50). `checkAchievements(snapshot)` marca desbloqueados y devuelve los nuevos; `claim(id)` devuelve la recompensa (cps/tickets/millas/title). `Game.tsx` checkea en un `useEffect` y muestra `AchievementToast.tsx`; la sección "Logros" de `Profile.tsx` (grid 2 col) permite reclamar.
- **Cajas de loot** (`lootBoxStore.ts`, `truckSurfers_lootboxes_v1`): `openBox()` consume 1 🎟️ (`spendGoldenTickets`) y tira: 40% power-up aleatorio, 30% +1 ticket, 20% +1000 millas, 8% +5000 CPS, 2% skin rara (placeholder en `skins[]`). UI: `LootBoxModal.tsx` (animación Framer Motion), icono `Gift` en el header flotante de `Game.tsx`.

## Wave 2 — Economía y contenido (F5–F8)

- **F5 Anuncios con recompensa (opt-in):** `src/lib/rewardedAd.ts` (`showRewardedAd()` simulada: 5s en navegador, `false` si se aborta; `true` inmediata fuera del navegador) + `src/components/game/AdRewardModal.tsx` (cuenta regresiva 5s, barra de progreso, botón Cerrar deshabilitado hasta terminar; si se cierra antes NO se entrega nada). Integraciones: `DailyStreak` (botón "Doble recompensa" tras reclamar, prop `onDoubleClaim`), `Game.tsx` (combo roto con 6+ clicks → banner "Revivir combo con anuncio" durante 6s; restaura vía `comboStore.restoreCombo(count)`).
- **F6 Pase de temporada "Ruta Nacional":** datos en `src/data/seasonPass.ts` (temporada = trimestre calendario, 30 niveles × 100 XP, track gratis/premium de CPS y 🎟️). Store `src/store/seasonStore.ts` (`truckSurfers_season_v1`): `addXp`, `claimLevel` (aplica recompensas directo al clicker store), `unlockPremium`, `resetSeason`, `hydrateFromServer` (merge: mayor XP gana, claims/premium unión). Premium cuesta 250 🎟️ (se cobra en la página). UI `src/pages/SeasonPass.tsx` (ruta `/season`, acceso desde Profile → "Ruta Nacional"). XP: 1 por click, +25 racha diaria, +50 redenciones (Marketplace efectivo/VTEX y Redemption). Sync best-effort: `src/lib/seasonSync.ts` + `src/hooks/useSeasonSync.ts` (debounce 5s, tabla `season_progress`, migración `supabase/migrations/006_season_progress.sql`).
- **F7 Mapa de rutas:** `src/data/routes.ts` (10 ciudades colombianas, requisito de `cpsTotal` de 0 a 10T, bonus +2-5% c/u acumulativo y permanente). Store `src/store/routeStore.ts` (`truckSurfers_routes_v1`): `checkUnlocks(cpsTotal)` (auto-avanza el camión a la ciudad nueva), `setCurrentCity`. UI: pestaña "Ruta" en `Game.tsx` → `src/components/game/RouteMap.tsx` (timeline vertical, camión 🚛 en la ciudad actual, barra de progreso a la siguiente). El bonus se aplica en `calculateClickPower` vía `computeRouteBonus`.
- **F8 Personalización del camión ("El Taller"):** `src/data/truckSkins.ts` (categorías skin/bocina/luces/remolque/sticker; costo en millas/🎟️/CPS; bonus ≤2% por pieza; `getTruckVisual` = filtro CSS hue-rotate + drop-shadow de luces + emojis de sticker/remolque). Store `src/store/customizationStore.ts` (`truckSurfers_customization_v1`): `buy`/`equip` (el cobro lo hace la UI porque cada moneda vive en un store distinto). UI: pestaña "Taller" en `Game.tsx` → `src/components/game/TruckCustomization.tsx` (preview + compra/equipo). El visual se aplica al camión de la arena y el bonus en `calculateClickPower` vía `computeCustomizationBonus`.
- Tabs de la arena ahora: Poderes / Flota / Ruta / Taller / Ascensión.

## Wave 3 — Social y Eventos (F9–F12)

- **Ligas semanales (F9)** (`src/data/leagues.ts` + `src/store/leagueStore.ts`, persist `truckSurfers_league_v1`): 6 ligas (Bronce→Leyenda) × 5 rangos = 30 divisiones lineales. El CPS semanal (`weeklyCpsTotal`) se alimenta desde `clickerStore.click()`/`addEarnings()` y reinicia los lunes 00:00 local (`getWeekKey`). Al cerrar la semana: `weekly >= promotionThreshold(division)` (20.000 × 3.2^div) → asciende; `< 15%` → desciende; recompensa pendiente (`pendingReward`) que la UI reclama (millas vía MillasProvider, CPS/tickets vía clickerStore). UI: scope "Liga" en `/leaderboard` (`src/components/LeaguePanel.tsx`) con progreso, countdown, mini leaderboard semanal local (mock + tú) y escalera completa. Migración opcional `supabase/migrations/005_league_progress.sql` (tabla `league_progress` con RLS) para futuro sync.
- **Amigos y caravanas (F10)** (`src/store/friendsStore.ts`, persist `truckSurfers_friends_v1`): modelo 100% local (offline). `addFriend(code)` acepta cualquier código (`MULA-XXXX` propio, `friend_nombre`, etc.), presencia simulada por `refreshActivity()` (Game la corre cada 60s). Amigo activo = `lastActive` < 30 min. **Bonus caravana: +1% al click por amigo activo (tope +5%)**, aplicado al final de `calculateClickPower` en `clickerStore.ts`. UI: sección "Amigos y Caravanas" en `Profile.tsx` (`src/components/FriendsSection.tsx`) con invitar/agregar/convite/eliminar. Toast simulado de convite entrante en `Game.tsx`.
- **Notificaciones push (F11)** (`src/lib/pushNotifications.ts`, settings en `truckSurfers_push_v1`): Notification API local (sin service worker). Tipos: racha diaria lista, combo perdido (≥6), evento global activo, recompensa de liga lista — disparados desde `Game.tsx`/`LeaguePanel`. Si no hay soporte/permiso, `notifyPush` devuelve false y mandan los toasts internos. Toggle master en `Profile.tsx` (sección Notificaciones) que pide `Notification.requestPermission`.
- **Minijuegos (F12)** (`src/components/game/MinigameModal.tsx`): Derrape (barra oscilante, 3 intentos en zona verde) y Cambio de neumático (clicks en 5s). Cuestan 1 🎟️ vía `store.spendGoldenTickets` (nuevo; NO convierte a millas). Recompensas: millas (UI/MillasProvider), CPS (`addEarnings`), tickets y power-up aleatorio (`powerupStore.addPowerup`). Acceso: botón 🎮 (`Gamepad2`) en los float-pills del header de `/game`.
