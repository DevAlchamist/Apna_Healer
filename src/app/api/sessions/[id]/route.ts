import { CareSessionStatus } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { updateSessionSchema } from "@/lib/validators/session";
import { getSessionById, updateSessionState } from "@/server/services/session-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionUser = await requireSessionUser();
    const { id } = await params;
    const session = await getSessionById(id, sessionUser.id, sessionUser.role);
    return ok(session);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionUser = await requireSessionUser();
    const { id } = await params;
    const input = updateSessionSchema.parse(await request.json());
    const resolvedStatus =
      input.status ??
      (input.endedAt ? CareSessionStatus.COMPLETED : undefined);
    const session = await updateSessionState({
      sessionId: id,
      actorId: sessionUser.id,
      actorRole: sessionUser.role,
      status: resolvedStatus,
      meetingLink: input.meetingLink,
      description: input.description,
      notes: input.notes,
      endedAt: input.endedAt,
    });
    return ok(session);
  } catch (error) {
    return handleApiError(error);
  }
}
