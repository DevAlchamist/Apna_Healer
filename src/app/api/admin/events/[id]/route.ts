import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { updateEventSchema } from "@/lib/validators/event";
import { updateEvent } from "@/server/services/event-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSessionUser([Role.ADMIN]);
    const { id } = await params;
    const body = updateEventSchema.parse(await request.json());
    const event = await updateEvent(id, user.id, user.role, body);
    return ok(event);
  } catch (error) {
    return handleApiError(error);
  }
}
