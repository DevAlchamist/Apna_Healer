"use client";

import { useMemo } from "react";
import { useRoleThemeContext } from "@/components/providers/role-theme-provider";
import { readThemeCssVar } from "@/lib/theme/read-css-var";

/** Runtime palette for pages that use inline styles (e.g. consultations). */
export function useThemePalette() {
  const ctx = useRoleThemeContext();
  const version = ctx?.version ?? 1;

  return useMemo(
    () => ({
      forest: readThemeCssVar("--theme-secondary", "#2D5A4C"),
      mint: readThemeCssVar("--theme-primary", "#B8E6D3"),
      peach: readThemeCssVar("--theme-accent", "#E9D5C8"),
      beige: readThemeCssVar("--theme-border", "#E9E0D3"),
      error: readThemeCssVar("--theme-status-error", "#cf4f45"),
      buttonPrimary: readThemeCssVar("--theme-button-primary", "#2D5A4C"),
    }),
    [version],
  );
}
