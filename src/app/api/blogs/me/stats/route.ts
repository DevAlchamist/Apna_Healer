import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { getAuthorStats } from "@/server/services/blog-service";

const MEMBER_ROLES = [Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN] as const;

export async function GET() {
  try {
    const user = await requireSessionUser([...MEMBER_ROLES]);
    const stats = await getAuthorStats(user.id);
    return ok(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
