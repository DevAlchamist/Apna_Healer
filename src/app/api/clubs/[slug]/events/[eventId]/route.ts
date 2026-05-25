import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { updateEventSchema } from "@/lib/validators/event";
import { updateEvent } from "@/server/services/event-service";

const MEMBER_ROLES = [Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; eventId: string }> },
) {
  try {
    const user = await requireSessionUser([...MEMBER_ROLES]);
    const { eventId } = await params;
    const body = updateEventSchema.parse(await request.json());
    const event = await updateEvent(eventId, user.id, user.role, body);
    return ok(event);
  } catch (error) {
    return handleApiError(error);
  }
}
