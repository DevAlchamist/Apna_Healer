import type { RoleThemeTokenKey } from "@/lib/theme/types";

export const THEME_TOKEN_GROUPS: { title: string; keys: RoleThemeTokenKey[] }[] = [
  {
    title: "Brand",
    keys: ["primary", "primaryHover", "primaryForeground", "secondary", "secondaryForeground"],
  },
  {
    title: "Surfaces",
    keys: ["background", "surface", "surfaceMuted", "border", "borderMuted"],
  },
  {
    title: "Text",
    keys: ["textPrimary", "textSecondary", "textMuted", "heading"],
  },
  {
    title: "Accent",
    keys: ["accent", "accentForeground"],
  },
  {
    title: "Badge",
    keys: [
      "badgeBg",
      "badgeText",
      "badgeSuccessBg",
      "badgeSuccessText",
      "badgeWarningBg",
      "badgeWarningText",
    ],
  },
  {
    title: "Button",
    keys: [
      "buttonPrimary",
      "buttonPrimaryHover",
      "buttonPrimaryText",
      "buttonSecondary",
      "buttonSecondaryText",
    ],
  },
  {
    title: "Status",
    keys: ["statusSuccess", "statusWarning", "statusError", "statusInfo"],
  },
  {
    title: "Admin shell",
    keys: ["bannerBg", "focusRing"],
  },
];

export const TOKEN_LABELS: Record<RoleThemeTokenKey, string> = {
  primary: "Primary",
  primaryHover: "Primary hover",
  primaryForeground: "Primary text",
  secondary: "Secondary",
  secondaryForeground: "Secondary text",
  background: "Background",
  surface: "Surface",
  surfaceMuted: "Surface muted",
  border: "Border",
  borderMuted: "Border muted",
  textPrimary: "Text primary",
  textSecondary: "Text secondary",
  textMuted: "Text muted",
  accent: "Accent",
  accentForeground: "Accent text",
  badgeBg: "Badge background",
  badgeText: "Badge text",
  badgeSuccessBg: "Success badge bg",
  badgeSuccessText: "Success badge text",
  badgeWarningBg: "Warning badge bg",
  badgeWarningText: "Warning badge text",
  buttonPrimary: "Primary button",
  buttonPrimaryHover: "Primary button hover",
  buttonPrimaryText: "Primary button text",
  buttonSecondary: "Secondary button",
  buttonSecondaryText: "Secondary button text",
  statusSuccess: "Success",
  statusWarning: "Warning",
  statusError: "Error",
  statusInfo: "Info",
  focusRing: "Focus ring",
  bannerBg: "Banner background",
  heading: "Heading",
};
