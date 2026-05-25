import { handleApiError, failure, ok } from "@/lib/api-response";
import { getPublicEventById } from "@/server/services/public-content-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const event = await getPublicEventById(id);
    if (!event) {
      return failure(404, "Event was not found.", "EVENT_NOT_FOUND");
    }
    return ok(event);
  } catch (error) {
    return handleApiError(error);
  }
}
