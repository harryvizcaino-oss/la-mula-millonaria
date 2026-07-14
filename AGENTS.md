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

The clicker is a **per-click economy** (NOT idle production per second). All fleet vehicles and powers contribute to a total `clickPower` that is added on every manual click and autoclick.

### Core Formula

```ts
clickPower = (1 + sum(fleet) + sum(powers)) * clickUpgrades * globalUpgrades * starMultiplier
```

- Base click: `1`
- Fleet contribution: `baseClickBonus * ownedCount`
- Power contribution: `baseClickBonus * powerLevel`
- Click upgrade multipliers apply first to the base sum.
- Global upgrade multipliers apply after.
- Star prestige multiplier: `1 + stars * 0.01`.
- **Displayed header:** `clickPower * activeClickMultiplier` (CPS frenzy multiplier).

### Fleet Vehicles (`src/data/clickerBuildings.ts`)

Linear per-owned bonus. Bases follow `3 * 2^t - 1` so each vehicle at level 1 is strictly stronger than the previous vehicle at level 2:

| Vehicle | baseClickBonus |
|---|---|
| Motoneta | 2 |
| Camioneta | 5 |
| Plataforma | 11 |
| Tractomula | 23 |
| Volqueta | 47 |
| Furgón | 95 |
| Tanque | 191 |
| Tren | 383 |
| Minero | 767 |
| Autónomo | 1535 |

Fleet is bought with **Golden Tickets** (`store.goldenTickets`). Cost formula in `getBuildingTicketCost`.

### Powers (`src/data/clickerPowers.ts`)

Powers are per-vehicle-type, 5 categories each:

| Category | baseClickBonus factor |
|---|---|
| Filtro de Aire | `tier * 1` |
| Bujías | `tier * 3` |
| Frenos | `tier * 7` |
| Suspensión | `tier * 15` |
| Turbo | `tier * 31` |

`tier = vehicle index + 1`.

Powers are bought with **Millas** (`useMillas()` context). Cost scales with vehicle `baseCost` and power category.

### Ordering Rule

- A higher vehicle at level 1 must always beat the previous vehicle at level 2.
- A higher power category at level 1 must always beat the previous category at level 2.
- Lower tiers can catch up at high levels (linear scaling).

### Multiplier (CPS Frenzy)

- Cycle: 5 seconds.
- Threshold: 40 clicks per cycle.
- Each 40 clicks gained in a cycle adds +1 multiplier level.
- If under 40 clicks in a cycle, level decays by 1 (min 1).
- Counts clicks on the truck AND golden ticket collectibles.
- Badge is red, shows `xN`, no text label.

### Autoclick Superpower

- Purchased with Millas.
- Cost: `5000 * 4^autoclickLevel`.
- Duration: `min(120000, 15000 + (level + 1) * 5000)` ms.
- Loop in `src/pages/Game.tsx` uses a `ref` for `handleTruckClick` so the interval is not destroyed on every simulated click.

### Money / Millas

- `MillasProvider` (`src/providers/MillasProvider.tsx`) holds spendable `millas`.
- `useClickerStore` tracks lifetime stats (`totalEarned`, `totalKm`, `totalClicks`, `goldenTickets`, etc.).
- Production per second is 0; `ClickerEngine` is kept for compatibility/offline earnings but no longer adds idle income.

### Golden Tickets

- Floating collectible in `Game.tsx`.
- Spawn chance per click: `min(0.25, clicksSinceTicket * 0.0075)`.
- This is the **harder** spawn rate (halved from the original `0.015`).
- Each collected ticket gives `1` golden ticket.
- Tickets can be redeemed in the Marketplace for COP gift cards (see below).

## Storage Keys (Reset Strategy)

To force a reset, bump these keys:

- Millas: `truckSurfers_millas_v3`
- Clicker store: `truckSurfers_clicker_v4`

After changing keys, users must hard-refresh (`Cmd + Shift + R`) to discard old persisted state.

## Important Files

| File | Responsibility |
|---|---|
| `src/pages/Game.tsx` | Main clicker UI, click handler, autoclick loop, tabs (Poderes/Flota/Prestigio) |
| `src/store/clickerStore.ts` | Zustand store: buildings, powers, upgrades, stats, clickPower calculation |
| `src/data/clickerBuildings.ts` | Fleet vehicle definitions and costs |
| `src/data/clickerPowers.ts` | Power lines, costs, and bonuses |
| `src/data/clickerUpgrades.ts` | Click/global/building upgrades |
| `src/providers/MillasProvider.tsx` | Spendable millas context + persistence |
| `src/components/ClickerEngine.tsx` | Legacy production loop (currently no-op for income) |
| `src/App.tsx` | Routes + mounts `ClickerEngine` |
| `src/pages/Marketplace.tsx` | Store + cash redemption (Gift Card) |
| `src/pages/Profile.tsx` | User profile page |
| `src/components/Navbar.tsx` | Bottom nav: Inicio, Ranking, Jugar, Tienda, Perfil |

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
  1. Balance strip: TicaMillas, Golden Tickets, COP available.
  2. Cash redemption card: "Redime tu dinero".
  3. Search bar (sticky at `top-14`).
  4. Category tabs.
  5. Promo banners.
  6. Product grid.
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

- Header green badge: `+{clickPower}/click` (integer, no decimals, min 1).
- Fleet/Power card green badge: `+X/click` integer.
- Fleet cost in Golden Tickets (`🎫`).
- Power cost in Millas (`💵`).
- Active vehicle marked `TOP`.

## Notes for Future Agents

- Do NOT reintroduce idle `/s` production without explicit user request.
- If changing bases, verify ordering constraints with a quick table.
- `formatFull` floors numbers; use `Math.max(1, ...)` for displayed card values.
- Marketplace colors must stay within red/white/gray/black only.
- Cash redemption rate is `100_000_000 millas = 10_000 COP`.
- Always run `npx tsc --noEmit && npm run build` before declaring done.
