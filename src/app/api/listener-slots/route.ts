import type { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { listenerSlotsQuerySchema } from "@/lib/validators/listener-availability";
import {
  LISTENER_SLOT_DURATION_MIN,
  getAggregatedListenerSlots,
} from "@/server/services/listener-availability-service";

/**
 * Returns the union of available 30-minute slot starts across all active
 * listeners for the requested date. Listener identity is intentionally
 * hidden so the requester never knows who they're talking to until
 * after the session is completed.
 */
export async function GET(request: NextRequest) {
  try {
    await requireSessionUser();
    const params = listenerSlotsQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const date = new Date(`${params.date}T00:00:00`);
    const slots = await getAggregatedListenerSlots(date);
    return ok({
      date: params.date,
      timezone: "Asia/Kolkata",
      durationMin: LISTENER_SLOT_DURATION_MIN,
      slots,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
