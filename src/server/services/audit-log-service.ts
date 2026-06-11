import type { AuditAction, Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ApiAuditLogEntry, ApiAuditLogListResponse } from "@/types/api";
import type { SanitizedAuditDetails } from "@/server/services/audit-log-sanitizers";
import {
  auditActionCategory,
  auditEntityLabel,
  deriveAuditStatus,
  resolveAuditIpAddress,
} from "@/lib/audit-display";

export type RecordAuditLogInput = {
  action: AuditAction;
  actorId?: string | null;
  actorEmail?: string | null;
  targetType: string;
  targetId: string;
  summary: string;
  details?: SanitizedAuditDetails | null;
};

type AuditLogRow = {
  id: string;
  action: AuditAction;
  actorId: string | null;
  actorEmail: string | null;
  targetType: string;
  targetId: string;
  summary: string;
  details: Prisma.JsonValue | null;
  createdAt: Date;
  actor: {
    name: string | null;
    email: string;
    role: Role;
    image: string | null;
  } | null;
};

function toApiAuditLog(row: AuditLogRow): ApiAuditLogEntry {
  const entry: ApiAuditLogEntry = {
    id: row.id,
    action: row.action,
    actorId: row.actorId,
    actorEmail: row.actorEmail ?? row.actor?.email ?? null,
    actorName: row.actor?.name ?? null,
    actorRole: row.actor?.role ?? null,
    actorImage: row.actor?.image ?? null,
    targetType: row.targetType,
    targetId: row.targetId,
    summary: row.summary,
    entityLabel: auditEntityLabel(row.targetType),
    status: "success",
    ipAddress: "Platform",
    details: (row.details as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt.toISOString(),
  };

  entry.status = deriveAuditStatus(entry);
  entry.ipAddress = resolveAuditIpAddress(entry);

  return entry;
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
  role?: Role | "SYSTEM";
  days?: number;
  page?: number;
  take?: number;
  cursor?: string;
}): Promise<ApiAuditLogListResponse> {
  const take = Math.min(filters.take ?? 10, 100);
  const page = Math.max(filters.page ?? 1, 1);

  const where: Prisma.AuditLogWhereInput = {
    ...(filters.targetType ? { targetType: filters.targetType } : {}),
    ...(filters.action
      ? { action: filters.action }
      : filters.category
        ? { action: categoryToActions(filters.category) }
        : {}),
  };

  if (filters.role === "SYSTEM") {
    where.actorId = null;
  } else if (filters.role) {
    where.actor = { role: filters.role };
  }

  if (filters.days) {
    const from = new Date();
    from.setDate(from.getDate() - filters.days);
    where.createdAt = { gte: from };
  }

  if (filters.cursor) {
    const rows = await prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: { name: true, email: true, role: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      cursor: { id: filters.cursor },
      skip: 1,
    });

    const hasMore = rows.length > take;
    const slice = hasMore ? rows.slice(0, take) : rows;
    const items = slice.map((row) => toApiAuditLog(row as AuditLogRow));

    return {
      items,
      meta: {
        take,
        page: 1,
        total: items.length,
        totalPages: 1,
        cursor: filters.cursor ?? null,
        nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
      },
    };
  }

  const skip = (page - 1) * take;

  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: { name: true, email: true, role: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
  ]);

  const items = rows.map((row) => toApiAuditLog(row as AuditLogRow));
  const totalPages = Math.max(1, Math.ceil(total / take));

  return {
    items,
    meta: {
      take,
      page,
      total,
      totalPages,
      cursor: null,
      nextCursor: page < totalPages ? items[items.length - 1]?.id ?? null : null,
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
    case "clubs":
      return {
        in: [
          "CLUB_CREATED",
          "CLUB_UPDATED",
          "CLUB_CREATION_REVIEWED",
          "CLUB_JOIN_REVIEWED",
          "CLUB_MEMBERSHIP_BILLING",
        ],
      };
    case "events":
      return {
        in: ["EVENT_CREATED", "EVENT_UPDATED", "EVENT_REGISTRATION_CREATED"],
      };
    default:
      return { in: [] };
  }
}

export { auditActionCategory };
