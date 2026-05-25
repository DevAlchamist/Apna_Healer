import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { serializeListenerBookingRequest } from "@/lib/listener-request-serialize";
import { getListenerBookingRequestById } from "@/server/services/listener-booking-request-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const sessionUser = await requireSessionUser();
    const { id } = await context.params;
    const row = await getListenerBookingRequestById(id, sessionUser.id, sessionUser.role);
    const serialized = serializeListenerBookingRequest(row, {
      id: sessionUser.id,
      role: sessionUser.role,
    });
    return ok(serialized);
  } catch (error) {
    return handleApiError(error);
  }
}
