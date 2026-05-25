import type { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api-response";
import { publicEventsQuerySchema } from "@/lib/validators/public";
import { getPublicEvents } from "@/server/services/public-content-service";

export async function GET(request: NextRequest) {
  try {
    const filters = publicEventsQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const events = await getPublicEvents(filters);
    return ok(events);
  } catch (error) {
    return handleApiError(error);
  }
}
