-- 010_drop_vtex_account.sql
-- Elimina la vinculación VTEX (email/carrito) del perfil.
-- La migración histórica 005_vtex_account.sql se conserva; esta la revierte.

drop policy if exists "Users can update own vtex email" on public.profiles;

alter table public.profiles
  drop column if exists vtex_email,
  drop column if exists vtex_linked_at;
