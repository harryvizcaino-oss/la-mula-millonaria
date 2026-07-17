# AGENTS.md — La Mula Millonaria (Trucker Surfers Clicker)

## Project Overview

- **App name:** La Mula Millonaria
- **Repository:** `Documents/trucker-surfers/app`
- **Stack:** React 19 + TypeScript + Vite 7 + Tailwind CSS + Zustand + Framer Motion
- **Router:** `HashRouter` → routes like `/#/game`
- **Local dev:** `npm run dev` (serves on `http://localhost:3000/`)
- **Build:** `npm run build` (also runs `tsc` implicitly via Vite transform)
- **Type-check:** `npx tsc --noEmit`

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

On brand tier up: white flash 300ms → brand name types letter by letter (inside the top-right `.brand-tag` pill) → border-left color transitions 500ms → multiplier count-up (footer `x{mult}`) → gold confetti (`canvas-confetti`) → toast `New brand unlocked: [BRAND]! +X% CPS`.

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
| `src/components/game/SponsorPowerCard.tsx` | Power card: power name as title + brand pill + tier-change animation + circular buy button |
| `src/components/game/FleetVehicleCard.tsx` | Fleet card with ×multiplier and ticket cost |
| `src/components/game/FloatingNumber.tsx` | "+N CPS" floating number at click point (1s CSS animation, self-dismiss) |
| `src/styles/ui-fixes.css` | UI fixes: floating numbers, truck assets, sponsor card, milestone loader, game header |
| `src/providers/MillasProvider.tsx` | Spendable millas context + persistence |
| `src/components/ClickerEngine.tsx` | Legacy production loop (currently no-op for income) |
| `src/App.tsx` | Routes + mounts `ClickerEngine` |
| `src/pages/Marketplace.tsx` | Store + cash redemption (Gift Card) + VTEX gift cards (CPS) |
| `src/pages/Profile.tsx` | User profile page |
| `src/components/Navbar.tsx` | Bottom nav: Inicio, Ranking, Jugar, Tienda, Perfil |
| `api/lib/clicker.ts` | Server-side copy of the CPS formula |
| `api/trpc/routers/game.ts` | tRPC: clicker saveState/getState + leaderboard score = cpsTotal |

## Server Sync (useClickerSync)

- Wire shape: `{ fleet: { fleetOwned, selectedFleet, cpsBalance }, upgrades, powerLevels, totalClicks, cpsTotal, totalEarned, stars, goldenTickets, autoclickLevel, lastTickAt }`.
- The fleet snapshot is stored in the legacy `buildings` JSON column (no DB migration); `total_km` column carries `cpsTotal`. `getState` returns `fleet: null` for legacy rows and the client keeps its local state.
- Leaderboard `score` = `Math.floor(cpsTotal)`, updated with `Math.max(existing, new)` — the ranking never decreases.

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
  1. Balance strip: TicaMillas, Golden Tickets, CPS, COP available.
  2. Cash redemption card: "Redime tu dinero".
  3. VTEX gift cards card (CPS).
  4. Search bar (sticky at `top-14`).
  5. Category tabs.
  6. Promo banners.
  7. Product grid.
- **VTEX gift cards (redpostventa.com):** $10 (100K CPS), $25 (250K), $50 (500K), $100 (1M), $250 (2.5M). Redeeming calls `store.redeemCps(cost)` — only `cpsBalance` decreases; `cpsTotal` (ranking) is untouched.
- **Cash redemption:**
  - Conversion: `100.000.000 TicaMillas = $10.000 COP`.
  - Golden Tickets convert through their existing `1 ticket = 1.000 TicaMillas` rate.
  - User inputs how many Millas and/or Tickets to redeem.
  - System deducts the selected amounts and generates a Gift Card code shown in a modal.
- Product redemption still exists below; tapping a product opens the detail bottom sheet and then `/redemption`.

## Navigation (Bottom Navbar)

Items in order:
1. Inicio (`/`)
2. Ranking (`/leaderboard`)
3. Jugar (`/game`) — center elevated button
4. Tienda (`/marketplace`)
5. Perfil (`/profile`)

**Mi Empresa was removed.** The previous `/empresa` route, page, terrain data, and store state no longer exist. The terrain/building feature was deleted.

## UI Conventions

- Header (`.game-header`, Space Mono, fondo `rgba(15,30,50,0.9)` + blur 10px): 🎟️ tickets | 💵 CPS balance (`.game-header-cps`, gold, `clamp(20px, 5.4vw, 30px)`; conserva `counter-glow`/`counter-milestone`/`cps-counter-blur`/`nitro-counter`) | ⚡ `+{clickPower * activeClickMultiplier}/click` (verde) | 👑 `#rank` (+ badge `⭐xN` de ascensión cuando aplica).
- Player Level ya no es badge del header; se muestra en el texto de la pestaña Poderes.
- Arena: fondo `public/assets/fondo_carretera_andina.svg` (`cover`, `center bottom`); capas bokeh/glow atenuadas (`.game-bg--subtle`, opacity 0.45).
- Camión: assets SVG con `.truck-image` (160px alto, idle `truckIdle` 3s, `truck-shake` al click). Mapeo: `kenworth` → `asset_kenworth_t800.svg`, `volvo` → `asset_volvo_fh.svg`, resto → `asset_camion_mula_base.svg`. Los ojos CSS `.fleet-vehicle` ya no aplican al camión principal.
- Power card (`.sponsor-card`, glass `rgba(30,45,70,0.85)` + blur 12px): POWER TYPE como título (17px bold blanco), marca como pill top-right (`.brand-tag`), franja izquierda 4px `var(--tier-color)`, subtítulo `+N CPS/nivel · Nivel X`, barra de progreso de tier, footer con `x{mult}` marca + CPS aportados + precio (`💵 N CPS`, `.sponsor-card-price`, Space Mono 13px gold) + botón circular verde `.buy-btn-circle` ("+", 40px, active scale 0.92).
- Buy buttons: `.buy-btn-circle` (poderes) y `.buy-btn-glossy` (flota, verde gradiente glossy).
- Números flotantes: componente `FloatingNumber` (`+N CPS`, Space Mono 20px #FFD700, animación `floatNumberUp` 1s, z-index 1000).
- Milestone loader (`.milestone-loader`, reemplaza la barra gris de la carretera): progreso del CPS/click hacia el próximo milestone (×2 en 10, ×3 en 50, ×4 en 200, ×5 en 1.000, ×10 en 5.000, ×20 en 25.000, ×50 en 100.000, ×100 en 500.000, luego ×2 del objetivo actual). Barra 8px con fill verde + shine, porcentaje abajo; al alcanzar: gold flash, `¡×N ALCANZADO!` y mini confetti dorado. La barra del ciclo CPS Frenzy ya no se muestra; el nivel sigue en el badge xN y el label "Multiplicador" (≥30 clicks).
- Fleet cost in Golden Tickets (`🎟️`). Power cost in CPS.
- Active vehicle marked `TOP`.

## Notes for Future Agents

- Do NOT reintroduce idle `/s` production without explicit user request.
- Do NOT reintroduce per-owned additive fleet bonuses: fleet is a multiplier (×), powers are the additive part.
- `formatFull` floors numbers; use `Math.max(1, ...)` for displayed card values.
- Marketplace colors must stay within red/white/gray/black only.
- Cash redemption rate is `100_000_000 millas = 10_000 COP`.
- Always run `npx tsc --noEmit && npm run build` before declaring done.
- `npm run check` (`tsc -b`) has pre-existing errors in untouched files (unused vars, `api/clerk/auth.ts`, `Profile.tsx`); do not add new ones.

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
