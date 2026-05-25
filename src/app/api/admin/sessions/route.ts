import { Role } from "@prisma/client";
import type { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { adminSessionsQuerySchema } from "@/lib/validators/admin-session";
import { getAdminSessionsDashboard } from "@/server/services/admin-session-service";

export async function GET(request: NextRequest) {
  try {
    await requireSessionUser([Role.ADMIN]);
    const query = adminSessionsQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const data = await getAdminSessionsDashboard(query);
    return ok(data);
  } catch (error) {
    return handleApiError(error);
  }
}
