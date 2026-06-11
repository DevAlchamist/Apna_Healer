import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { listEventFacilitatorOptions } from "@/server/services/event-service";

const MEMBER_ROLES = [Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN] as const;

export async function GET() {
  try {
    await requireSessionUser([...MEMBER_ROLES]);
    const options = await listEventFacilitatorOptions();
    return ok(options);
  } catch (error) {
    return handleApiError(error);
  }
}
