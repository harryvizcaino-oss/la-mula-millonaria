-- ============================================================================
-- La Mula Millonaria — 009_admin_roles.sql
-- Roles de administrador para validar acceso a módulos de seguridad.
--
-- Qué hace:
--   1. Agrega columna `role` a `profiles` (user, admin, owner).
--   2. Crea función `is_admin()` para verificar si el usuario es admin.
--   3. Crea función `is_owner()` para verificar si el usuario es owner.
--   4. Actualiza RLS para que solo admins puedan acceder a datos de seguridad.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Columna de rol en profiles
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists role text not null default 'user'
  check (role in ('user', 'admin', 'owner'));

-- Índice para búsquedas rápidas por rol
create index if not exists profiles_role_idx on public.profiles (role);

-- ----------------------------------------------------------------------------
-- 2. Funciones de validación de roles
-- ----------------------------------------------------------------------------

-- Verifica si el usuario actual es admin o owner
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role in ('admin', 'owner')
  );
end;
$$;

-- Verifica si el usuario actual es owner
create or replace function public.is_owner()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'owner'
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. Asignar rol de owner al usuario actual (Harry Vizcaíno)
-- ----------------------------------------------------------------------------
-- NOTA: Reemplaza 'harry@autofleet.com' con el email real del owner
update public.profiles
set role = 'owner'
where id = (
  select id from auth.users
  where email = 'harry@autofleet.com'
  limit 1
);

-- ----------------------------------------------------------------------------
-- 4. Tabla de logs de seguridad (para el módulo de administración)
-- ----------------------------------------------------------------------------
create table if not exists public.security_logs (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  event_type text not null,
  event_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists security_logs_user_id_idx on public.security_logs (user_id, created_at desc);
create index if not exists security_logs_event_type_idx on public.security_logs (event_type, created_at desc);

-- RLS: solo admins pueden ver logs de seguridad
alter table public.security_logs enable row level security;

drop policy if exists "security_logs_select_admin" on public.security_logs;
create policy "security_logs_select_admin"
  on public.security_logs for select
  using (public.is_admin());

drop policy if exists "security_logs_insert_admin" on public.security_logs;
create policy "security_logs_insert_admin"
  on public.security_logs for insert
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 5. Función para registrar eventos de seguridad desde el cliente
-- ----------------------------------------------------------------------------
create or replace function public.log_security_event(
  event_type text,
  event_data jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.security_logs (user_id, event_type, event_data)
  values (auth.uid(), event_type, event_data);
end;
$$;

-- ----------------------------------------------------------------------------
-- 6. Comentarios de documentación
-- ----------------------------------------------------------------------------
comment on table public.security_logs is 'Logs de seguridad para auditoría (ISO 27001 A.12)';
comment on column public.profiles.role is 'Rol del usuario: user, admin, owner';
comment on function public.is_admin() is 'Verifica si el usuario actual es admin o owner';
comment on function public.is_owner() is 'Verifica si el usuario actual es owner';
comment on function public.log_security_event(text, jsonb) is 'Registra un evento de seguridad desde el cliente';
