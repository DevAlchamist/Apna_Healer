import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { adminPatchUserSchema } from "@/lib/validators/user";
import { patchUserByAdmin } from "@/server/services/user-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionUser = await requireSessionUser([Role.ADMIN]);
    const { id } = await params;
    const body = adminPatchUserSchema.parse(await request.json());
    const user = await patchUserByAdmin(sessionUser.id, id, body);
    return ok(user);
  } catch (error) {
    return handleApiError(error);
  }
}
