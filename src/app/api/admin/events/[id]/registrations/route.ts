import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { listRegistrationsForEvent } from "@/server/services/event-registration-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSessionUser([Role.ADMIN]);
    const { id } = await params;
    const rows = await listRegistrationsForEvent(id, user.id, user.role);
    return ok(rows);
  } catch (error) {
    return handleApiError(error);
  }
}
