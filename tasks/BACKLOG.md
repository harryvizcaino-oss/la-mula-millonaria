# Backlog — La Mula Millonaria

Generado: 2026-07-22. Fuente: auditoría de migración Supabase vs legacy tRPC/MySQL/Clerk.

## Leyenda

- **P0** — roto en producción o bloquea el objetivo "Supabase-only"
- **P1** — deuda que impide apagar el backend legacy
- **P2** — mejora / limpieza

---

## P0 — Features rotas por la migración

### T1. Migrar transacciones de Profile a Supabase
- `src/pages/Profile.tsx:220-221` llama `trpc.game.points.getTransactions` y `trpc.game.game.getUserStats` contra el backend legacy, que verifica Clerk → siempre falla con sesión Supabase (en dev cae a `LOCAL_DEV_USER`).
- La tabla `transactions` de Supabase ya existe con RLS (`supabase/migrations/001_initial_schema.sql`) pero nadie la lee ni escribe.
- **Hacer:** escribir transacciones desde el frontend (earn/spend/reward) vía Supabase; reemplazar las dos queries tRPC por lecturas a `transactions` y a `game_state`/`profiles`. Definir el mapeo de `type` (el union type actual de `Profile.tsx` ya es incompatible — ver error TS2322 en `tsc -b`).

### T2. Migrar redención de productos a Supabase
- `src/pages/Redemption.tsx:896` usa `trpc.game.points.redeemProduct` → el flujo termina siempre en pantalla de error con sesión Supabase.
- **Hacer:** reemplazar por lógica client-side + escritura en Supabase (deducir millas, registrar en `transactions`, generar gift card code). Decidir si el código de gift card se genera en cliente o vía RPC/Edge Function (anti-fraude).

## P1 — Apagar el backend legacy

### T3. Borrar código muerto del router tRPC — ✅ DONE (2026-07-22)
- Resuelto con T4: se eliminó `api/` completa (routers tRPC, Clerk, queries) y la línea comentada `trpc.catalog.products` en `src/pages/Marketplace.tsx`.

### T4. Retirar `api/`, `db/`, drizzle y Clerk (post T1+T2+T3) — ✅ DONE (2026-07-22)
- Borrados: `api/`, `db/`, `contracts/` (sin consumidores en `src/`), `drizzle.config.ts`, `tsconfig.server.json`, `src/providers/trpc.tsx`, `dist/boot.js`.
- `vite.config.ts` sin `@hono/vite-dev-server`; `build` = solo `vite build` (outDir `dist/public`); `start` = `vite preview` (Railway sirve estáticos); scripts `db:*` eliminados.
- Deps eliminadas: `@clerk/backend`, `@clerk/clerk-react`, `@trpc/client`, `@trpc/react-query`, `@trpc/server`, `@tanstack/react-query`, `mysql2`, `drizzle-orm`, `drizzle-kit`, `hono`, `@hono/node-server`, `@hono/vite-dev-server`, `superjson`, `jose`, `cookie`.
- `.env.example` solo lista `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.

## P2 — Completar el plan Supabase

### T5. Friends real — ✅ DONE (2026-07-22)
- `supabase/migrations/002_friends.sql`: `profiles.invite_code` (índice UNIQUE + backfill de 8 chars hex con reintento) y policies RLS de `friends` idempotentes (INSERT emisor, UPDATE participantes, DELETE participantes — en 001 el DELETE solo era del emisor).
- `src/lib/friends.ts` (nuevo): `getMyInviteCode` (genera y guarda si falta), `findUserByInviteCode`, `sendFriendRequest` (guards self/duplicada en ambas direcciones), `getPendingRequests`, `acceptFriendRequest`, `declineFriendRequest`, `getFriends` (accepted + `cps_total` de `leaderboard_global`). Todo best-effort: sin config/sesión o sin migración 002 → null/[] sin crashes (warns silenciosos).
- `Leaderboard.tsx` scope "Amigos": panel real (card "Tu codigo" + copiar, input agregar con feedback, solicitudes pendientes aceptar/rechazar, ranking de amigos incluyéndome por `cps_total` con `RankRow`). Sin sesión: "Inicia sesion para ver a tus amigos". `mockFriends` ya no se usa (queda el export en `mockLeaderboard.ts` sin consumidores). Se eliminó la vieja `FriendsSection` mock del scope Global.
- **Paso manual pendiente:** aplicar `002_friends.sql` en el dashboard de Supabase.

### T6. Leaderboard semanal/mensual — ✅ DONE (2026-07-22)
- `supabase/migrations/003_leaderboard_periods.sql`: columnas `cps_week`/`cps_month` (BIGINT + índices) en `leaderboard_global` y `update_leaderboard()` reemplazada para acumular el delta de `cps_total` en cada upsert (delta <= 0 ignorado; INSERT cuenta el total completo). `cps_total` sigue con `greatest()`.
- Resets por pg_cron (lunes 00:00 UTC / día 1 00:00 UTC): los `cron.schedule` van COMENTADOS con instrucciones — habilitar pg_cron en el dashboard y correrlos a mano; la migración no falla sin la extensión.
- `Leaderboard.tsx`: tab Semanal ordena por `cps_week`, Mensual por `cps_month`, Global por `cps_total` (top 50, alias `score:<columna>`). Si la query falla porque 003 no está aplicada, reintenta con `cps_total` en silencio; tabla vacía → mock como hoy. Realtime + poll 30s conservados.
- **Pasos manuales pendientes:** aplicar `003_leaderboard_periods.sql` + habilitar pg_cron y programar los dos resets.

### T7. Limpieza de errores TS pre-existentes — ✅ DONE (2026-07-22)
- Unused vars eliminados: `ClickerEngine.tsx` (`lastTimeRef`), `Dashboard.tsx` (`Trophy`, `Shield`), `Game.tsx` (`playerLevel` + import `calculatePlayerLevel`), `Marketplace.tsx` (`Ticket`, `USER_MILLAS`, y la feature muerta `ticketAmount`/`handleRedeemTickets`), `Profile.tsx` (`Award`, `Users`).
- Alias `clerkUser` eliminado de `useAuth` (no tenía consumidores).
- `npx tsc -b` quedó en 0 errores.

---

## Orden sugerido

Wave 1: T1 + T2 (desbloquea features rotas) → ~~Wave 2: T3 + T4 + T7~~ (DONE 2026-07-22 — backend legacy eliminado, `tsc -b` limpio) → ~~Wave 3: T5 + T6~~ (DONE 2026-07-22 — código listo; falta aplicar migraciones 002/003 + pg_cron en el dashboard).
