import {
  BookingPaymentMethod,
  BookingType,
  EventRegistrationStatus,
  Role,
  EventStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import { resolveBookingPaymentMethod } from "@/server/services/booking-payment";
import {
  assertCanManageEvent,
  getEventById,
  getEventBySlug,
  isActiveClubMember,
  resolveRegistrationPrice,
} from "@/server/services/event-service";
import {
  chargeWalletForEvent,
  recordExternalEventPayment,
  refundEventRegistration,
} from "@/server/services/event-payment";
import { decimalToNumber } from "@/server/services/event-utils";
import {
  emitEventRegistrationCancelled,
  emitEventRegistrationConfirmed,
  emitEventRegistrationReceived,
} from "@/server/services/platform-events";
import { toDecimal } from "@/server/services/service-utils";
import type { eventRegisterSchema } from "@/lib/validators/event";
import type { z } from "zod";

type RegisterInput = z.infer<typeof eventRegisterSchema>;

export async function registerForEvent(
  userId: string,
  slug: string,
  input: RegisterInput,
) {
  const event = await getEventBySlug(slug);

  if (event.status !== EventStatus.PUBLISHED) {
    throw new ApiError(400, "This event is not open for registration.", "EVENT_NOT_PUBLISHED");
  }

  if (event.seatsRemaining <= 0) {
    throw new ApiError(409, "This event is full.", "EVENT_FULL");
  }

  const existing = await prisma.eventRegistration.findUnique({
    where: { eventId_userId: { eventId: event.id, userId } },
  });

  if (existing?.status === EventRegistrationStatus.CONFIRMED) {
    throw new ApiError(409, "You are already registered.", "ALREADY_REGISTERED");
  }

  const isMember = await isActiveClubMember(userId, event.clubId);
  const amount = resolveRegistrationPrice(event, isMember);
  const decimalAmount = toDecimal(amount);

  if (amount === 0) {
    const reg = await prisma.$transaction(async (tx) => {
      const updated = await tx.event.updateMany({
        where: { id: event.id, seatsRemaining: { gt: 0 } },
        data: { seatsRemaining: { decrement: 1 } },
      });
      if (updated.count === 0) {
        throw new ApiError(409, "This event is full.", "EVENT_FULL");
      }

      return tx.eventRegistration.upsert({
        where: { eventId_userId: { eventId: event.id, userId } },
        create: {
          eventId: event.id,
          userId,
          amountCharged: 0,
          status: EventRegistrationStatus.CONFIRMED,
          isClubMemberAtBooking: isMember,
          note: input.note ?? null,
        },
        update: {
          amountCharged: 0,
          status: EventRegistrationStatus.CONFIRMED,
          isClubMemberAtBooking: isMember,
          note: input.note ?? null,
        },
      });
    });

    void notifyRegistration(event, userId, reg.id, 0).catch(console.error);
    return reg;
  }

  const paymentMethod = resolveBookingPaymentMethod(
    BookingType.THERAPIST,
    input.paymentMethod ?? BookingPaymentMethod.WALLET,
  );

  const reg = await prisma.$transaction(async (tx) => {
    const seatUpdate = await tx.event.updateMany({
      where: { id: event.id, seatsRemaining: { gt: 0 } },
      data: { seatsRemaining: { decrement: 1 } },
    });
    if (seatUpdate.count === 0) {
      throw new ApiError(409, "This event is full.", "EVENT_FULL");
    }

    const registration = await tx.eventRegistration.create({
      data: {
        eventId: event.id,
        userId,
        amountCharged: decimalAmount,
        status: EventRegistrationStatus.CONFIRMED,
        isClubMemberAtBooking: isMember,
        paymentMethod,
        note: input.note ?? null,
      },
    });

    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new ApiError(404, "Wallet was not found.", "WALLET_NOT_FOUND");
    }

    let transaction;
    if (paymentMethod === BookingPaymentMethod.WALLET) {
      transaction = await chargeWalletForEvent(tx, {
        wallet,
        eventId: event.id,
        registrationId: registration.id,
        userId,
        amount: decimalAmount,
      });
    } else {
      transaction = await recordExternalEventPayment(tx, {
        wallet,
        eventId: event.id,
        registrationId: registration.id,
        userId,
        amount: decimalAmount,
        paymentMethod,
      });
    }

    return tx.eventRegistration.update({
      where: { id: registration.id },
      data: { transactionId: transaction.id },
    });
  });

  void notifyRegistration(event, userId, reg.id, amount).catch(console.error);
  return reg;
}

