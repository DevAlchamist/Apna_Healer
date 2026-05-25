import { ClubMembershipStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import { assertCanManageClub, incrementMemberCount, mapSummary } from "@/server/services/club-service";
import type { ApiClubMembershipSummary, ApiClubSummary } from "@/types/api";

export async function listMyClubMemberships(userId: string): Promise<{
  items: Array<ApiClubSummary & { membership: ApiClubMembershipSummary }>;
}> {
  const rows = await prisma.clubMembership.findMany({
    where: {
      userId,
      status: { not: ClubMembershipStatus.LEFT },
    },
    include: {
      club: {
        include: {
          onboardingSteps: { orderBy: { sortOrder: "asc" } },
          reviews: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return {
    items: rows.map((row) => ({
      ...mapSummary(row.club, {
        userId,
        isMember: true,
        hasPendingJoin: false,
      }),
      membership: {
        id: row.id,
        role: row.role,
        status: row.status,
        joinedAt: row.joinedAt.toISOString(),
        nextBillingAt: row.nextBillingAt?.toISOString() ?? null,
      },
    })),
  };
}

export async function listClubMembers(
  clubId: string,
  actorId: string,
  actorRole: Role,
) {
  await assertCanManageClub(clubId, actorId, actorRole);
  return prisma.clubMembership.findMany({
    where: { clubId, status: { not: ClubMembershipStatus.LEFT } },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { joinedAt: "desc" },
  });
}

export async function leaveClub(userId: string, clubId: string) {
  const membership = await prisma.clubMembership.findUnique({
    where: { clubId_userId: { clubId, userId } },
  });

  if (!membership || membership.status === ClubMembershipStatus.LEFT) {
    throw new ApiError(404, "Membership not found.", "MEMBERSHIP_NOT_FOUND");
  }

  if (membership.role === "OWNER") {
    throw new ApiError(400, "Club owners cannot leave; transfer ownership first.", "OWNER_CANNOT_LEAVE");
  }

  await prisma.clubMembership.update({
    where: { id: membership.id },
    data: {
      status: ClubMembershipStatus.LEFT,
      nextBillingAt: null,
    },
  });

  await incrementMemberCount(clubId, -1);
  return { success: true };
}
