import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { patchUserProfileSchema } from "@/lib/validators/user-profile";
import { getUserMe, patchUserMe } from "@/server/services/user-service";

export async function GET() {
  try {
    const sessionUser = await requireSessionUser();
    const user = await getUserMe(sessionUser.id);
    return ok(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const sessionUser = await requireSessionUser();
    const body = patchUserProfileSchema.parse(await request.json());
    const user = await patchUserMe(sessionUser.id, body);
    return ok(user);
  } catch (error) {
    return handleApiError(error);
  }
}
