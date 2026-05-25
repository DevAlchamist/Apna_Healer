import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { notificationsQuerySchema } from "@/lib/validators/notification";
import { listNotificationsForUser } from "@/server/services/notification-service";

export async function GET(request: Request) {
  try {
    const sessionUser = await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const query = notificationsQuerySchema.parse({
      take: searchParams.get("take") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
      unreadOnly: searchParams.get("unreadOnly") ?? undefined,
    });

    const data = await listNotificationsForUser(sessionUser.id, query);
    return ok(data);
  } catch (error) {
    return handleApiError(error);
  }
}
