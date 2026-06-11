import { getServerSession } from "next-auth";
import { handleApiError, ok } from "@/lib/api-response";
import { authOptions } from "@/lib/auth";
import { getPublicBlogBySlug } from "@/server/services/blog-public-service";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const { slug } = await context.params;
    const blog = await getPublicBlogBySlug(slug, session?.user?.id);
    return ok(blog);
  } catch (error) {
    return handleApiError(error);
  }
}
