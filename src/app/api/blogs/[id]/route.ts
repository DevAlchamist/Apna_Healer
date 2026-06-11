import { Role } from "@prisma/client";
import { handleApiError, noContent, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { updateBlogSchema } from "@/lib/validators/blog";
import {
  deleteBlog,
  getBlogById,
  getBlogPreview,
  publishBlog,
  unpublishBlog,
  updateBlog,
} from "@/server/services/blog-service";

const MEMBER_ROLES = [Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN] as const;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireSessionUser([...MEMBER_ROLES]);
    const { id } = await context.params;
    const blog = await getBlogById(id, user.id, user.role);
    return ok(blog);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireSessionUser([...MEMBER_ROLES]);
    const { id } = await context.params;
    const body = updateBlogSchema.parse(await request.json());
    const blog = await updateBlog(id, user.id, user.role, body);
    return ok(blog);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireSessionUser([...MEMBER_ROLES]);
    const { id } = await context.params;
    await deleteBlog(id, user.id, user.role);
    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
