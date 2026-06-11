"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Role } from "@prisma/client";
import { apiFetch } from "@/lib/api-client";
import type { ApiRoleTheme } from "@/types/api";

export const ROLE_THEME_QUERY_KEY = "role-theme";

export function roleThemeQueryKey(role: Role) {
  return [ROLE_THEME_QUERY_KEY, role] as const;
}

export function useRoleTheme(role: Role | undefined) {
  return useQuery({
    queryKey: roleThemeQueryKey(role ?? "USER"),
    queryFn: () => apiFetch<ApiRoleTheme>("/api/themes/current"),
    enabled: Boolean(role),
    staleTime: 60_000,
  });
}

export function useAdminRoleThemes() {
  return useQuery({
    queryKey: ["admin-themes"],
    queryFn: () => apiFetch<ApiRoleTheme[]>("/api/admin/themes"),
    staleTime: 30_000,
  });
}

export function invalidateRoleThemeQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  role?: Role,
) {
  if (role) {
    void queryClient.invalidateQueries({ queryKey: roleThemeQueryKey(role) });
  } else {
    void queryClient.invalidateQueries({ queryKey: [ROLE_THEME_QUERY_KEY] });
  }
  void queryClient.invalidateQueries({ queryKey: ["admin-themes"] });
}
