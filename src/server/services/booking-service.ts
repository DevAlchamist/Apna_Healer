import {
  BookingPaymentMethod,
  BookingStatus,
  BookingType,
  CareSessionStatus,
  Role,
  SessionLogEvent,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import {
  assertBookingScope,
  assertResourceParticipant,
  defaultBookingScope,
  type BookingScope,
} from "@/lib/authz";
import {
  applyWalletHoldForBooking,
  recordExternalBookingPayment,
  releaseWalletHoldForBooking,
  resolveBookingPaymentMethod,
  voidExternalBookingPayment,
} from "@/server/services/booking-payment";
import { mergeDateAndTime, toDecimal } from "@/server/services/service-utils";
import { emitBookingStatusChanged } from "@/server/services/platform-events";
import { findOpenSlot, generateAvailableSlots } from "@/server/services/slot-engine";
import { bookingConflictsExist } from "@/server/services/slot-availability";

function assertTherapistProvider(role: Role) {
  if (role !== Role.THERAPIST) {
    throw new ApiError(400, "Selected provider is not a therapist.", "INVALID_PROVIDER_ROLE");
  }
}

export async function listBookings(
  actorId: string,
  actorRole: Role,
  filters: {
    scope?: BookingScope;
    status?: BookingStatus;
    take?: number;
  },
) {
  const scope: BookingScope = filters.scope ?? defaultBookingScope(actorRole);

  assertBookingScope(actorRole, scope);

  return prisma.booking.findMany({
    where: {
      ...(scope === "requester"
        ? { userId: actorId }
        : scope === "provider"
          ? { providerId: actorId }
          : {}),
      ...(filters.status ? { status: filters.status } : {}),
    },
    include: {
      user: true,
      provider: true,
      session: true,
    },
    orderBy: { createdAt: "desc" },
    take: filters.take ?? 25,
  });
}

export async function getBookingById(bookingId: string, actorId: string, actorRole: Role) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: true,
      provider: true,
      session: true,
    },
  });

  if (!booking) {
    throw new ApiError(404, "Booking was not found.", "BOOKING_NOT_FOUND");
  }

  assertResourceParticipant(
    { actorId, actorRole },
    { userId: booking.userId, providerId: booking.providerId },
    "You do not have access to this booking.",
  );

  return booking;
}

