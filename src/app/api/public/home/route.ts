import { handleApiError, ok } from "@/lib/api-response";
import { getPublicHomeBundle } from "@/server/services/public-content-service";

export async function GET() {
  try {
    const data = await getPublicHomeBundle();
    return ok(data);
  } catch (error) {
    return handleApiError(error);
  }
}
