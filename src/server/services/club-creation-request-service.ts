import { ClubRequestStatus, ClubStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import type {
  clubCreationRequestSchema,
  reviewCreationRequestSchema,
} from "@/lib/validators/club";
import { createClub, mapDetail, updateClub } from "@/server/services/club-service";
import { parseOnboardingStepsJson } from "@/server/services/club-utils";
import {
  emitClubCreationApproved,
  emitClubCreationRejected,
} from "@/server/services/platform-events";
import type { z } from "zod";

type CreateRequestInput = z.infer<typeof clubCreationRequestSchema>;
type ReviewInput = z.infer<typeof reviewCreationRequestSchema>;

export async function submitClubCreationRequest(
  userId: string,
  input: CreateRequestInput,
) {
  const pending = await prisma.clubCreationRequest.findFirst({
    where: { userId, status: ClubRequestStatus.PENDING },
  });
  if (pending) {
    throw new ApiError(
      409,
      "You already have a pending club creation request.",
      "PENDING_EXISTS",
    );
  }

  return prisma.clubCreationRequest.create({
    data: {
      userId,
      title: input.title,
      subtitle: input.subtitle,
      description: input.description ?? null,
      purpose: input.purpose ?? null,
      heroImageUrl: input.heroImageUrl ?? null,
      galleryUrls: input.galleryUrls ?? [],
      monthlyFee: input.monthlyFee,
      onboardingSteps: input.onboardingSteps ?? [],
      status: ClubRequestStatus.PENDING,
    },
  });
}

export async function listMyClubCreationRequests(userId: string) {
  return prisma.clubCreationRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function listClubCreationRequestsAdmin(status?: ClubRequestStatus) {
  return prisma.clubCreationRequest.findMany({
    where: status ? { status } : {},
    include: {
      user: { select: { id: true, name: true, email: true } },
      createdClub: { select: { id: true, slug: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function reviewClubCreationRequest(
  requestId: string,
  adminId: string,
  input: ReviewInput,
) {
  const row = await prisma.clubCreationRequest.findUnique({
    where: { id: requestId },
    include: { user: true },
  });

  if (!row) {
    throw new ApiError(404, "Creation request not found.", "REQUEST_NOT_FOUND");
  }
  if (row.status !== ClubRequestStatus.PENDING) {
    throw new ApiError(400, "Request was already reviewed.", "ALREADY_REVIEWED");
  }

  if (input.status === "REJECTED") {
    const updated = await prisma.clubCreationRequest.update({
      where: { id: requestId },
      data: {
        status: ClubRequestStatus.REJECTED,
        adminNote: input.adminNote ?? null,
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
    });

    void emitClubCreationRejected({
      userId: row.userId,
      requestId,
      adminNote: input.adminNote,
    }).catch(console.error);

    return updated;
  }

  const stepsRaw = input.club?.onboardingSteps
    ?? parseOnboardingStepsJson(row.onboardingSteps);
  const steps = stepsRaw.map((s, i) => ({
    question: s.question,
    required: s.required !== false,
    sortOrder: s.sortOrder ?? i,
  }));

  const clubInput = {
    title: input.club?.title ?? row.title,
    subtitle: input.club?.subtitle ?? row.subtitle,
    description: input.club?.description ?? row.description,
    purpose: input.club?.purpose ?? row.purpose,
    heroImageUrl: input.club?.heroImageUrl ?? row.heroImageUrl,
    galleryUrls: (input.club?.galleryUrls ?? row.galleryUrls) as string[],
    monthlyFee: input.club?.monthlyFee ?? Number(row.monthlyFee),
    visibility: input.club?.visibility ?? ("PUBLIC" as const),
    ownerUserId: row.userId,
    onboardingSteps: steps as CreateRequestInput["onboardingSteps"],
    reviews: input.club?.reviews ?? [],
  };

  const club = await createClub(adminId, clubInput, { asAdmin: true });
  await prisma.club.update({
    where: { id: club.id },
    data: { status: ClubStatus.ACTIVE, ownerUserId: row.userId },
  });

  if (input.club) {
    await updateClub(club.id, input.club);
  }

  const finalClub = await prisma.club.findUniqueOrThrow({
    where: { id: club.id },
    include: {
      onboardingSteps: { orderBy: { sortOrder: "asc" } },
      reviews: { orderBy: { sortOrder: "asc" } },
    },
  });

  await prisma.clubCreationRequest.update({
    where: { id: requestId },
    data: {
      status: ClubRequestStatus.APPROVED,
      adminNote: input.adminNote ?? null,
      reviewedById: adminId,
      reviewedAt: new Date(),
      createdClubId: finalClub.id,
    },
  });

  void emitClubCreationApproved({
    userId: row.userId,
    clubId: finalClub.id,
    clubSlug: finalClub.slug,
    clubTitle: finalClub.title,
  }).catch(console.error);

  return {
    request: await prisma.clubCreationRequest.findUniqueOrThrow({
      where: { id: requestId },
    }),
    club: mapDetail(finalClub, {
      userId: row.userId,
      isMember: false,
      hasPendingJoin: false,
    }),
  };
}
