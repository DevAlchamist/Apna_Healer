import { Role } from "@prisma/client";
import { created, handleApiError } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { blogReportSchema } from "@/lib/validators/blog";
import { reportComment } from "@/server/services/blog-reaction-service";

type RouteContext = { params: Promise<{ slug: string; id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireSessionUser([Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN]);
    const { slug, id } = await context.params;
    const body = blogReportSchema.parse(await request.json());
    const report = await reportComment(slug, id, user.id, body);
    return created(report);
  } catch (error) {
    return handleApiError(error);
  }
}
