import { Role } from "@prisma/client";
import { handleApiError, noContent, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { updateBlogSchema } from "@/lib/validators/blog";
import {
  adminDeleteBlog,
  adminGetBlogById,
  adminUpdateBlog,
} from "@/server/services/blog-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireSessionUser([Role.ADMIN]);
    const { id } = await context.params;
    const blog = await adminGetBlogById(id);
    return ok(blog);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireSessionUser([Role.ADMIN]);
    const { id } = await context.params;
    const body = updateBlogSchema.parse(await request.json());
    const blog = await adminUpdateBlog(id, user.id, body);
    return ok(blog);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireSessionUser([Role.ADMIN]);
    const { id } = await context.params;
    await adminDeleteBlog(id, user.id);
    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
