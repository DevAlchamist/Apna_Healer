import { Role } from "@prisma/client";
import { ok, handleApiError } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { assertRole } from "@/lib/authz";
import { replaceTherapistScheduleSchema } from "@/lib/validators/therapist-availability";
import {
  getTherapistWeeklySchedule,
  replaceTherapistWeeklySchedule,
} from "@/server/services/therapist-availability-service";

/**
 * Returns the calling therapist's own weekly availability windows.
 */
export async function GET() {
  try {
    const sessionUser = await requireSessionUser();
    assertRole(sessionUser.role, [Role.THERAPIST, Role.ADMIN]);
    const windows = await getTherapistWeeklySchedule(sessionUser.id);
    return ok({ windows });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Replaces the calling therapist's weekly availability windows in one shot.
 */
export async function PUT(request: Request) {
  try {
    const sessionUser = await requireSessionUser();
    assertRole(sessionUser.role, [Role.THERAPIST]);
    const input = replaceTherapistScheduleSchema.parse(await request.json());
    const windows = await replaceTherapistWeeklySchedule(
      sessionUser.id,
      input.windows,
    );
    return ok({ windows });
  } catch (error) {
    return handleApiError(error);
  }
}
