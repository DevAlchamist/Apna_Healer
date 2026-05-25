import { Role } from "@prisma/client";
import { ApiError } from "@/lib/api-errors";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { getJournalEntryById } from "@/server/services/journal-service";

const MEMBER_ROLES = [Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN] as const;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSessionUser([...MEMBER_ROLES]);
    const { id } = await context.params;
    const entry = await getJournalEntryById(user.id, id);
    if (!entry) {
      throw new ApiError(404, "Journal entry not found.", "NOT_FOUND");
    }
    return ok(entry);
  } catch (error) {
    return handleApiError(error);
  }
}
