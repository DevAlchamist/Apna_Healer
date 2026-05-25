import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { journalAutosaveSchema } from "@/lib/validators/journal";
import {
  autosaveJournalEntry,
  getJournalTodayPayload,
} from "@/server/services/journal-service";

const MEMBER_ROLES = [Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN] as const;

export async function GET(request: NextRequest) {
  try {
    const user = await requireSessionUser([...MEMBER_ROLES]);
    const date = request.nextUrl.searchParams.get("date") ?? undefined;
    const payload = await getJournalTodayPayload(user.id, date);
    return ok(payload);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireSessionUser([...MEMBER_ROLES]);
    const body = journalAutosaveSchema.parse(await request.json());
    const entry = await autosaveJournalEntry(user.id, body);
    return ok(entry);
  } catch (error) {
    return handleApiError(error);
  }
}