async function notifyRegistration(
  event: Awaited<ReturnType<typeof getEventBySlug>>,
  userId: string,
  registrationId: string,
  amount: number,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  const label = user?.name ?? user?.email ?? "Someone";

  await emitEventRegistrationConfirmed({
    userId,
    eventId: event.id,
    eventSlug: event.slug,
    eventTitle: event.title,
    amount: amount.toString(),
  });

  if (event.club?.ownerUserId) {
    await emitEventRegistrationReceived({
      organizerUserId: event.club.ownerUserId,
      registrantLabel: label,
      eventId: event.id,
      eventSlug: event.slug,
      eventTitle: event.title,
      registrationId,
    });
  }
}

export async function cancelRegistration(
  slug: string,
  userId: string,
  actorRole: Role,
  options?: { registrationUserId?: string; asOrganizer?: boolean },
) {
  const event = await getEventBySlug(slug);
  const targetUserId = options?.registrationUserId ?? userId;

  if (options?.asOrganizer || targetUserId !== userId) {
    await assertCanManageEvent(event, userId, actorRole);
  } else if (event.startsAt <= new Date()) {
    throw new ApiError(400, "Cannot cancel after the event has started.", "EVENT_STARTED");
  }

  const reg = await prisma.eventRegistration.findUnique({
    where: { eventId_userId: { eventId: event.id, userId: targetUserId } },
  });

  if (!reg || reg.status !== EventRegistrationStatus.CONFIRMED) {
    throw new ApiError(404, "Registration not found.", "REGISTRATION_NOT_FOUND");
  }

  await prisma.$transaction(async (tx) => {
    await tx.eventRegistration.update({
      where: { id: reg.id },
      data: { status: EventRegistrationStatus.CANCELLED },
    });

    await tx.event.update({
      where: { id: event.id },
      data: { seatsRemaining: { increment: 1 } },
    });

    const amount = toDecimal(decimalToNumber(reg.amountCharged));
    if (reg.paymentMethod === BookingPaymentMethod.WALLET && amount.greaterThan(0)) {
      await refundEventRegistration(tx, {
        registrationId: reg.id,
        userId: targetUserId,
        amount,
        eventId: event.id,
      });
      await tx.eventRegistration.update({
        where: { id: reg.id },
        data: { status: EventRegistrationStatus.REFUNDED },
      });
    }
  });

  void emitEventRegistrationCancelled({
    userId: targetUserId,
    eventTitle: event.title,
    eventSlug: event.slug,
  }).catch(console.error);

  return { success: true };
}

export async function listRegistrationsForEvent(
  eventId: string,
  actorId: string,
  actorRole: Role,
) {
  const event = await getEventById(eventId);
  await assertCanManageEvent(event, actorId, actorRole);

  const rows = await prisma.eventRegistration.findMany({
    where: { eventId, status: EventRegistrationStatus.CONFIRMED },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r) => ({
    id: r.id,
    eventId: r.eventId,
    userId: r.userId,
    amountCharged: decimalToNumber(r.amountCharged).toString(),
    paymentMethod: r.paymentMethod,
    status: r.status,
    isClubMemberAtBooking: r.isClubMemberAtBooking,
    note: r.note,
    createdAt: r.createdAt.toISOString(),
    user: r.user,
  }));
}

export async function listMyRegistrations(userId: string) {
  const rows = await prisma.eventRegistration.findMany({
    where: { userId, status: EventRegistrationStatus.CONFIRMED },
    include: {
      event: { include: { club: { select: { slug: true, title: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r) => ({
    id: r.id,
    eventId: r.event.id,
    eventSlug: r.event.slug,
    eventTitle: r.event.title,
    startsAt: r.event.startsAt.toISOString(),
    amountCharged: decimalToNumber(r.amountCharged).toString(),
    status: r.status,
    clubTitle: r.event.club?.title ?? null,
  }));
}

export async function listAllRegistrationsAdmin() {
  const rows = await prisma.eventRegistration.findMany({
    where: { status: EventRegistrationStatus.CONFIRMED },
    include: {
      user: { select: { id: true, name: true, email: true } },
      event: {
        include: { club: { select: { id: true, title: true, slug: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return rows.map((r) => ({
    id: r.id,
    amountCharged: decimalToNumber(r.amountCharged).toString(),
    paymentMethod: r.paymentMethod,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    user: r.user,
    event: {
      id: r.event.id,
      slug: r.event.slug,
      title: r.event.title,
      club: r.event.club,
    },
  }));
}
