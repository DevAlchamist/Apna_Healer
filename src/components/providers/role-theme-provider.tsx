"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import type { Role } from "@prisma/client";
import { getDefaultThemeTokensForRole } from "@/config/theme-defaults";
import {
  applyThemeTokens,
  readThemeFromStorage,
  setThemeLoading,
  writeThemeToStorage,
} from "@/lib/theme/apply-theme";
import type { RoleThemeTokens } from "@/lib/theme/types";
import { invalidateRoleThemeQueries, useRoleTheme } from "@/hooks/use-role-theme";
import { useQueryClient } from "@tanstack/react-query";

type RoleThemeContextValue = {
  role: Role | null;
  tokens: RoleThemeTokens | null;
  version: number;
  isLoading: boolean;
  applyPreview: (tokens: RoleThemeTokens) => void;
  clearPreview: () => void;
};

const RoleThemeContext = createContext<RoleThemeContextValue | null>(null);

export function useRoleThemeContext() {
  return useContext(RoleThemeContext);
}

type RoleThemeProviderProps = {
  children: ReactNode;
  /** When set, loads theme for this role instead of session role (admin preview). */
  overrideRole?: Role;
};

export function RoleThemeProvider({ children, overrideRole }: RoleThemeProviderProps) {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const previewRef = useRef<RoleThemeTokens | null>(null);
  const appliedVersionRef = useRef<number>(0);

  const role = overrideRole ?? session?.user?.role ?? null;
  const themeQuery = useRoleTheme(status === "authenticated" ? role ?? undefined : undefined);

  const applyTokens = useCallback(
    (tokens: RoleThemeTokens, version: number, persist: boolean) => {
      applyThemeTokens(tokens);
      appliedVersionRef.current = version;
      if (persist && role) {
        writeThemeToStorage(role, tokens, version);
      }
    },
    [role],
  );

  useEffect(() => {
    if (!role || status !== "authenticated") return;

    const cached = readThemeFromStorage(role);
    if (cached) {
      applyTokens(cached.tokens, cached.version, false);
    } else {
      const defaults = getDefaultThemeTokensForRole(role);
      applyTokens(defaults, 1, false);
    }
  }, [role, status, applyTokens]);

  useEffect(() => {
    if (!role || !themeQuery.data) return;
    if (previewRef.current) return;

    const { tokens, version } = themeQuery.data;
    if (version <= appliedVersionRef.current && readThemeFromStorage(role)?.version === version) {
      return;
    }
    applyTokens(tokens as RoleThemeTokens, version, true);
  }, [role, themeQuery.data, applyTokens]);

  const applyPreview = useCallback(
    (tokens: RoleThemeTokens) => {
      previewRef.current = tokens;
      applyThemeTokens(tokens);
    },
    [],
  );

  const clearPreview = useCallback(() => {
    previewRef.current = null;
    if (themeQuery.data && role) {
      applyTokens(themeQuery.data.tokens as RoleThemeTokens, themeQuery.data.version, true);
    }
    invalidateRoleThemeQueries(queryClient, role ?? undefined);
  }, [themeQuery.data, role, applyTokens, queryClient]);

  useEffect(() => {
    if (themeQuery.isLoading && role) {
      setThemeLoading();
    }
  }, [themeQuery.isLoading, role]);

  const value = useMemo<RoleThemeContextValue>(
    () => ({
      role,
      tokens: (themeQuery.data?.tokens as RoleThemeTokens | undefined) ?? null,
      version: themeQuery.data?.version ?? 1,
      isLoading: themeQuery.isLoading,
      applyPreview,
      clearPreview,
    }),
    [role, themeQuery.data, themeQuery.isLoading, applyPreview, clearPreview],
  );

  return <RoleThemeContext.Provider value={value}>{children}</RoleThemeContext.Provider>;
}
