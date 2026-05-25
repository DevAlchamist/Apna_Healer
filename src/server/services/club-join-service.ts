import { ClubRequestStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import type { clubJoinRequestSchema, reviewJoinRequestSchema } from "@/lib/validators/club";
import {
  assertCanManageClub,
  getClubById,
  getViewerClubState,
} from "@/server/services/club-service";
import { createMembershipForUser } from "@/server/services/club-billing-service";
import {
  emitClubJoinApproved,
  emitClubJoinRejected,
  emitClubJoinRequestReceived,
} from "@/server/services/platform-events";
import type { z } from "zod";

type JoinInput = z.infer<typeof clubJoinRequestSchema>;
type ReviewInput = z.infer<typeof reviewJoinRequestSchema>;

export async function submitClubJoinRequest(userId: string, input: JoinInput) {
  const club = await getClubById(input.clubId);
  if (club.status !== "ACTIVE") {
    throw new ApiError(400, "This club is not accepting members.", "CLUB_NOT_ACTIVE");
  }

  const state = await getViewerClubState(userId, club.id);
  if (state.isMember) {
    throw new ApiError(409, "You are already a member.", "ALREADY_MEMBER");
  }
  if (state.hasPendingJoin) {
    throw new ApiError(409, "You already have a pending request.", "PENDING_EXISTS");
  }

  const row = await prisma.clubJoinRequest.create({
    data: {
      clubId: input.clubId,
      userId,
      message: input.message,
      status: ClubRequestStatus.PENDING,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      club: { select: { id: true, title: true, slug: true, ownerUserId: true } },
    },
  });

  const notifyUserId = row.club.ownerUserId;
  if (notifyUserId) {
    void emitClubJoinRequestReceived({
      ownerUserId: notifyUserId,
      requesterId: userId,
      requesterLabel: row.user.name ?? row.user.email,
      clubId: row.clubId,
      clubTitle: row.club.title,
      clubSlug: row.club.slug,
      requestId: row.id,
    }).catch(console.error);
  }

  return row;
}

export async function listJoinRequestsForClub(
  clubId: string,
  actorId: string,
  actorRole: Role,
  status?: ClubRequestStatus,
) {
  await assertCanManageClub(clubId, actorId, actorRole);
  return prisma.clubJoinRequest.findMany({
    where: {
      clubId,
      ...(status ? { status } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function listJoinRequestsAdmin(status?: ClubRequestStatus) {
  return prisma.clubJoinRequest.findMany({
    where: status ? { status } : {},
    include: {
      user: { select: { id: true, name: true, email: true } },
      club: { select: { id: true, title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function reviewClubJoinRequest(
  requestId: string,
  actorId: string,
  actorRole: Role,
  input: ReviewInput,
) {
  const row = await prisma.clubJoinRequest.findUnique({
    where: { id: requestId },
    include: { club: true, user: true },
  });

  if (!row) {
    throw new ApiError(404, "Join request not found.", "REQUEST_NOT_FOUND");
  }
  if (row.status !== ClubRequestStatus.PENDING) {
    throw new ApiError(400, "Request was already reviewed.", "ALREADY_REVIEWED");
  }

  if (actorRole !== Role.ADMIN && row.club.ownerUserId !== actorId) {
    throw new ApiError(403, "You cannot review this request.", "FORBIDDEN");
  }

  if (input.status === "APPROVED") {
    await prisma.clubJoinRequest.update({
      where: { id: requestId },
      data: {
        status: ClubRequestStatus.APPROVED,
        reviewedById: actorId,
        reviewedAt: new Date(),
      },
    });

    await createMembershipForUser({
      clubId: row.clubId,
      userId: row.userId,
    });

    void emitClubJoinApproved({
      userId: row.userId,
      clubId: row.clubId,
      clubTitle: row.club.title,
      clubSlug: row.club.slug,
    }).catch(console.error);
  } else {
    await prisma.clubJoinRequest.update({
      where: { id: requestId },
      data: {
        status: ClubRequestStatus.REJECTED,
        reviewedById: actorId,
        reviewedAt: new Date(),
      },
    });

    void emitClubJoinRejected({
      userId: row.userId,
      clubId: row.clubId,
      clubTitle: row.club.title,
      adminNote: input.adminNote,
    }).catch(console.error);
  }

  return prisma.clubJoinRequest.findUniqueOrThrow({
    where: { id: requestId },
    include: { user: true, club: true },
  });
}
