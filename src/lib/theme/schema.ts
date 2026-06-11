import { z } from "zod";
import { ROLE_THEME_TOKEN_KEYS } from "@/lib/theme/types";

const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Must be a valid hex color (#RGB or #RRGGBB)");

const tokenShape = ROLE_THEME_TOKEN_KEYS.reduce(
  (acc, key) => {
    acc[key] = hexColorSchema;
    return acc;
  },
  {} as Record<(typeof ROLE_THEME_TOKEN_KEYS)[number], typeof hexColorSchema>,
);

export const roleThemeTokensSchema = z.object(tokenShape).strict();

export const updateRoleThemeSchema = z.object({
  tokens: roleThemeTokensSchema,
});

export type UpdateRoleThemeInput = z.infer<typeof updateRoleThemeSchema>;
