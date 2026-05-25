import type { NextRequest } from "next/server";
import { ClubRequestStatus, Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { listJoinRequestsAdmin } from "@/server/services/club-join-service";

export async function GET(request: NextRequest) {
  try {
    await requireSessionUser([Role.ADMIN]);
    const statusParam = request.nextUrl.searchParams.get("status");
    const status =
      statusParam && Object.values(ClubRequestStatus).includes(statusParam as ClubRequestStatus)
        ? (statusParam as ClubRequestStatus)
        : undefined;
    const rows = await listJoinRequestsAdmin(status);
    return ok(
      rows.map((r) => ({
        id: r.id,
        clubId: r.clubId,
        userId: r.userId,
        message: r.message,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        user: r.user,
        club: r.club,
      })),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
