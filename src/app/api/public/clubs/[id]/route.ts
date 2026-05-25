import { handleApiError, failure, ok } from "@/lib/api-response";
import { getPublicClubDetailBySlug } from "@/server/services/club-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: slug } = await params;
    const club = await getPublicClubDetailBySlug(slug);
    if (!club) {
      return failure(404, "Club was not found.", "CLUB_NOT_FOUND");
    }
    return ok(club);
  } catch (error) {
    return handleApiError(error);
  }
}
