import type { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api-response";
import { publicBlogListQuerySchema } from "@/lib/validators/blog";
import { getPublicBlogs } from "@/server/services/blog-public-service";

export async function GET(request: NextRequest) {
  try {
    const filters = publicBlogListQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const result = await getPublicBlogs(filters);
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
