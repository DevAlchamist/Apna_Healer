import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { adminAuditQuerySchema } from "@/lib/validators/audit-log";
import { listAuditLogsForAdmin } from "@/server/services/audit-log-service";

export async function GET(request: Request) {
  try {
    await requireSessionUser([Role.ADMIN]);
    const { searchParams } = new URL(request.url);
    const query = adminAuditQuerySchema.parse({
      take: searchParams.get("take") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
      days: searchParams.get("days") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      action: searchParams.get("action") ?? undefined,
      role: searchParams.get("role") ?? undefined,
      targetType: searchParams.get("targetType") ?? undefined,
    });

    const data = await listAuditLogsForAdmin({
      take: query.take,
      page: query.page,
      cursor: query.cursor,
      days: query.days,
      category: query.category,
      action: query.action,
      role: query.role,
      targetType: query.targetType,
    });

    return ok(data);
  } catch (error) {
    return handleApiError(error);
  }
}
