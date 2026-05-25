import { handleApiError, ok } from "@/lib/api-response";
import { getPublicTherapistById } from "@/server/services/provider-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const therapist = await getPublicTherapistById(id);
    return ok(therapist);
  } catch (error) {
    return handleApiError(error);
  }
}
