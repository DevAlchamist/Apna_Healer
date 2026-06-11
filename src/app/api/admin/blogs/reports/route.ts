import type { NextRequest } from "next/server";
import { BlogReportStatus, Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { listBlogReports } from "@/server/services/blog-reaction-service";

export async function GET(request: NextRequest) {
  try {
    await requireSessionUser([Role.ADMIN]);
    const statusParam = request.nextUrl.searchParams.get("status");
    const status =
      statusParam && Object.values(BlogReportStatus).includes(statusParam as BlogReportStatus)
        ? (statusParam as BlogReportStatus)
        : undefined;
    const reports = await listBlogReports(status);
    return ok(reports);
  } catch (error) {
    return handleApiError(error);
  }
}
