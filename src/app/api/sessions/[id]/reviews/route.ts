import { created, handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { createSessionReviewSchema } from "@/lib/validators/session-review";
import {
  createSessionReview,
  getReviewStateForSession,
} from "@/server/services/session-review-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const sessionUser = await requireSessionUser();
    const { id } = await context.params;
    const state = await getReviewStateForSession({
      sessionId: id,
      viewerId: sessionUser.id,
    });
    return ok(state);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const sessionUser = await requireSessionUser();
    const { id } = await context.params;
    const body = createSessionReviewSchema.parse(await request.json());
    const review = await createSessionReview({
      sessionId: id,
      reviewerId: sessionUser.id,
      reviewerRole: sessionUser.role,
      rating: body.rating,
      feedback: body.feedback,
      tags: body.tags,
    });
    return created(review);
  } catch (error) {
    return handleApiError(error);
  }
}
