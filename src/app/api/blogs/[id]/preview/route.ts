import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { getBlogPreview } from "@/server/services/blog-service";

const MEMBER_ROLES = [Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN] as const;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireSessionUser([...MEMBER_ROLES]);
    const { id } = await context.params;
    const blog = await getBlogPreview(id, user.id, user.role);
    return ok(blog);
  } catch (error) {
    return handleApiError(error);
  }
}
