import { Role } from "@prisma/client";
import { handleApiError, created } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { clubCreationRequestSchema } from "@/lib/validators/club";
import { submitClubCreationRequest } from "@/server/services/club-creation-request-service";

const MEMBER_ROLES = [Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN] as const;

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser([...MEMBER_ROLES]);
    const body = clubCreationRequestSchema.parse(await request.json());
    const row = await submitClubCreationRequest(user.id, body);
    return created({
      id: row.id,
      status: row.status,
      title: row.title,
      createdAt: row.createdAt.toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
