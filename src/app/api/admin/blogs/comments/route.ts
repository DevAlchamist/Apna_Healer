import type { NextRequest } from "next/server";
import { BlogCommentStatus, Role } from "@prisma/client";
import { handleApiError, noContent, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import {
  adminDeleteComment,
  listCommentsForAdmin,
  moderateComment,
} from "@/server/services/blog-comment-service";

export async function GET(request: NextRequest) {
  try {
    await requireSessionUser([Role.ADMIN]);
    const statusParam = request.nextUrl.searchParams.get("status");
    const status =
      statusParam && Object.values(BlogCommentStatus).includes(statusParam as BlogCommentStatus)
        ? (statusParam as BlogCommentStatus)
        : undefined;
    const comments = await listCommentsForAdmin({ status });
    return ok(comments);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireSessionUser([Role.ADMIN]);
    const body = await request.json();
    const comment = await moderateComment(body.commentId, user.id, body.status);
    return ok(comment);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireSessionUser([Role.ADMIN]);
    const body = await request.json();
    await adminDeleteComment(body.commentId, user.id);
    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
