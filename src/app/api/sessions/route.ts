import type { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { sessionQuerySchema } from "@/lib/validators/session";
import { listSessions } from "@/server/services/session-service";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await requireSessionUser();
    const filters = sessionQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const sessions = await listSessions(sessionUser.id, sessionUser.role, filters);
    return ok(sessions);
  } catch (error) {
    return handleApiError(error);
  }
}
