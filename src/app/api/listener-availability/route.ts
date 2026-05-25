import { Role } from "@prisma/client";
import { ok, handleApiError } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { assertRole } from "@/lib/authz";
import { replaceListenerScheduleSchema } from "@/lib/validators/listener-availability";
import {
  getListenerWeeklySchedule,
  replaceListenerWeeklySchedule,
} from "@/server/services/listener-availability-service";

/**
 * Returns the calling listener's own weekly availability windows.
 */
export async function GET() {
  try {
    const sessionUser = await requireSessionUser();
    assertRole(sessionUser.role, [Role.LISTENER, Role.ADMIN]);
    const windows = await getListenerWeeklySchedule(sessionUser.id);
    return ok({ windows });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Replaces the calling listener's weekly availability windows in one shot.
 * Admins cannot edit on behalf of a listener through this endpoint; they
 * manage the queue, not the schedule.
 */
export async function PUT(request: Request) {
  try {
    const sessionUser = await requireSessionUser();
    assertRole(sessionUser.role, [Role.LISTENER]);
    const input = replaceListenerScheduleSchema.parse(await request.json());
    const windows = await replaceListenerWeeklySchedule(
      sessionUser.id,
      input.windows,
    );
    return ok({ windows });
  } catch (error) {
    return handleApiError(error);
  }
}
