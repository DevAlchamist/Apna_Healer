import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { ownerUpdateClubSchema } from "@/lib/validators/club";
import { getClubBySlugForUser, mapDetail, updateClubBySlug } from "@/server/services/club-service";

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const user = await requireSessionUser([...MEMBER_ROLES]);
    const { slug } = await params;
    const body = ownerUpdateClubSchema.parse(await request.json());
    const club = await updateClubBySlug(slug, user.id, user.role, body);
    return ok(mapDetail(club, { userId: user.id, isMember: false, hasPendingJoin: false }));
  } catch (error) {
    return handleApiError(error);
  }
}
