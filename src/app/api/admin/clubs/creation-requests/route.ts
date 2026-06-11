import type { NextRequest } from "next/server";
import { ClubRequestStatus, Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { listClubCreationRequestsAdmin } from "@/server/services/club-creation-request-service";
import {
  countOnboardingQuestions,
  decimalToString,
  parseClubReviewsJson,
  parseJsonStringArray,
  parseOnboardingStepsJson,
} from "@/server/services/club-utils";

export async function GET(request: NextRequest) {
  try {
    await requireSessionUser([Role.ADMIN]);
    const statusParam = request.nextUrl.searchParams.get("status");
    const status =
      statusParam && Object.values(ClubRequestStatus).includes(statusParam as ClubRequestStatus)
        ? (statusParam as ClubRequestStatus)
        : undefined;
    const rows = await listClubCreationRequestsAdmin(status);
    return ok(
      rows.map((r) => {
        const onboardingSteps = parseOnboardingStepsJson(r.onboardingSteps);
        return {
          id: r.id,
          userId: r.userId,
          status: r.status,
          title: r.title,
          subtitle: r.subtitle,
          description: r.description,
          purpose: r.purpose,
          heroImageUrl: r.heroImageUrl,
          galleryUrls: parseJsonStringArray(r.galleryUrls),
          reviews: parseClubReviewsJson(r.reviews),
          monthlyFee: decimalToString(r.monthlyFee),
          onboardingSteps,
          onboardingStepCount: onboardingSteps.length,
          onboardingQuestionCount: countOnboardingQuestions(onboardingSteps),
          createdAt: r.createdAt.toISOString(),
          createdClubId: r.createdClubId,
          adminNote: r.adminNote,
          user: r.user,
          createdClub: r.createdClub,
        };
      }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
