import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { reviewCreationRequestSchema } from "@/lib/validators/club";
import { reviewClubCreationRequest } from "@/server/services/club-creation-request-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSessionUser([Role.ADMIN]);
    const { id } = await params;
    const body = reviewCreationRequestSchema.parse(await request.json());
    const result = await reviewClubCreationRequest(id, user.id, body);
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
