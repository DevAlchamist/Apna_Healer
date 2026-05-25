import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { getAdminControlCenterDashboard } from "@/server/services/admin-overview-service";

export async function GET() {
  try {
    await requireSessionUser([Role.ADMIN]);
    const data = await getAdminControlCenterDashboard();
    return ok(data);
  } catch (error) {
    return handleApiError(error);
  }
}
