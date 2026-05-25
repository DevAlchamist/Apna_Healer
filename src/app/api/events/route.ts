import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { eventListQuerySchema } from "@/lib/validators/event";
import { listEventsForUser } from "@/server/services/event-service";

const MEMBER_ROLES = [Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN] as const;

export async function GET(request: NextRequest) {
  try {
    const user = await requireSessionUser([...MEMBER_ROLES]);
    const filters = eventListQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const result = await listEventsForUser(user.id, user.role, {
      query: filters.q,
      clubId: filters.clubId,
      take: filters.take,
      cursor: filters.cursor,
    });
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
