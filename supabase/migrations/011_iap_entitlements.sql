-- ============================================================================
-- La Mula Millonaria — 011_iap_entitlements.sql
-- Compras in-app (tickets, starter pack, ad-free, pase premium) + pedidos.
--
-- Qué hace:
--   1. Añade a `game_state` los entitlements locales que el cliente hidrata:
--      `ad_free_until` (timestamptz; far-future = lifetime) y
--      `starter_iap_bought` (pack de inicio, una sola vez).
--   2. Crea `iap_orders` para el checkout (mock o Credibanco). El cliente
--      solo inserta filas `pending` propias. El webhook del servidor marca
--      `paid` con la **service role** (bypassa RLS); el anon key nunca debe
--      poder escribir `paid_at` ni cambiar status a paid.
--
-- Aplicar con: pegar este archivo en el SQL Editor del dashboard de Supabase
-- (o `supabase db push`). Idempotente.
-- ============================================================================

alter table public.game_state
  add column if not exists ad_free_until timestamptz,
  add column if not exists starter_iap_bought boolean default false;

-- ----------------------------------------------------------------------------
-- iap_orders — pedido de checkout. Webhook (service role) actualiza a paid.
-- amount_cents: COP en centavos (priceCop * 100). Credibanco no vive en Vite.
-- ----------------------------------------------------------------------------
create table if not exists public.iap_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sku_id text not null,
  amount_cents int not null,
  currency text not null default 'COP',
  status text not null default 'pending',
  provider text not null default 'mock',
  provider_ref text,
  created_at timestamptz default now(),
  paid_at timestamptz
);

create index if not exists iap_orders_user_id_created_idx
  on public.iap_orders (user_id, created_at desc);

alter table public.iap_orders enable row level security;

-- Lectura: solo el dueño. El webhook usa service role (sin RLS).
drop policy if exists "iap_orders_select_own" on public.iap_orders;
create policy "iap_orders_select_own"
  on public.iap_orders for select
  using (auth.uid() = user_id);

-- Insert: solo filas propias y siempre pending (el cliente no marca paid).
drop policy if exists "iap_orders_insert_own_pending" on public.iap_orders;
create policy "iap_orders_insert_own_pending"
  on public.iap_orders for insert
  with check (auth.uid() = user_id and status = 'pending' and paid_at is null);

-- Update: solo el dueño, y solo mientras el pedido sigue pending.
-- No puede pasar a paid ni escribir paid_at (eso lo hace el webhook server).
drop policy if exists "iap_orders_update_own_pending" on public.iap_orders;
create policy "iap_orders_update_own_pending"
  on public.iap_orders for update
  using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id and status = 'pending' and paid_at is null);
