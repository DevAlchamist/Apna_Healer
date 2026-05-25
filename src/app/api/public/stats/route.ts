import { handleApiError, ok } from "@/lib/api-response";
import { getPublicStats } from "@/server/services/public-content-service";

export async function GET() {
  try {
    const stats = await getPublicStats();
    return ok(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
