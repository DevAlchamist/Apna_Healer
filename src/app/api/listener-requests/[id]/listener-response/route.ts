import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { assertRole } from "@/lib/authz";
import { requireSessionUser } from "@/lib/session-auth";
import { listenerResponseSchema } from "@/lib/validators/listener-booking-request";
import { listenerRespondToRequest } from "@/server/services/listener-booking-request-service";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const sessionUser = await requireSessionUser();
    assertRole(sessionUser.role, [Role.LISTENER]);
    const { id } = await context.params;
    const body = listenerResponseSchema.parse(await request.json());
    const updated = await listenerRespondToRequest({
      requestId: id,
      listenerId: sessionUser.id,
      decision: body.decision,
    });
    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
