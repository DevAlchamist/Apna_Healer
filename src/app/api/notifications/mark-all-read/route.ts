import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { markAllNotificationsRead } from "@/server/services/notification-service";

export async function POST() {
  try {
    const sessionUser = await requireSessionUser();
    const result = await markAllNotificationsRead(sessionUser.id);
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
