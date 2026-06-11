import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { adminUnpublishBlog } from "@/server/services/blog-moderation-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireSessionUser([Role.ADMIN]);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const blog = await adminUnpublishBlog(id, user.id, body?.reason);
    return ok(blog);
  } catch (error) {
    return handleApiError(error);
  }
}
