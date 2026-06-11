import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { adminBlogListQuerySchema } from "@/lib/validators/blog";
import { listAllBlogsForAdmin } from "@/server/services/blog-service";

export async function GET(request: NextRequest) {
  try {
    await requireSessionUser([Role.ADMIN]);
    const filters = adminBlogListQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const result = await listAllBlogsForAdmin(filters);
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
