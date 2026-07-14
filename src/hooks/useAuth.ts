import { trpc } from "@/providers/trpc";
import { useAuth as useClerkAuth, useUser, useClerk } from "@clerk/clerk-react";
import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { LOGIN_PATH } from "@/const";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = LOGIN_PATH } =
    options ?? {};

  const navigate = useNavigate();
  const clerkAuth = useClerkAuth();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { signOut } = useClerk();

  const utils = trpc.useUtils();

  const {
    data: user,
    isLoading: meLoading,
    error,
    refetch,
  } = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: clerkLoaded && clerkAuth.isSignedIn,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await signOut();
      await utils.invalidate();
      navigate(redirectPath);
    },
  });

  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);

  const isLoading = !clerkLoaded || meLoading;

  useEffect(() => {
    if (redirectOnUnauthenticated && !isLoading && !user) {
      const currentPath = window.location.pathname;
      if (currentPath !== redirectPath) {
        navigate(redirectPath);
      }
    }
  }, [redirectOnUnauthenticated, isLoading, user, navigate, redirectPath]);

  return useMemo(
    () => ({
      user: user ?? null,
      isAuthenticated: !!user,
      isLoading: isLoading || logoutMutation.isPending,
      error,
      logout,
      refresh: refetch,
      clerkUser: clerkUser ?? null,
    }),
    [user, isLoading, logoutMutation.isPending, error, logout, refetch, clerkUser],
  );
}
