import type { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { therapistDynamicSlotsQuerySchema } from "@/lib/validators/therapist-availability";
import { getTherapistDynamicSlots } from "@/server/services/therapist-availability-service";

/**
 * Returns dynamically generated slots for a given therapist on a date,
 * with `isBooked` reconciled against active bookings + sessions. Used
 * by the therapist-flow booking UI.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const params = therapistDynamicSlotsQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const date = new Date(`${params.date}T00:00:00`);
    const slots = await getTherapistDynamicSlots({
      therapistId: id,
      date,
    });
    return ok({
      therapistId: id,
      date: params.date,
      timezone: "Asia/Kolkata",
      slots,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
