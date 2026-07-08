import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { created, handleApiError, ok } from "@/lib/api-response";
import { ApiError } from "@/lib/api-errors";
import { requireSessionUser } from "@/lib/session-auth";
import { createListenerBookingRequestSchema } from "@/lib/validators/listener-booking-request";
import { serializeListenerBookingRequest } from "@/lib/listener-request-serialize";
import {
  createListenerBookingRequest,
  listListenerBookingRequestsForListener,
  listListenerBookingRequestsForUser,
} from "@/server/services/listener-booking-request-service";

const scopeSchema = z.object({
  scope: z.enum(["requester", "listening"]).optional().default("requester"),
});

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await requireSessionUser();
    const { scope } = scopeSchema.parse(Object.fromEntries(request.nextUrl.searchParams));

    if (scope === "listening") {
      if (sessionUser.role !== Role.LISTENER) {
        throw new ApiError(403, "Only listeners can view the listening inbox.", "FORBIDDEN");
      }
      const rows = await listListenerBookingRequestsForListener(sessionUser.id);
      return ok(rows);
    }

    if (sessionUser.role !== Role.USER) {
      throw new ApiError(403, "Only users can view customer booking requests.", "FORBIDDEN");
    }

    const rows = await listListenerBookingRequestsForUser(sessionUser.id);
    const serialized = rows.map((row) =>
      serializeListenerBookingRequest(row, { id: sessionUser.id, role: sessionUser.role }),
    );
    return ok(serialized);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const sessionUser = await requireSessionUser([Role.USER]);
    const body = createListenerBookingRequestSchema.parse(await request.json());
    const createdRequest = await createListenerBookingRequest(sessionUser.id, body);
    const serialized = serializeListenerBookingRequest(createdRequest, {
      id: sessionUser.id,
      role: sessionUser.role,
    });
    return created(serialized);
  } catch (error) {
    return handleApiError(error);
  }
}
