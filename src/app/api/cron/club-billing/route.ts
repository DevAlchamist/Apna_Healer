import { handleApiError, ok } from "@/lib/api-response";
import { ApiError } from "@/lib/api-errors";
import { processDueClubBilling } from "@/server/services/club-billing-service";

function authorizeCron(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    throw new ApiError(503, "Cron is not configured.", "CRON_NOT_CONFIGURED");
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    throw new ApiError(401, "Unauthorized.", "UNAUTHORIZED");
  }
}

export async function POST(request: Request) {
  try {
    authorizeCron(request);
    const result = await processDueClubBilling();
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
