import type { Role } from "@prisma/client";
import { getDefaultThemeTokensForRole, ALL_THEME_ROLES } from "@/config/theme-defaults";
import { ApiError } from "@/lib/api-errors";
import { roleThemeTokensSchema } from "@/lib/theme/schema";
import type { RoleThemeTokens } from "@/lib/theme/types";
import { prisma } from "@/lib/prisma";
import {
  emitRoleThemeReset,
  emitRoleThemeUpdated,
} from "@/server/services/platform-events";

function parseStoredTokens(raw: unknown, role: Role): RoleThemeTokens {
  const defaults = getDefaultThemeTokensForRole(role);
  const merged = {
    ...defaults,
    ...(typeof raw === "object" && raw !== null ? (raw as Record<string, string>) : {}),
  };
  const parsed = roleThemeTokensSchema.safeParse(merged);
  if (!parsed.success) {
    return defaults;
  }
  return parsed.data;
}

function toApiTheme(row: {
  role: Role;
  tokens: unknown;
  version: number;
  isCustomized: boolean;
  updatedAt: Date;
  updatedById: string | null;
}) {
  return {
    role: row.role,
    tokens: parseStoredTokens(row.tokens, row.role),
    version: row.version,
    isCustomized: row.isCustomized,
    updatedAt: row.updatedAt.toISOString(),
    updatedById: row.updatedById,
  };
}

export async function ensureRoleThemesSeeded() {
  for (const role of ALL_THEME_ROLES) {
    const existing = await prisma.roleTheme.findUnique({ where: { role } });
    if (existing) continue;
    await prisma.roleTheme.create({
      data: {
        role,
        tokens: getDefaultThemeTokensForRole(role),
        version: 1,
        isCustomized: false,
      },
    });
  }
}

export async function getRoleTheme(role: Role) {
  await ensureRoleThemesSeeded();
  const row = await prisma.roleTheme.findUnique({ where: { role } });
  if (!row) {
    return {
      role,
      tokens: getDefaultThemeTokensForRole(role),
      version: 1,
      isCustomized: false,
      updatedAt: new Date().toISOString(),
      updatedById: null,
    };
  }
  return toApiTheme(row);
}

export async function listRoleThemes() {
  await ensureRoleThemesSeeded();
  const rows = await prisma.roleTheme.findMany({ orderBy: { role: "asc" } });
  return rows.map(toApiTheme);
}

export async function updateRoleTheme(
  role: Role,
  tokens: RoleThemeTokens,
  actorId: string,
) {
  if (!ALL_THEME_ROLES.includes(role)) {
    throw new ApiError(400, "Invalid role.", "INVALID_ROLE");
  }

  const validated = roleThemeTokensSchema.parse(tokens);
  await ensureRoleThemesSeeded();

  const existing = await prisma.roleTheme.findUnique({ where: { role } });
  const previousVersion = existing?.version ?? 1;

  const row = await prisma.roleTheme.upsert({
    where: { role },
    create: {
      role,
      tokens: validated,
      version: 1,
      isCustomized: true,
      updatedById: actorId,
    },
    update: {
      tokens: validated,
      version: { increment: 1 },
      isCustomized: true,
      updatedById: actorId,
    },
  });

  const changedKeys = existing
    ? (Object.keys(validated) as (keyof RoleThemeTokens)[]).filter(
        (key) =>
          parseStoredTokens(existing.tokens, role)[key] !== validated[key],
      )
    : Object.keys(validated);

  void emitRoleThemeUpdated({
    actorId,
    role,
    previousVersion,
    newVersion: row.version,
    changedKeys,
  }).catch(console.error);

  return toApiTheme(row);
}

export async function resetRoleTheme(role: Role, actorId: string) {
  if (!ALL_THEME_ROLES.includes(role)) {
    throw new ApiError(400, "Invalid role.", "INVALID_ROLE");
  }

  const defaults = getDefaultThemeTokensForRole(role);
  await ensureRoleThemesSeeded();

  const existing = await prisma.roleTheme.findUnique({ where: { role } });
  const previousVersion = existing?.version ?? 1;

  const row = await prisma.roleTheme.upsert({
    where: { role },
    create: {
      role,
      tokens: defaults,
      version: 1,
      isCustomized: false,
      updatedById: actorId,
    },
    update: {
      tokens: defaults,
      version: { increment: 1 },
      isCustomized: false,
      updatedById: actorId,
    },
  });

  void emitRoleThemeReset({
    actorId,
    role,
    previousVersion,
    newVersion: row.version,
  }).catch(console.error);

  return toApiTheme(row);
}
