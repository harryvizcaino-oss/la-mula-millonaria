-- ============================================================================
-- La Mula Millonaria — 002_friends.sql
-- Feature "Amigos" (T5): códigos de invitación + policies de `friends`.
--
-- Qué hace:
--   1. Agrega `profiles.invite_code` (código corto de invitación, 8 chars)
--      con índice UNIQUE y backfill para las filas existentes. Si un perfil
--      queda sin código (cuentas nuevas), el frontend lo genera al abrir la
--      sección Amigos (src/lib/friends.ts → getMyInviteCode).
--   2. Re-crea las policies RLS de `friends` de forma idempotente para
--      cubrir el flujo completo: INSERT del emisor, UPDATE de ambos
--      participantes (aceptar) y DELETE de ambos participantes (rechazar /
--      eliminar amigo). En 001 el DELETE solo lo podía hacer `user_id`.
--
-- Aplicar con: pegar este archivo en el SQL Editor del dashboard de Supabase
-- (o `supabase db push`). Es idempotente: se puede correr más de una vez.
-- No requiere pasos manuales adicionales.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. invite_code en profiles
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists invite_code text;

-- UNIQUE vía índice (admite múltiples NULL para perfiles sin código aún).
create unique index if not exists profiles_invite_code_idx
  on public.profiles (invite_code);

-- Backfill: genera un código de 8 chars hex mayúsculas por perfil existente,
-- con reintento ante la (improbable) colisión del UNIQUE.
do $$
declare
  r record;
  new_code text;
begin
  for r in select id from public.profiles where invite_code is null loop
    loop
      new_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
      begin
        update public.profiles set invite_code = new_code where id = r.id;
        exit;
      exception when unique_violation then
        -- colisión: reintenta con otro código
      end;
    end loop;
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 2. Policies RLS de friends (idempotentes, cubren el flujo completo)
-- ----------------------------------------------------------------------------
-- Lectura: participantes de la fila.
drop policy if exists "friends_select_participant" on public.friends;
create policy "friends_select_participant"
  on public.friends for select
  using (auth.uid() = user_id or auth.uid() = friend_id);

-- Envío de solicitud: solo el emisor crea la fila (user_id = yo).
drop policy if exists "friends_insert_own" on public.friends;
create policy "friends_insert_own"
  on public.friends for insert
  with check (auth.uid() = user_id);

-- Aceptar: el receptor (friend_id) cambia status a 'accepted'; el emisor
-- también puede actualizar su propia fila.
drop policy if exists "friends_update_participant" on public.friends;
create policy "friends_update_participant"
  on public.friends for update
  using (auth.uid() = user_id or auth.uid() = friend_id)
  with check (auth.uid() = user_id or auth.uid() = friend_id);

-- Rechazar / eliminar: cualquiera de los dos participantes borra la fila.
drop policy if exists "friends_delete_participant" on public.friends;
create policy "friends_delete_participant"
  on public.friends for delete
  using (auth.uid() = user_id or auth.uid() = friend_id);
