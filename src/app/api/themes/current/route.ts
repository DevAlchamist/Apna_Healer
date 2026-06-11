import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { getRoleTheme } from "@/server/services/role-theme-service";

const AUTH_ROLES = [Role.ADMIN, Role.USER, Role.THERAPIST, Role.LISTENER] as const;

export async function GET() {
  try {
    const user = await requireSessionUser([...AUTH_ROLES]);
    const theme = await getRoleTheme(user.role);
    return ok(theme, {
      headers: {
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
