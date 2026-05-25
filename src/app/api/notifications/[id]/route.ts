import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { markNotificationReadSchema } from "@/lib/validators/notification";
import { markNotificationRead } from "@/server/services/notification-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionUser = await requireSessionUser();
    const { id } = await params;
    markNotificationReadSchema.parse(await request.json());
    const notification = await markNotificationRead(sessionUser.id, id);
    return ok(notification);
  } catch (error) {
    return handleApiError(error);
  }
}
