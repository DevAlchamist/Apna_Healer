import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { listAllRegistrationsAdmin } from "@/server/services/event-registration-service";

export async function GET() {
  try {
    await requireSessionUser([Role.ADMIN]);
    const rows = await listAllRegistrationsAdmin();
    return ok(rows);
  } catch (error) {
    return handleApiError(error);
  }
}
