import { Role } from "@prisma/client";
import { ApiError } from "@/lib/api-errors";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { journalAutosaveSchema } from "@/lib/validators/journal";
import { completeJournalEntry } from "@/server/services/journal-service";

const MEMBER_ROLES = [Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN] as const;

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser([...MEMBER_ROLES]);
    const body = journalAutosaveSchema.parse(await request.json());
    try {
      const result = await completeJournalEntry(user.id, body);
      return ok(result);
    } catch (err) {
      if (err instanceof Error && err.message.includes("empty")) {
        throw new ApiError(400, "Write something before saving your entry.", "VALIDATION_ERROR");
      }
      throw err;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
