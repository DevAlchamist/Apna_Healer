import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { journalListQuerySchema } from "@/lib/validators/journal";
import { listJournalEntries } from "@/server/services/journal-service";

const MEMBER_ROLES = [Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN] as const;

export async function GET(request: NextRequest) {
  try {
    const user = await requireSessionUser([...MEMBER_ROLES]);
    const filters = journalListQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const result = await listJournalEntries(user.id, filters);
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
