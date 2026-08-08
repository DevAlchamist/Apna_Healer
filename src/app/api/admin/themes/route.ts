import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { listRoleThemes } from "@/server/services/role-theme-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSessionUser([Role.ADMIN]);
    const themes = await listRoleThemes();
    return ok(themes);
  } catch (error) {
    return handleApiError(error);
  }
}
