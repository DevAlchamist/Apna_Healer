import { CareSessionStatus, Role, SessionLogEvent } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import { displaySessionStatus } from "@/server/services/session-state";

export type ReviewableSide = "PARTICIPANT" | "PROVIDER";

function detectSide(input: { actorId: string; userId: string; providerId: string }): ReviewableSide | null {
  if (input.actorId === input.userId) return "PARTICIPANT";
  if (input.actorId === input.providerId) return "PROVIDER";
  return null;
}

export async function createSessionReview(input: {
  sessionId: string;
  reviewerId: string;
  reviewerRole: Role;
  rating: number;
  feedback?: string | null;
  tags?: string[];
}) {
  const session = await prisma.careSession.findUnique({
    where: { id: input.sessionId },
  });
  if (!session) {
    throw new ApiError(404, "Session was not found.", "SESSION_NOT_FOUND");
  }

  const side = detectSide({
    actorId: input.reviewerId,
    userId: session.userId,
    providerId: session.providerId,
  });
  if (!side && input.reviewerRole !== Role.ADMIN) {
    throw new ApiError(403, "You did not take part in this session.", "FORBIDDEN");
  }

  const effectiveStatus = displaySessionStatus({
    status: session.status,
    startTime: session.startTime,
    endTime: session.endTime,
    duration: session.duration,
  });
  if (effectiveStatus !== CareSessionStatus.COMPLETED) {
    throw new ApiError(400, "Reviews can only be filed for completed sessions.", "SESSION_NOT_COMPLETED");
  }

  const revieweeId =
    side === "PARTICIPANT" ? session.providerId : session.userId;

  return prisma.$transaction(async (tx) => {
    const existing = await tx.sessionReview.findUnique({
      where: {
        sessionId_reviewerId: {
          sessionId: input.sessionId,
          reviewerId: input.reviewerId,
        },
      },
    });
    if (existing) {
      throw new ApiError(400, "You have already reviewed this session.", "REVIEW_EXISTS");
    }

    const review = await tx.sessionReview.create({
      data: {
        sessionId: input.sessionId,
        reviewerId: input.reviewerId,
        revieweeId,
        rating: input.rating,
        feedback: input.feedback ?? undefined,
        tags: input.tags ?? [],
      },
    });

    await tx.sessionLog.create({
      data: {
        sessionId: input.sessionId,
        event: SessionLogEvent.REVIEW_SUBMITTED,
        metadata: {
          reviewId: review.id,
          reviewerSide: side,
          rating: input.rating,
        },
      },
    });

    return review;
  });
}

/**
 * Returns review state for a session participant. Used to drive the "leave a
 * review" prompt on the dashboard once a session is COMPLETED.
 */
export async function getReviewStateForSession(input: {
  sessionId: string;
  viewerId: string;
}) {
  const session = await prisma.careSession.findUnique({
    where: { id: input.sessionId },
    include: { reviews: true },
  });
  if (!session) {
    throw new ApiError(404, "Session was not found.", "SESSION_NOT_FOUND");
  }

  const effectiveStatus = displaySessionStatus({
    status: session.status,
    startTime: session.startTime,
    endTime: session.endTime,
    duration: session.duration,
  });

  const viewerHasReviewed = session.reviews.some(
    (review) => review.reviewerId === input.viewerId,
  );

  return {
    sessionId: session.id,
    completed: effectiveStatus === CareSessionStatus.COMPLETED,
    viewerHasReviewed,
    reviews: session.reviews,
  };
}

export async function listReviewsForUser(userId: string, take = 25) {
  return prisma.sessionReview.findMany({
    where: { revieweeId: userId },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      reviewer: { select: { id: true, name: true, image: true, role: true } },
      session: { select: { id: true, sessionMode: true, startTime: true } },
    },
  });
}
