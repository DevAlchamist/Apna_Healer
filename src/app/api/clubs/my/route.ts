import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { listMyClubMemberships } from "@/server/services/club-membership-service";

const MEMBER_ROLES = [Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN] as const;

export async function GET() {
  try {
    const user = await requireSessionUser([...MEMBER_ROLES]);
    const result = await listMyClubMemberships(user.id);
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
