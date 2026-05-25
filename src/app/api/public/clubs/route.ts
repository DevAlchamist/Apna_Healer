import type { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api-response";
import { publicClubsQuerySchema } from "@/lib/validators/public";
import { getPublicClubSummaries } from "@/server/services/public-content-service";

export async function GET(request: NextRequest) {
  try {
    const filters = publicClubsQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const clubs = await getPublicClubSummaries(filters);
    return ok(clubs);
  } catch (error) {
    return handleApiError(error);
  }
}
