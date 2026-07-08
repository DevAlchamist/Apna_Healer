import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { markWelcomeBonusClaimed } from "@/server/services/welcome-bonus-service";

export async function POST() {
  try {
    const sessionUser = await requireSessionUser([Role.USER]);
    const result = await markWelcomeBonusClaimed(sessionUser.id);
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
