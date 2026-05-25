import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { getClubBySlugForUser } from "@/server/services/club-service";

const MEMBER_ROLES = [Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const user = await requireSessionUser([...MEMBER_ROLES]);
    const { slug } = await params;
    const club = await getClubBySlugForUser(user.id, slug);
    return ok(club);
  } catch (error) {
    return handleApiError(error);
  }
}
