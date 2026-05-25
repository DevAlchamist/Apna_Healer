import type { NextRequest } from "next/server";
import { ClubRequestStatus, Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { getClubBySlugForUser } from "@/server/services/club-service";
import { listJoinRequestsForClub } from "@/server/services/club-join-service";

const MEMBER_ROLES = [Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const user = await requireSessionUser([...MEMBER_ROLES]);
    const { slug } = await params;
    const club = await getClubBySlugForUser(user.id, slug);
    const statusParam = request.nextUrl.searchParams.get("status");
    const status =
      statusParam && Object.values(ClubRequestStatus).includes(statusParam as ClubRequestStatus)
        ? (statusParam as ClubRequestStatus)
        : ClubRequestStatus.PENDING;

    const rows = await listJoinRequestsForClub(club.id, user.id, user.role as Role, status);
    return ok(
      rows.map((r) => ({
        id: r.id,
        clubId: r.clubId,
        userId: r.userId,
        message: r.message,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        user: r.user,
      })),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
