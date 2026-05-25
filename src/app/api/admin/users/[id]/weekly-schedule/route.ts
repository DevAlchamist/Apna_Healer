import { Role } from "@prisma/client";
import { ok, handleApiError } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import { getListenerWeeklySchedule } from "@/server/services/listener-availability-service";
import { getTherapistWeeklySchedule } from "@/server/services/therapist-availability-service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireSessionUser([Role.ADMIN]);
    const { id } = await context.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });

    if (!user) {
      throw new ApiError(404, "User was not found.", "USER_NOT_FOUND");
    }

    if (user.role === Role.THERAPIST) {
      const windows = await getTherapistWeeklySchedule(id);
      return ok({ windows });
    }

    if (user.role === Role.LISTENER) {
      const windows = await getListenerWeeklySchedule(id);
      return ok({ windows });
    }

    return ok({ windows: [] });
  } catch (error) {
    return handleApiError(error);
  }
}
