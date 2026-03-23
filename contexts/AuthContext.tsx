"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api, { getAuthToken, removeAuthToken } from "@/lib/api-client";
import { disconnectChat } from "@/lib/chatService";

export type AuthUser = {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role?: string;
  [key: string]: unknown;
} | null;

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  logout: () => void;
};

export const AUTH_ME_QUERY_KEY = ["auth", "me"] as const;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    setToken(getAuthToken());
    const syncToken = () => setToken(getAuthToken());
    window.addEventListener("auth-token-changed", syncToken);
    window.addEventListener("storage", (e) => {
      if (e.key === "authToken" || e.key === "authCookieSession") syncToken();
    });
    return () => {
      mounted.current = false;
      window.removeEventListener("auth-token-changed", syncToken);
    };
  }, []);

  const meQuery = useQuery<AuthUser>({
    queryKey: AUTH_ME_QUERY_KEY,
    enabled: !!token && mounted.current,
    queryFn: async () => {
      const res = await api.auth.getMe();
      if (!res.success || !res.data) throw new Error((res as any).error?.message || "Failed to load user");
      const payload = res.data as any;
      return payload.user ?? payload;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 0,
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user: token ? (meQuery.data ?? null) : null,
      isAuthenticated: !!token && !!meQuery.data,
      isLoading: !!token && meQuery.isLoading,
      error: (meQuery.error as Error)?.message || null,
      refresh: () => queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY }),
      logout: () => {
        disconnectChat();
        removeAuthToken();
        queryClient.removeQueries({ queryKey: AUTH_ME_QUERY_KEY });
      },
    }),
    [token, meQuery.data, meQuery.isLoading, meQuery.error, queryClient]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
