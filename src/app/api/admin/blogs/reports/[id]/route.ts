import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { reviewBlogReportSchema } from "@/lib/validators/blog";
import { reviewBlogReport } from "@/server/services/blog-reaction-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireSessionUser([Role.ADMIN]);
    const { id } = await context.params;
    const body = reviewBlogReportSchema.parse(await request.json());
    const report = await reviewBlogReport(id, user.id, body);
    return ok(report);
  } catch (error) {
    return handleApiError(error);
  }
}
