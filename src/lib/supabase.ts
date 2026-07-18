import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Cuando las env vars no están configuradas la app sigue funcionando en modo
 * offline/anónimo: todo el estado vive en Zustand + localStorage y nunca se
 * intenta pegarle a la red (ver guards en lib/auth.ts, lib/gameSync.ts).
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Cliente singleton. Las URLs placeholder solo se usan para construir el
// cliente sin lanzar error cuando faltan las env vars; ninguna llamada de
// red se ejecuta en ese caso porque los callers revisan isSupabaseConfigured.
export const supabase: SupabaseClient = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true, // intercambia el `code` OAuth en /auth/callback
      flowType: 'pkce',
    },
  }
);