export async function createBooking(input: {
  userId: string;
  providerId: string;
  type: BookingType;
  requestedDate: Date;
  requestedTime: string;
  duration: number;
  amount: number;
  note?: string;
  paymentMethod?: BookingPaymentMethod;
}) {
  if (input.type !== BookingType.THERAPIST) {
    throw new ApiError(
      400,
      "Only therapist appointments can be booked here. Use listener support for anonymous listening.",
      "INVALID_BOOKING_TYPE",
    );
  }

  const decimalAmount = toDecimal(input.amount);
  const paymentMethod = resolveBookingPaymentMethod(input.type, input.paymentMethod);

  const slotResult = await generateAvailableSlots({
    providerId: input.providerId,
    providerType: "THERAPIST",
    date: input.requestedDate,
    slotDuration: input.duration,
  });

  const openSlot = findOpenSlot(slotResult.slots, input.requestedTime, input.duration);

  if (!openSlot) {
    const hasAnySlots = slotResult.slots.length > 0;
    throw new ApiError(
      400,
      hasAnySlots
        ? "The selected time is not available. Please pick another slot."
        : "The provider has not published availability for this day.",
      hasAnySlots ? "SLOT_OUT_OF_WINDOW" : "SLOT_NOT_PUBLISHED",
    );
  }

  return prisma.$transaction(async (tx) => {
    const [requester, provider, wallet] = await Promise.all([
      tx.user.findUnique({ where: { id: input.userId } }),
      tx.user.findUnique({ where: { id: input.providerId } }),
      tx.wallet.findUnique({ where: { userId: input.userId } }),
    ]);

    if (!requester || !wallet) {
      throw new ApiError(404, "Booking requester was not found.", "USER_NOT_FOUND");
    }

    if (requester.role !== Role.USER) {
      throw new ApiError(403, "Only users can create therapist session bookings.", "FORBIDDEN");
    }

    if (!provider) {
      throw new ApiError(404, "Selected provider was not found.", "PROVIDER_NOT_FOUND");
    }

    assertTherapistProvider(provider.role);

    const dayStart = new Date(input.requestedDate);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const [conflictingBookings, conflictingSessions] = await Promise.all([
      tx.booking.findMany({
        where: {
          providerId: input.providerId,
          status: { in: [BookingStatus.PENDING, BookingStatus.ACCEPTED] },
          requestedDate: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
        select: {
          requestedDate: true,
          requestedTime: true,
          duration: true,
          status: true,
        },
      }),
      tx.careSession.findMany({
        where: {
          providerId: input.providerId,
          status: { in: [CareSessionStatus.UPCOMING, CareSessionStatus.ONGOING] },
          startTime: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
        select: {
          startTime: true,
          duration: true,
          status: true,
        },
      }),
    ]);

    if (
      bookingConflictsExist({
        requestedDate: input.requestedDate,
        requestedTime: input.requestedTime,
        duration: input.duration,
        bookings: conflictingBookings,
        sessions: conflictingSessions,
      })
    ) {
      throw new ApiError(
        409,
        "This slot was just taken by someone else. Please pick another time.",
        "SLOT_TAKEN",
      );
    }

    const startTime = mergeDateAndTime(input.requestedDate, input.requestedTime);

    const booking = await tx.booking.create({
      data: {
        userId: input.userId,
        providerId: input.providerId,
        type: input.type,
        requestedDate: input.requestedDate,
        requestedTime: input.requestedTime,
        duration: input.duration,
        amount: decimalAmount,
        paymentMethod,
        note: input.note,
        status: BookingStatus.ACCEPTED,
      },
      include: {
        user: true,
        provider: true,
      },
    });

    if (paymentMethod === BookingPaymentMethod.WALLET) {
      await applyWalletHoldForBooking(tx, {
        wallet,
        bookingId: booking.id,
        userId: input.userId,
        providerId: input.providerId,
        bookingType: input.type,
        amount: decimalAmount,
      });
    } else {
      await recordExternalBookingPayment(tx, {
        wallet,
        bookingId: booking.id,
        userId: input.userId,
        providerId: input.providerId,
        bookingType: input.type,
        amount: decimalAmount,
        paymentMethod,
      });
    }

    const session = await tx.careSession.create({
      data: {
        bookingId: booking.id,
        userId: booking.userId,
        providerId: booking.providerId,
        sessionMode: booking.type,
        amount: booking.amount,
        duration: booking.duration,
        startTime,
        description: input.note,
      },
    });

    await tx.sessionLog.create({
      data: {
        sessionId: session.id,
        event: SessionLogEvent.BOOKED,
        metadata: { bookingId: booking.id, source: "BOOKING_PAYMENT" },
      },
    });

    return {
      ...booking,
      session,
    };
  });
}

/**
 * Booking status updates for reject/cancel/recovery. Therapist sessions are
 * created on payment; ACCEPT is idempotent when a session already exists.
 *
 * Session lifecycle (reschedule, cancel, complete) is owned by session-service.
 */
export async function updateBookingStatus(input: {
  bookingId: string;
  actorId: string;
  actorRole: Role;
  status: Exclude<BookingStatus, "PENDING">;
  meetingLink?: string;
  description?: string;
}) {
  const prior = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    select: { status: true, userId: true },
  });

  const result = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: input.bookingId },
      include: {
        session: true,
      },
    });

    if (!booking) {
      throw new ApiError(404, "Booking was not found.", "BOOKING_NOT_FOUND");
    }

    assertResourceParticipant(
      { actorId: input.actorId, actorRole: input.actorRole },
      { userId: booking.userId, providerId: booking.providerId },
      "You do not have access to this booking.",
    );

    if (booking.status !== BookingStatus.PENDING && input.status !== BookingStatus.COMPLETED) {
      if (
        input.status === BookingStatus.ACCEPTED &&
        booking.status === BookingStatus.ACCEPTED &&
        booking.session
      ) {
        return { booking, session: booking.session };
      }
      throw new ApiError(400, "Only pending bookings can be updated here.", "INVALID_BOOKING_STATE");
    }

    if (input.status === BookingStatus.ACCEPTED) {
      const startTime = mergeDateAndTime(booking.requestedDate, booking.requestedTime);

      let session = booking.session;
      let wasNewSession = false;
      if (!session) {
        session = await tx.careSession.create({
          data: {
            bookingId: booking.id,
            userId: booking.userId,
            providerId: booking.providerId,
            sessionMode: booking.type,
            amount: booking.amount,
            duration: booking.duration,
            startTime,
            meetingLink: input.meetingLink,
            description: input.description,
          },
        });
        wasNewSession = true;
      }

      if (wasNewSession) {
        await tx.sessionLog.create({
          data: {
            sessionId: session.id,
            event: SessionLogEvent.BOOKED,
            metadata: { bookingId: booking.id, source: "BOOKING_ACCEPTED" },
          },
        });
      }
      await tx.sessionLog.create({
        data: {
          sessionId: session.id,
          event: SessionLogEvent.APPROVED,
          metadata: { bookingId: booking.id, acceptedBy: input.actorId },
        },
      });

      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.ACCEPTED },
        include: {
          session: true,
          user: true,
          provider: true,
        },
      });

      return {
        booking: updatedBooking,
        session,
      };
    }

    if (input.status === BookingStatus.REJECTED || input.status === BookingStatus.CANCELLED) {
      if (booking.paymentMethod === BookingPaymentMethod.WALLET) {
        await releaseWalletHoldForBooking(tx, {
          bookingId: booking.id,
          userId: booking.userId,
          amount: booking.amount,
          action: input.status,
        });
      } else {
        await voidExternalBookingPayment(tx, {
          bookingId: booking.id,
          action: input.status,
        });
      }

      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: { status: input.status },
        include: {
          session: true,
          user: true,
          provider: true,
        },
      });

      return {
        booking: updatedBooking,
      };
    }

    const updatedBooking = await tx.booking.update({
      where: { id: booking.id },
      data: { status: input.status },
      include: {
        session: true,
        user: true,
        provider: true,
      },
    });

    return {
      booking: updatedBooking,
    };
  });

  const booking = result.booking;
  if (prior && prior.status !== booking.status) {
    void emitBookingStatusChanged({
      actorId: input.actorId,
      bookingId: booking.id,
      fromStatus: prior.status,
      toStatus: booking.status,
      userId: booking.userId,
      sessionId: result.session?.id ?? booking.session?.id ?? null,
    }).catch((err) => console.error("[platform-events] booking status:", err));
  }

  return result;
}
