import { Role } from "@prisma/client";
import { handleApiError, noContent, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { updateBlogCommentSchema } from "@/lib/validators/blog";
import { deleteBlogComment, updateBlogComment } from "@/server/services/blog-comment-service";

type RouteContext = { params: Promise<{ slug: string; id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireSessionUser([Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN]);
    const { slug, id } = await context.params;
    const body = updateBlogCommentSchema.parse(await request.json());
    const comment = await updateBlogComment(slug, id, user.id, user.role, body);
    return ok(comment);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireSessionUser([Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN]);
    const { slug, id } = await context.params;
    await deleteBlogComment(slug, id, user.id, user.role);
    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
