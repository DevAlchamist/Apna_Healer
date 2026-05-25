import type { NextRequest } from "next/server";
import { BookingPaymentMethod, BookingType } from "@prisma/client";
import { created, handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { bookingQuerySchema, createBookingSchema } from "@/lib/validators/booking";
import { createBooking, listBookings } from "@/server/services/booking-service";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await requireSessionUser();
    const filters = bookingQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const bookings = await listBookings(sessionUser.id, sessionUser.role, filters);
    return ok(bookings);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const sessionUser = await requireSessionUser();
    const input = createBookingSchema.parse(await request.json());
    const booking = await createBooking({
      userId: sessionUser.id,
      providerId: input.providerId,
      type: input.type as BookingType,
      requestedDate: new Date(input.requestedDate),
      requestedTime: input.requestedTime,
      duration: input.duration,
      amount: input.amount,
      note: input.note,
      paymentMethod: input.paymentMethod as BookingPaymentMethod | undefined,
    });
    return created(booking);
  } catch (error) {
    return handleApiError(error);
  }
}
