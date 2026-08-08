import type { Role } from "@prisma/client";
import { TOKEN_TO_CSS_VAR } from "@/lib/theme/css-var-map";
import type { RoleThemeTokenKey, RoleThemeTokens } from "@/lib/theme/types";
import { ROLE_THEME_TOKEN_KEYS } from "@/lib/theme/types";
import { getDefaultThemeTokensForRole } from "@/config/theme-defaults";

export function applyThemeTokens(
  tokens: RoleThemeTokens,
  target: HTMLElement = document.documentElement,
): void {
  for (const key of ROLE_THEME_TOKEN_KEYS) {
    const cssVar = TOKEN_TO_CSS_VAR[key as RoleThemeTokenKey];
    target.style.setProperty(cssVar, tokens[key as RoleThemeTokenKey]);
  }
  target.removeAttribute("data-theme-loading");
}

export function clearAppliedTheme(target: HTMLElement = document.documentElement): void {
  for (const cssVar of Object.values(TOKEN_TO_CSS_VAR)) {
    target.style.removeProperty(cssVar);
  }
}

export function setThemeLoading(target: HTMLElement = document.documentElement): void {
  target.setAttribute("data-theme-loading", "true");
}

export function themeStorageKey(role: Role, version: number): string {
  return `apna-healer-theme:${role}:v${version}`;
}

export function readThemeFromStorage(role: Role): {
  tokens: RoleThemeTokens;
  version: number;
} | null {
  if (typeof window === "undefined") return null;

  const prefix = `apna-healer-theme:${role}:v`;
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key?.startsWith(prefix)) continue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { tokens: RoleThemeTokens; version: number };
      if (parsed.tokens && typeof parsed.version === "number") {
        const defaults = getDefaultThemeTokensForRole(role);
        return {
          tokens: {
            ...defaults,
            ...parsed.tokens,
          },
          version: parsed.version,
        };
      }
    } catch {
      /* ignore corrupt cache */
    }
  }
  return null;
}

export function writeThemeToStorage(
  role: Role,
  tokens: RoleThemeTokens,
  version: number,
): void {
  if (typeof window === "undefined") return;

  const prefix = `apna-healer-theme:${role}:v`;
  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (key?.startsWith(`apna-healer-theme:${role}:`)) {
      localStorage.removeItem(key);
    }
  }
  localStorage.setItem(themeStorageKey(role, version), JSON.stringify({ tokens, version }));
}

export function mergeThemeTokens(
  base: RoleThemeTokens,
  partial: Partial<RoleThemeTokens>,
): RoleThemeTokens {
  return { ...base, ...partial };
}
