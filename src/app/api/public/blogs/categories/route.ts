import { handleApiError, ok } from "@/lib/api-response";
import { listBlogCategories } from "@/server/services/blog-analytics-service";

export async function GET() {
  try {
    const categories = await listBlogCategories();
    return ok(categories);
  } catch (error) {
    return handleApiError(error);
  }
}
