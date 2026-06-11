import { Role } from "@prisma/client";
import { created, handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { blogCommentSchema } from "@/lib/validators/blog";
import { createBlogComment, listBlogComments } from "@/server/services/blog-comment-service";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const comments = await listBlogComments(slug);
    return ok(comments);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireSessionUser([Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN]);
    const { slug } = await context.params;
    const body = blogCommentSchema.parse(await request.json());
    const comment = await createBlogComment(slug, user.id, body);
    return created(comment);
  } catch (error) {
    return handleApiError(error);
  }
}
