import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { updateBookingStatusSchema } from "@/lib/validators/booking";
import { getBookingById, updateBookingStatus } from "@/server/services/booking-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionUser = await requireSessionUser();
    const { id } = await params;
    const booking = await getBookingById(id, sessionUser.id, sessionUser.role);
    return ok(booking);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionUser = await requireSessionUser();
    const { id } = await params;
    const input = updateBookingStatusSchema.parse(await request.json());
    const result = await updateBookingStatus({
      bookingId: id,
      actorId: sessionUser.id,
      actorRole: sessionUser.role,
      status: input.status,
      meetingLink: input.meetingLink,
      description: input.description,
    });
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
