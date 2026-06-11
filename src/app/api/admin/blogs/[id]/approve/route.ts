import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { approveBlog } from "@/server/services/blog-moderation-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const user = await requireSessionUser([Role.ADMIN]);
    const { id } = await context.params;
    const blog = await approveBlog(id, user.id);
    return ok(blog);
  } catch (error) {
    return handleApiError(error);
  }
}
