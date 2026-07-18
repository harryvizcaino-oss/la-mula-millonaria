import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "../../api/router";
import { type ReactNode, useMemo } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const trpc = createTRPCReact<AppRouter>();

const queryClient = new QueryClient();

/**
 * tRPC queda solo para features legacy (transacciones, redenciones).
 * La autenticación y la sincronización del juego ya viven en Supabase;
 * aquí se adjunta el access token de la sesión de Supabase si existe.
 */
export function TRPCProvider({ children }: { children: ReactNode }) {
  const trpcClient = useMemo(
    () =>
      trpc.createClient({
        links: [
          httpBatchLink({
            url: "/api/trpc",
            transformer: superjson,
            headers: async () => {
              try {
                if (!isSupabaseConfigured) return {};
                const { data } = await supabase.auth.getSession();
                const token = data.session?.access_token;
                return token ? { Authorization: `Bearer ${token}` } : {};
              } catch {
                return {};
              }
            },
            fetch(input, init) {
              return globalThis.fetch(input, {
                ...(init ?? {}),
                credentials: "include",
              });
            },
          }),
        ],
      }),
    [],
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
