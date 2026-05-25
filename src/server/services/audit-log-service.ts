import type { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ApiAuditLogEntry, ApiAuditLogListResponse } from "@/types/api";
import type { SanitizedAuditDetails } from "@/server/services/audit-log-sanitizers";
import { auditActionCategory } from "@/lib/audit-display";

export type RecordAuditLogInput = {
  action: AuditAction;
  actorId?: string | null;
  actorEmail?: string | null;
  targetType: string;
  targetId: string;
  summary: string;
  details?: SanitizedAuditDetails | null;
};

function toApiAuditLog(row: {
  id: string;
  action: AuditAction;
  actorId: string | null;
  actorEmail: string | null;
  targetType: string;
  targetId: string;
  summary: string;
  details: Prisma.JsonValue | null;
  createdAt: Date;
}): ApiAuditLogEntry {
  return {
    id: row.id,
    action: row.action,
    actorId: row.actorId,
    actorEmail: row.actorEmail,
    targetType: row.targetType,
    targetId: row.targetId,
    summary: row.summary,
    details: (row.details as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function recordAuditLog(input: RecordAuditLogInput) {
  let actorEmail = input.actorEmail ?? null;

  if (!actorEmail && input.actorId) {
    const actor = await prisma.user.findUnique({
      where: { id: input.actorId },
      select: { email: true },
    });
    actorEmail = actor?.email ?? null;
  }

  return prisma.auditLog.create({
    data: {
      action: input.action,
      actorId: input.actorId ?? null,
      actorEmail,
      targetType: input.targetType,
      targetId: input.targetId,
      summary: input.summary,
      details: (input.details ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function listAuditLogsForAdmin(filters: {
  action?: AuditAction;
  targetType?: string;
  category?: string;
  take?: number;
  cursor?: string;
}): Promise<ApiAuditLogListResponse> {
  const take = Math.min(filters.take ?? 50, 100);

  const where: Prisma.AuditLogWhereInput = {
    ...(filters.targetType ? { targetType: filters.targetType } : {}),
    ...(filters.action
      ? { action: filters.action }
      : filters.category
        ? { action: categoryToActions(filters.category) }
        : {}),
  };

  const rows = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(filters.cursor
      ? {
          cursor: { id: filters.cursor },
          skip: 1,
        }
      : {}),
  });

  const hasMore = rows.length > take;
  const items = (hasMore ? rows.slice(0, take) : rows).map(toApiAuditLog);

  return {
    items,
    meta: {
      take,
      cursor: filters.cursor ?? null,
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    },
  };
}

function categoryToActions(category: string): AuditAction | { in: AuditAction[] } {
  switch (category) {
    case "users":
      return "USER_UPDATED_BY_ADMIN";
    case "applications":
      return "APPLICATION_REVIEWED";
    case "bookings":
      return { in: ["BOOKING_STATUS_CHANGED", "LISTENER_REQUEST_UPDATED"] };
    case "sessions":
      return "SESSION_STATUS_CHANGED";
    case "payouts":
      return "WALLET_TRANSACTION";
    default:
      return { in: [] };
  }
}

export { auditActionCategory };
