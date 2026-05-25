import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { listMyRegistrations } from "@/server/services/event-registration-service";

const MEMBER_ROLES = [Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN] as const;

export async function GET() {
  try {
    const user = await requireSessionUser([...MEMBER_ROLES]);
    const registrations = await listMyRegistrations(user.id);
    return ok(registrations);
  } catch (error) {
    return handleApiError(error);
  }
}
