import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  ensureUserRecords,
  fetchProfile,
  signOut as supabaseSignOut,
  toAppUser,
  type AppUser,
} from "@/lib/auth";
import { LOGIN_PATH } from "@/const";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

/**
 * Hook de autenticación backed por Supabase Auth (antes Clerk + tRPC).
 * Mantiene la misma interfaz que consumen las páginas:
 * `{ user, isAuthenticated, isLoading, error, logout, refresh, clerkUser }`.
 * `user` tiene el shape `{ id, name, email, avatar }`.
 */
export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = LOGIN_PATH } =
    options ?? {};

  const navigate = useNavigate();
  const [user, setUser] = useState<AppUser | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(() => isSupabaseConfigured);
  const [error, setError] = useState<Error | null>(null);

  const loadProfile = useCallback(async (authUser: User) => {
    setAuthUser(authUser);
    const profile = await fetchProfile(authUser.id);
    setUser(toAppUser(authUser, profile));
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Sin config no hay sesión que restaurar; isLoading ya nació en false.
      return;
    }

    let cancelled = false;

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (cancelled) return;
        const authUser = data.session?.user ?? null;
        if (authUser) {
          await loadProfile(authUser);
        }
        if (!cancelled) setIsLoading(false);
      })
      .catch((err) => {
        console.error("[useAuth] Failed to restore session:", err);
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const authUser = session?.user ?? null;
      // Se difiere para no llamar a la API de Supabase dentro del callback.
      setTimeout(() => {
        if (cancelled) return;
        if (authUser) {
          if (event === "SIGNED_IN") {
            // Crea profiles + game_state si es un registro nuevo (fallback
            // del trigger handle_new_user de la migración 001).
            void ensureUserRecords(authUser);
          }
          void loadProfile(authUser);
        } else {
          setAuthUser(null);
          setUser(null);
        }
        setIsLoading(false);
      }, 0);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const logout = useCallback(async () => {
    await supabaseSignOut();
    setAuthUser(null);
    setUser(null);
    navigate(redirectPath);
  }, [navigate, redirectPath]);

  const refresh = useCallback(async () => {
    if (authUser) await loadProfile(authUser);
  }, [authUser, loadProfile]);

  const isAuthenticated = !!user;

  useEffect(() => {
    if (redirectOnUnauthenticated && !isLoading && !isAuthenticated) {
      const currentPath = window.location.pathname;
      if (currentPath !== redirectPath) {
        navigate(redirectPath);
      }
    }
  }, [redirectOnUnauthenticated, isLoading, isAuthenticated, navigate, redirectPath]);

  return useMemo(
    () => ({
      user: user ?? null,
      isAuthenticated,
      isLoading,
      error,
      logout,
      refresh,
      clerkUser: authUser,
    }),
    [user, isAuthenticated, isLoading, error, logout, refresh, authUser],
  );
}
