import { handleApiError, ok } from "@/lib/api-response";
import { getPublicFaq } from "@/server/services/public-content-service";

export async function GET() {
  try {
    return ok(getPublicFaq());
  } catch (error) {
    return handleApiError(error);
  }
}
