import { Role } from "@prisma/client";
import { handleApiError, created } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { clubJoinRequestSchema } from "@/lib/validators/club";
import { submitClubJoinRequest } from "@/server/services/club-join-service";

const MEMBER_ROLES = [Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN] as const;

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser([...MEMBER_ROLES]);
    const body = clubJoinRequestSchema.parse(await request.json());
    const row = await submitClubJoinRequest(user.id, body);
    return created({
      id: row.id,
      clubId: row.clubId,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
