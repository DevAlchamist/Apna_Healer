import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { adminRoleParamSchema } from "@/lib/validators/role-theme";
import { resetRoleTheme } from "@/server/services/role-theme-service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ role: string }> },
) {
  try {
    const user = await requireSessionUser([Role.ADMIN]);
    const { role: roleParam } = await params;
    const { role } = adminRoleParamSchema.parse({ role: roleParam });
    const theme = await resetRoleTheme(role, user.id);
    return ok(theme);
  } catch (error) {
    return handleApiError(error);
  }
}
