import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { rejectBlogSchema } from "@/lib/validators/blog";
import { rejectBlog } from "@/server/services/blog-moderation-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireSessionUser([Role.ADMIN]);
    const { id } = await context.params;
    const body = rejectBlogSchema.parse(await request.json());
    const blog = await rejectBlog(id, user.id, body);
    return ok(blog);
  } catch (error) {
    return handleApiError(error);
  }
}
