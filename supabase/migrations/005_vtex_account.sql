-- 005_vtex_account.sql
-- MVP vinculación VTEX: el usuario guarda su email de cuenta redpostventa.com
-- para que, al redimir un producto real, el juego pueda armar un link directo
-- al carrito de VTEX con el SKU y el código de gift card.

alter table public.profiles
  add column if not exists vtex_email text,
  add column if not exists vtex_linked_at timestamp with time zone;

-- Política: el propio usuario puede leer/actualizar su vtex_email.
-- (La columna no es sensible; solo es un email para pre-llenar el checkout.)

-- SELECT ya está cubierto por "Users can read all profiles" en 001.
-- UPDATE/INSERT solo el propio usuario.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'Users can update own vtex email'
  ) then
    create policy "Users can update own vtex email" on public.profiles
      for update using (auth.uid() = id) with check (auth.uid() = id);
  end if;
end $$;
