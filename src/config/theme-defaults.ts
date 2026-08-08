import type { Role } from "@prisma/client";
import type { RoleThemeTokens } from "@/lib/theme/types";

/** Member dashboard palette (USER / THERAPIST / LISTENER share identical factory defaults). */
export const MEMBER_THEME_DEFAULTS: RoleThemeTokens = {
  primary: "#7faf9a",
  primaryHover: "#6a9d87",
  primaryForeground: "#ffffff",
  secondary: "#2f5d50",
  secondaryForeground: "#ffffff",
  background: "#f7f5f2",
  surface: "#ffffff",
  surfaceMuted: "#faf9f6",
  border: "#e8dcd0",
  borderMuted: "#ebe8e2",
  textPrimary: "#2b2b2b",
  textSecondary: "#2f5d50",
  textMuted: "#6b7573",
  accent: "#e8dcd0",
  accentForeground: "#2b2b2b",
  badgeBg: "#eef0f0",
  badgeText: "#6b7574",
  badgeSuccessBg: "#c9f2df",
  badgeSuccessText: "#2f745f",
  badgeWarningBg: "#efe2d2",
  badgeWarningText: "#9f774f",
  buttonPrimary: "#2f745f",
  buttonPrimaryHover: "#245d4c",
  buttonPrimaryText: "#ffffff",
  buttonSecondary: "#f0f0ed",
  buttonSecondaryText: "#3d4543",
  statusSuccess: "#2f745f",
  statusWarning: "#9f774f",
  statusError: "#cf4f45",
  statusInfo: "#688d7b",
  focusRing: "#2f6f5b",
  bannerBg: "#2f5d50",
  heading: "#2f5d50",
  sidebarBg: "#2f5d50",
  sidebarText: "#cde8df",
  sidebarActiveBg: "#3a7061",
  sidebarActiveText: "#ffffff",
};

/** Admin console palette (distinct from member dashboard). */
export const ADMIN_THEME_DEFAULTS: RoleThemeTokens = {
  primary: "#2f6f5b",
  primaryHover: "#245d4c",
  primaryForeground: "#ffffff",
  secondary: "#243230",
  secondaryForeground: "#ffffff",
  background: "#f7f5f2",
  surface: "#ffffff",
  surfaceMuted: "#faf9f6",
  border: "#e4ddd3",
  borderMuted: "#ebe6de",
  textPrimary: "#243230",
  textSecondary: "#2f6f5b",
  textMuted: "#6b7573",
  accent: "#ebe4d6",
  accentForeground: "#5c5348",
  badgeBg: "#eef0f0",
  badgeText: "#6b7574",
  badgeSuccessBg: "#e3f0eb",
  badgeSuccessText: "#2f6f5b",
  badgeWarningBg: "#f3efe9",
  badgeWarningText: "#7a6a58",
  buttonPrimary: "#2f6f5b",
  buttonPrimaryHover: "#245d4c",
  buttonPrimaryText: "#ffffff",
  buttonSecondary: "#f0f0ed",
  buttonSecondaryText: "#3d4543",
  statusSuccess: "#2f6f5b",
  statusWarning: "#9f774f",
  statusError: "#cf4f45",
  statusInfo: "#5c6664",
  focusRing: "#2f6f5b",
  bannerBg: "#1e3d36",
  heading: "#1f2827",
  sidebarBg: "#1c2826",
  sidebarText: "#96a2a0",
  sidebarActiveBg: "#2d3c3a",
  sidebarActiveText: "#ffffff",
};

export function getDefaultThemeTokensForRole(role: Role): RoleThemeTokens {
  if (role === "ADMIN") {
    return { ...ADMIN_THEME_DEFAULTS };
  }
  return { ...MEMBER_THEME_DEFAULTS };
}

export const ALL_THEME_ROLES: Role[] = ["ADMIN", "USER", "THERAPIST", "LISTENER"];

export function getAllDefaultThemes(): Record<Role, RoleThemeTokens> {
  return {
    ADMIN: getDefaultThemeTokensForRole("ADMIN"),
    USER: getDefaultThemeTokensForRole("USER"),
    THERAPIST: getDefaultThemeTokensForRole("THERAPIST"),
    LISTENER: getDefaultThemeTokensForRole("LISTENER"),
  };
}
