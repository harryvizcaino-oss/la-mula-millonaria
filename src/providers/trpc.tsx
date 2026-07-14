import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import superjson from "superjson";
import type { AppRouter } from "../../api/router";
import { type ReactNode, useMemo } from "react";

export const trpc = createTRPCReact<AppRouter>();

const queryClient = new QueryClient();

export function TRPCProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();

  const trpcClient = useMemo(
    () =>
      trpc.createClient({
        links: [
          httpBatchLink({
            url: "/api/trpc",
            transformer: superjson,
            headers: async () => {
              try {
                const token = await getToken();
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
    [getToken],
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
