# ACCEPTANCE — La Mula Millonaria

Criterios de aceptación del estado "producción Supabase-only". Cada ítem debe ser verificable.

## Build y tipos

- [x] `npx tsc -b` termina sin errores (0 errores desde 2026-07-22, T7).
- [x] `npm run build` termina OK y genera `dist/`.
- [x] `npm run lint` sin errores nuevos sobre el código tocado.

## Auth y sync (ya implementado — regresión)

- [ ] Login con Google/Apple funciona y crea `profiles` + `game_state` al primer ingreso.
- [ ] El estado del juego se guarda en `game_state` con debounce de 5s y se restaura al reingresar.
- [ ] `cps_total` en el servidor nunca decrece (`greatest()`).
- [ ] Sin `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` la app corre offline/anónima sin crashear.

## Migración legacy (pendiente — Wave 1/2)

- [ ] Profile muestra transacciones y stats reales leídos de Supabase (sin llamadas tRPC).
- [ ] El flujo de redención de productos completa end-to-end sin el backend legacy y registra la transacción.
- [x] Ningún archivo de `src/` importa el cliente tRPC ni `@clerk/*`.
- [x] `api/`, `db/`, `drizzle.config.ts` y los scripts `db:*` eliminados; `npm run dev` y `npm start` no levantan el servidor legacy.
- [x] `.env.example` solo lista las dos vars de Supabase.

## Juego (no tocar — regresión visual)

- [ ] La lógica del clicker (fórmula CPS, poderes, flota, barra de multiplicador, streak) no cambia respecto a `AGENTS.md`.
- [ ] El frontend visual (CSS, componentes UI) no se modifica salvo lo estrictamente necesario para las migraciones.

## Leaderboard

- [ ] Top 50 global carga desde `leaderboard_global` con Realtime; cae a mock solo si no hay config.
- [x] (Wave 3, código) Tabs Semanal/Mensual ordenan por `cps_week`/`cps_month` con fallback silencioso a `cps_total` si la migración 003 no está aplicada (T6, 2026-07-22).
- [ ] (Wave 3, pendiente de migración) Filtro semanal/mensual con datos reales verificado en producción — requiere aplicar `supabase/migrations/003_leaderboard_periods.sql` + habilitar pg_cron y programar los resets (bloque comentado al final de 003).
- [x] (Wave 3, código) Sección Amigos con datos reales de `friends` (códigos de invitación, solicitudes pendientes, ranking de amigos; T5, 2026-07-22). Degrada a "Inicia sesion para ver a tus amigos" sin sesión/config.
- [ ] (Wave 3, pendiente de migración) Flujo Amigos end-to-end verificado en producción — requiere aplicar `supabase/migrations/002_friends.sql` (invite_code + policies RLS de friends).
