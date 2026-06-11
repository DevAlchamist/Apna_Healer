import type { Role } from "@prisma/client";

export const THEME_SCHEMA_VERSION = 1;

export type RoleThemeTokenKey =
  | "primary"
  | "primaryHover"
  | "primaryForeground"
  | "secondary"
  | "secondaryForeground"
  | "background"
  | "surface"
  | "surfaceMuted"
  | "border"
  | "borderMuted"
  | "textPrimary"
  | "textSecondary"
  | "textMuted"
  | "accent"
  | "accentForeground"
  | "badgeBg"
  | "badgeText"
  | "badgeSuccessBg"
  | "badgeSuccessText"
  | "badgeWarningBg"
  | "badgeWarningText"
  | "buttonPrimary"
  | "buttonPrimaryHover"
  | "buttonPrimaryText"
  | "buttonSecondary"
  | "buttonSecondaryText"
  | "statusSuccess"
  | "statusWarning"
  | "statusError"
  | "statusInfo"
  | "focusRing"
  | "bannerBg"
  | "heading";

export type RoleThemeTokens = Record<RoleThemeTokenKey, string>;

export type RoleThemeConfig = {
  role: Role;
  tokens: RoleThemeTokens;
  version: number;
  isCustomized: boolean;
  updatedAt: string;
  updatedById: string | null;
};

export const ROLE_THEME_TOKEN_KEYS = [
  "primary",
  "primaryHover",
  "primaryForeground",
  "secondary",
  "secondaryForeground",
  "background",
  "surface",
  "surfaceMuted",
  "border",
  "borderMuted",
  "textPrimary",
  "textSecondary",
  "textMuted",
  "accent",
  "accentForeground",
  "badgeBg",
  "badgeText",
  "badgeSuccessBg",
  "badgeSuccessText",
  "badgeWarningBg",
  "badgeWarningText",
  "buttonPrimary",
  "buttonPrimaryHover",
  "buttonPrimaryText",
  "buttonSecondary",
  "buttonSecondaryText",
  "statusSuccess",
  "statusWarning",
  "statusError",
  "statusInfo",
  "focusRing",
  "bannerBg",
  "heading",
] as const satisfies readonly RoleThemeTokenKey[];
