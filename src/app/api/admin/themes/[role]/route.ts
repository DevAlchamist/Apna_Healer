import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import {
  adminRoleParamSchema,
  updateRoleThemeSchema,
} from "@/lib/validators/role-theme";
import { updateRoleTheme } from "@/server/services/role-theme-service";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ role: string }> },
) {
  try {
    const user = await requireSessionUser([Role.ADMIN]);
    const { role: roleParam } = await params;
    const { role } = adminRoleParamSchema.parse({ role: roleParam });
    const body = updateRoleThemeSchema.parse(await request.json());
    const theme = await updateRoleTheme(role, body.tokens, user.id);
    return ok(theme);
  } catch (error) {
    return handleApiError(error);
  }
}
