import type { NextRequest } from "next/server";
import { ListenerRequestStatus } from "@prisma/client";
import { z } from "zod";
import { handleApiError, ok } from "@/lib/api-response";
import { assertAdmin } from "@/lib/authz";
import { requireSessionUser } from "@/lib/session-auth";
import { listListenerBookingRequestsForAdmin } from "@/server/services/listener-booking-request-service";

const querySchema = z.object({
  status: z.nativeEnum(ListenerRequestStatus).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await requireSessionUser();
    assertAdmin(sessionUser.role);
    const filters = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const rows = await listListenerBookingRequestsForAdmin({
      status: filters.status,
    });
    return ok(rows);
  } catch (error) {
    return handleApiError(error);
  }
}
