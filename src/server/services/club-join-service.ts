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
import { formatJoinMessageFromAnswers } from "@/server/services/club-utils";
import {
  emitClubJoinApproved,
  emitClubJoinRejected,
  emitClubJoinRequestReceived,
} from "@/server/services/platform-events";
import type { z } from "zod";

type JoinInput = z.infer<typeof clubJoinRequestSchema>;
type ReviewInput = z.infer<typeof reviewJoinRequestSchema>;

export async function submitClubJoinRequest(userId: string, input: JoinInput) {
  const club = await prisma.club.findUnique({
    where: { id: input.clubId },
    include: {
      onboardingSteps: {
        orderBy: { sortOrder: "asc" },
        include: { questions: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  if (!club) {
    throw new ApiError(404, "Club was not found.", "CLUB_NOT_FOUND");
  }
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

  const hasOnboarding = club.onboardingSteps.length > 0;
  let message = input.message?.trim() ?? "";
  let onboardingAnswers = input.onboardingAnswers ?? null;

  if (hasOnboarding) {
    if (!onboardingAnswers?.length) {
      throw new ApiError(
        400,
        "Complete all onboarding steps before submitting.",
        "ONBOARDING_INCOMPLETE",
      );
    }

    if (onboardingAnswers.length !== club.onboardingSteps.length) {
      throw new ApiError(
        400,
        "Onboarding answers do not match the club steps.",
        "ONBOARDING_MISMATCH",
      );
    }

    for (const [index, step] of club.onboardingSteps.entries()) {
      const answerStep = onboardingAnswers[index];
      if (!answerStep || answerStep.stepTitle !== step.title) {
        throw new ApiError(400, "Onboarding step mismatch.", "ONBOARDING_MISMATCH");
      }
      if (answerStep.questions.length !== step.questions.length) {
        throw new ApiError(400, "Answer every required question.", "ONBOARDING_INCOMPLETE");
      }
      for (const [qi, question] of step.questions.entries()) {
        const answer = answerStep.questions[qi];
        if (!answer || answer.questionId !== question.id || answer.question !== question.question) {
          throw new ApiError(400, "Onboarding question mismatch.", "ONBOARDING_MISMATCH");
        }

        const raw = answer.answer;
        const hasValue =
          Array.isArray(raw) ? raw.filter(Boolean).length > 0 : String(raw ?? "").trim().length > 0;
        if (question.required && !hasValue) {
          throw new ApiError(400, "Answer every required question.", "ONBOARDING_INCOMPLETE");
        }

        if (question.type === "CHOICE") {
          const options = Array.isArray(question.options)
            ? (question.options as string[])
            : [];
          if (options.length < 2) {
            throw new ApiError(400, "Invalid club onboarding configuration.", "ONBOARDING_MISMATCH");
          }

          if (question.allowMultiple) {
            if (!Array.isArray(raw)) {
              throw new ApiError(400, "Invalid answer format.", "ONBOARDING_MISMATCH");
            }
            const selected = raw.map((v) => String(v)).filter(Boolean);
            if (question.required && selected.length === 0) {
              throw new ApiError(400, "Answer every required question.", "ONBOARDING_INCOMPLETE");
            }
            if (!selected.every((v) => options.includes(v))) {
              throw new ApiError(400, "Invalid option selected.", "ONBOARDING_MISMATCH");
            }
          } else {
            if (Array.isArray(raw)) {
              throw new ApiError(400, "Invalid answer format.", "ONBOARDING_MISMATCH");
            }
            const selected = String(raw ?? "").trim();
            if (question.required && !selected) {
              throw new ApiError(400, "Answer every required question.", "ONBOARDING_INCOMPLETE");
            }
            if (selected && !options.includes(selected)) {
              throw new ApiError(400, "Invalid option selected.", "ONBOARDING_MISMATCH");
            }
          }
        }
      }
    }

    message = formatJoinMessageFromAnswers(onboardingAnswers);
  } else if (message.length < 10) {
    throw new ApiError(
      400,
      "Please share why you want to join (at least 10 characters).",
      "VALIDATION_ERROR",
    );
  }

  const row = await prisma.clubJoinRequest.create({
    data: {
      clubId: input.clubId,
      userId,
      message,
      onboardingAnswers: onboardingAnswers ?? undefined,
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
