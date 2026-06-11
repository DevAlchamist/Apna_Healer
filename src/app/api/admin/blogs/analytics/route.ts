import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { getBlogAnalyticsOverview } from "@/server/services/blog-analytics-service";

export async function GET() {
  try {
    await requireSessionUser([Role.ADMIN]);
    const analytics = await getBlogAnalyticsOverview();
    return ok(analytics);
  } catch (error) {
    return handleApiError(error);
  }
}
