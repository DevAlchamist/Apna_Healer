import { getServerSession } from "next-auth";
import { handleApiError, ok } from "@/lib/api-response";
import { authOptions } from "@/lib/auth";
import { blogViewSchema } from "@/lib/validators/blog";
import { recordBlogView } from "@/server/services/blog-reaction-service";

type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const { slug } = await context.params;
    const body = blogViewSchema.parse(await request.json());
    const result = await recordBlogView(slug, body.sessionHash, session?.user?.id);
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
