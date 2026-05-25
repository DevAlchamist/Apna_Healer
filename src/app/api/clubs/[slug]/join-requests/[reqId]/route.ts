import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { reviewJoinRequestSchema } from "@/lib/validators/club";
import { reviewClubJoinRequest } from "@/server/services/club-join-service";

const MEMBER_ROLES = [Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; reqId: string }> },
) {
  try {
    const user = await requireSessionUser([...MEMBER_ROLES]);
    const { reqId } = await params;
    const body = reviewJoinRequestSchema.parse(await request.json());
    const row = await reviewClubJoinRequest(reqId, user.id, user.role as Role, body);
    return ok({
      id: row.id,
      status: row.status,
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
