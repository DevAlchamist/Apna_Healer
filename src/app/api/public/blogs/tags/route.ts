import { handleApiError, ok } from "@/lib/api-response";
import { listBlogTags } from "@/server/services/blog-analytics-service";

export async function GET() {
  try {
    const tags = await listBlogTags();
    return ok(tags);
  } catch (error) {
    return handleApiError(error);
  }
}
