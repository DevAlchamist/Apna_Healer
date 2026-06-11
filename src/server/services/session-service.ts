/**
 * CareSession lifecycle owner: reschedule, cancel, complete, and disputes are
 * handled here. Booking and ListenerBookingRequest records are intake/payment
 * artifacts only; session state does not follow booking status after creation.
 */
import {
  BookingPaymentMethod,
  BookingStatus,
  BookingType,
  CareSessionStatus,
  Prisma,
  Role,
  SessionLogEvent,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import {
  assertResourceParticipant,
  assertResourceProvider,
  assertSessionScope,
  defaultSessionScope,
  isAdminRole,
  type SessionScope,
} from "@/lib/authz";
import {
  releaseWalletHoldForBooking,
  voidExternalBookingPayment,
} from "@/server/services/booking-payment";
import { getAggregatedListenerSlots } from "@/server/services/listener-availability-service";
import { emitSessionStatusChanged } from "@/server/services/platform-events";
import {
  autoAdvanceUpcomingStatus,
  formatLocalTimeValue,
  resolveScheduledSessionEnd,
  SESSION_PARTICIPANT_CANCEL_WINDOW_MS,
} from "@/server/services/session-state";
import { findOpenSlot, generateAvailableSlots } from "@/server/services/slot-engine";
import { bookingConflictsExist } from "@/server/services/slot-availability";
import { createTransactionRecord } from "@/server/services/transaction-service";
import { PLATFORM_FEE_RATE, decimalToNumber, toDecimal } from "@/server/services/service-utils";

const LISTENER_SESSION_DURATION_CAP_MIN = 240;
const TERMINAL_SESSION_STATUSES = new Set<CareSessionStatus>([
  CareSessionStatus.COMPLETED,
  CareSessionStatus.CANCELLED,
  CareSessionStatus.MISSED,
]);

const sessionInclude = {
  booking: true,
  user: true,
  provider: true,
} satisfies Prisma.CareSessionInclude;

type SessionRow = Prisma.CareSessionGetPayload<{ include: typeof sessionInclude }>;

function isListenerFlowSession(session: { listenerRequestId: string | null; bookingId: string | null }) {
  return Boolean(session.listenerRequestId) && !session.bookingId;
}

function assertSessionIsMutable(session: { status: CareSessionStatus }, action: string) {
  if (TERMINAL_SESSION_STATUSES.has(session.status)) {
    throw new ApiError(400, `This session can no longer be ${action}.`, "INVALID_SESSION_STATE");
  }
}

function assertParticipantCancellationWindow(session: { startTime: Date }) {
  const msUntilStart = session.startTime.getTime() - Date.now();
  if (msUntilStart < SESSION_PARTICIPANT_CANCEL_WINDOW_MS) {
    throw new ApiError(
      400,
      "Sessions can only be cancelled at least 24 hours before the scheduled start.",
      "CANCELLATION_WINDOW",
    );
  }
}

async function syncTimedSessionRow(
  tx: Prisma.TransactionClient,
  session: SessionRow,
  now = new Date(),
): Promise<SessionRow | null> {
  if (session.status !== CareSessionStatus.UPCOMING) {
    return session;
  }

  const nextStatus = autoAdvanceUpcomingStatus({
    startTime: session.startTime,
    endTime: session.endTime,
    duration: session.duration,
    now,
  });
  if (!nextStatus) {
    return session;
  }

  const updated = await tx.careSession.update({
    where: { id: session.id },
    data: { status: nextStatus },
    include: sessionInclude,
  });

  await tx.sessionLog.create({
    data: {
      sessionId: session.id,
      event:
        nextStatus === CareSessionStatus.ONGOING
          ? SessionLogEvent.STARTED
          : SessionLogEvent.CANCELLED,
      metadata: {
        actorId: null,
        fromStatus: session.status,
        autoAdvanced: true,
        ...(nextStatus === CareSessionStatus.MISSED ? { reason: "NO_SHOW" } : {}),
      },
    },
  });

  void emitSessionStatusChanged({
    actorId: session.providerId,
    sessionId: session.id,
    fromStatus: session.status,
    toStatus: nextStatus,
    userId: session.userId,
    providerId: session.providerId,
    bookingId: session.bookingId,
  }).catch((err) => console.error("[platform-events] session auto-advance:", err));

  return updated;
}

async function syncTimedSessionsWhere(where: Prisma.CareSessionWhereInput) {
  const now = new Date();
  const candidates = await prisma.careSession.findMany({
    where: {
      ...where,
      status: CareSessionStatus.UPCOMING,
      startTime: { lte: now },
    },
    include: sessionInclude,
    take: 200,
  });

  for (const session of candidates) {
    await prisma.$transaction(async (tx) => {
      const current = await tx.careSession.findUnique({
        where: { id: session.id },
        include: sessionInclude,
      });
      if (!current || current.status !== CareSessionStatus.UPCOMING) {
        return;
      }
      await syncTimedSessionRow(tx, current, now);
    });
  }
}

function buildSessionListWhere(
  actorId: string,
  scope: SessionScope,
  status?: CareSessionStatus,
): Prisma.CareSessionWhereInput {
  return {
    ...(scope === "participant"
      ? { userId: actorId }
      : scope === "provider"
        ? { providerId: actorId }
        : scope === "both"
          ? { OR: [{ userId: actorId }, { providerId: actorId }] }
          : {}),
    ...(status ? { status } : {}),
  };
}

export async function listSessions(
  actorId: string,
  actorRole: Role,
  filters: {
    scope?: SessionScope;
    status?: CareSessionStatus;
    take?: number;
  },
) {
  const scope: SessionScope = filters.scope ?? defaultSessionScope(actorRole);

  assertSessionScope(actorRole, scope);

  const where = buildSessionListWhere(actorId, scope, filters.status);
  await syncTimedSessionsWhere(where);

  return prisma.careSession.findMany({
    where,
    include: sessionInclude,
    orderBy: { startTime: "desc" },
    take: filters.take ?? 25,
  });
}

export async function getSessionById(sessionId: string, actorId: string, actorRole: Role) {
  const session = await prisma.careSession.findUnique({
    where: { id: sessionId },
    include: sessionInclude,
  });

  if (!session) {
    throw new ApiError(404, "Session was not found.", "SESSION_NOT_FOUND");
  }

  assertResourceParticipant(
    { actorId, actorRole },
    { userId: session.userId, providerId: session.providerId },
    "You do not have access to this session.",
  );

  const synced = await prisma.$transaction(async (tx) => syncTimedSessionRow(tx, session));
  return synced ?? session;
}

async function settleTherapistSessionCompletion(
  tx: Prisma.TransactionClient,
  session: SessionRow,
) {
  const participantWallet = await tx.wallet.findUnique({
    where: { userId: session.userId },
  });
  const providerWallet = await tx.wallet.findUnique({
    where: { userId: session.providerId },
  });
  const booking =
    session.booking ??
    (session.bookingId
      ? await tx.booking.findUnique({
          where: { id: session.bookingId },
        })
      : null);

  if (!participantWallet || !providerWallet || !booking || !session.bookingId) {
    throw new ApiError(400, "Session ledger data is incomplete.", "LEDGER_INCOMPLETE");
  }

  const pendingPayment = await tx.transaction.findFirst({
    where: {
      referenceId: session.bookingId,
      type: TransactionType.SESSION_PAYMENT,
      status: TransactionStatus.PENDING,
    },
  });

  const settledPayment = await tx.transaction.findFirst({
    where: {
      referenceId: session.bookingId,
      type: TransactionType.SESSION_PAYMENT,
      status: TransactionStatus.SUCCESS,
    },
  });

  const amount = decimalToNumber(session.amount);
  const platformFee = Number((amount * PLATFORM_FEE_RATE).toFixed(2));
  const providerNet = Number((amount - platformFee).toFixed(2));
  const amountDecimal = toDecimal(amount);
  const providerNetDecimal = toDecimal(providerNet);

  if (booking.paymentMethod === BookingPaymentMethod.WALLET) {
    if (!pendingPayment) {
      throw new ApiError(400, "Session ledger data is incomplete.", "LEDGER_INCOMPLETE");
    }

    await tx.wallet.update({
      where: { id: participantWallet.id },
      data: {
        heldBalance: participantWallet.heldBalance.minus(amountDecimal),
        totalSpent: participantWallet.totalSpent.plus(amountDecimal),
      },
    });
  } else if (!settledPayment) {
    throw new ApiError(400, "Session ledger data is incomplete.", "LEDGER_INCOMPLETE");
  }

  await tx.wallet.update({
    where: { id: providerWallet.id },
    data: {
      availableBalance: providerWallet.availableBalance.plus(providerNetDecimal),
      totalReceived: providerWallet.totalReceived.plus(providerNetDecimal),
    },
  });

  const paymentTx = pendingPayment ?? settledPayment;
  if (paymentTx) {
    await tx.transaction.update({
      where: { id: paymentTx.id },
      data: {
        status: TransactionStatus.SUCCESS,
        purpose: "SESSION_COMPLETED",
        metadata: {
          platformFee,
          providerNet,
          sessionId: session.id,
          paymentMethod: booking.paymentMethod,
        },
      },
    });
  }

  await createTransactionRecord(tx, {
    walletId: providerWallet.id,
    userId: session.providerId,
    type: TransactionType.PAYOUT,
    amount: providerNetDecimal,
    status: TransactionStatus.SUCCESS,
    purpose: "SESSION_PAYOUT",
    referenceId: session.id,
    metadata: {
      bookingId: session.bookingId,
      grossAmount: amount,
      platformFee,
      paymentMethod: booking.paymentMethod,
    },
  });

  await tx.booking.update({
    where: { id: session.bookingId },
    data: { status: BookingStatus.COMPLETED },
  });
}

async function settleListenerSessionPayout(
  tx: Prisma.TransactionClient,
  session: SessionRow,
) {
  const existingPayout = await tx.transaction.findFirst({
    where: {
      referenceId: session.id,
      type: TransactionType.PAYOUT,
      status: TransactionStatus.SUCCESS,
    },
  });
  if (existingPayout) {
    return;
  }

  const providerWallet = await tx.wallet.findUnique({
    where: { userId: session.providerId },
  });
  if (!providerWallet) {
    throw new ApiError(400, "Provider wallet was not found.", "WALLET_NOT_FOUND");
  }

  const amount = decimalToNumber(session.amount);
  const platformFee = Number((amount * PLATFORM_FEE_RATE).toFixed(2));
  const providerNet = Number((amount - platformFee).toFixed(2));
  const providerNetDecimal = toDecimal(providerNet);

  await tx.wallet.update({
    where: { id: providerWallet.id },
    data: {
      availableBalance: providerWallet.availableBalance.plus(providerNetDecimal),
      totalReceived: providerWallet.totalReceived.plus(providerNetDecimal),
    },
  });

  await createTransactionRecord(tx, {
    walletId: providerWallet.id,
    userId: session.providerId,
    type: TransactionType.PAYOUT,
    amount: providerNetDecimal,
    status: TransactionStatus.SUCCESS,
    purpose: "SESSION_PAYOUT",
    referenceId: session.id,
    metadata: {
      listenerRequestId: session.listenerRequestId,
      grossAmount: amount,
      platformFee,
      sessionMode: BookingType.LISTENER,
    },
  });
}

async function refundTherapistSessionPayment(
  tx: Prisma.TransactionClient,
  session: SessionRow,
) {
  if (!session.bookingId || !session.booking) {
    return;
  }

  const wallet = await tx.wallet.findUnique({ where: { userId: session.userId } });
  if (!wallet) {
    throw new ApiError(404, "Wallet was not found.", "WALLET_NOT_FOUND");
  }

  const amount = toDecimal(session.amount);

  if (session.booking.paymentMethod === BookingPaymentMethod.WALLET) {
    await releaseWalletHoldForBooking(tx, {
      bookingId: session.bookingId,
      userId: session.userId,
      amount,
      action: "CANCELLED",
    });
    return;
  }

  const settledPayment = await tx.transaction.findFirst({
    where: {
      referenceId: session.bookingId,
      type: TransactionType.SESSION_PAYMENT,
      status: TransactionStatus.SUCCESS,
    },
  });

  if (settledPayment) {
    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        availableBalance: wallet.availableBalance.plus(amount),
        totalSpent: wallet.totalSpent.minus(amount),
      },
    });

    await createTransactionRecord(tx, {
      walletId: wallet.id,
      userId: session.userId,
      type: TransactionType.REFUND,
      amount,
      status: TransactionStatus.SUCCESS,
      purpose: "SESSION_CANCELLED",
      referenceId: session.id,
      metadata: {
        bookingId: session.bookingId,
        paymentMethod: session.booking.paymentMethod,
      },
    });
  }

  await voidExternalBookingPayment(tx, {
    bookingId: session.bookingId,
    action: "CANCELLED",
  });
}

async function refundListenerSessionPayment(
  tx: Prisma.TransactionClient,
  session: SessionRow,
) {
  if (!session.listenerRequestId) {
    return;
  }

  const existingRefund = await tx.transaction.findFirst({
    where: {
      referenceId: session.id,
      type: TransactionType.REFUND,
      status: TransactionStatus.SUCCESS,
      purpose: "SESSION_CANCELLED",
    },
  });
  if (existingRefund) {
    return;
  }

  const wallet = await tx.wallet.findUnique({ where: { userId: session.userId } });
  if (!wallet) {
    throw new ApiError(404, "Wallet was not found.", "WALLET_NOT_FOUND");
  }

  const amount = toDecimal(session.amount);
  await tx.wallet.update({
    where: { id: wallet.id },
    data: {
      availableBalance: wallet.availableBalance.plus(amount),
      totalSpent: wallet.totalSpent.minus(amount),
    },
  });

  await createTransactionRecord(tx, {
    walletId: wallet.id,
    userId: session.userId,
    type: TransactionType.REFUND,
    amount,
    status: TransactionStatus.SUCCESS,
    purpose: "SESSION_CANCELLED",
    referenceId: session.id,
    metadata: {
      listenerRequestId: session.listenerRequestId,
    },
  });
}

async function assertRescheduleSlotAvailable(
  tx: Prisma.TransactionClient,
  session: SessionRow,
  nextStartTime: Date,
  duration: number,
) {
  if (isListenerFlowSession(session)) {
    const dayStart = new Date(nextStartTime);
    dayStart.setHours(0, 0, 0, 0);
    const slots = await getAggregatedListenerSlots(dayStart);
    const nextTime = formatLocalTimeValue(nextStartTime);
    if (!slots.includes(nextTime)) {
      throw new ApiError(
        400,
        "That time is not available for listener support right now.",
        "LISTENER_SLOT_UNAVAILABLE",
      );
    }
    return;
  }

  const slotResult = await generateAvailableSlots({
    providerId: session.providerId,
    providerType: "THERAPIST",
    date: nextStartTime,
    slotDuration: duration,
  });
  const nextTime = formatLocalTimeValue(nextStartTime);
  const openSlot = findOpenSlot(slotResult.slots, nextTime, duration);
  if (!openSlot) {
    throw new ApiError(
      400,
      "The selected time is not available. Please pick another slot.",
      "SLOT_UNAVAILABLE",
    );
  }

  const dayStart = new Date(nextStartTime);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const [conflictingBookings, conflictingSessions] = await Promise.all([
    tx.booking.findMany({
      where: {
        providerId: session.providerId,
        status: { in: [BookingStatus.PENDING, BookingStatus.ACCEPTED] },
        requestedDate: { gte: dayStart, lt: dayEnd },
        ...(session.bookingId ? { NOT: { id: session.bookingId } } : {}),
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
        providerId: session.providerId,
        status: { in: [CareSessionStatus.UPCOMING, CareSessionStatus.ONGOING] },
        startTime: { gte: dayStart, lt: dayEnd },
        NOT: { id: session.id },
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
      requestedDate: nextStartTime,
      requestedTime: nextTime,
      duration,
      bookings: conflictingBookings,
      sessions: conflictingSessions,
    })
  ) {
    throw new ApiError(
      409,
      "This slot conflicts with another booking. Please pick another time.",
      "SLOT_TAKEN",
    );
  }
}

async function applySessionReschedule(
  tx: Prisma.TransactionClient,
  session: SessionRow,
  nextStartTime: Date,
  duration: number,
  actorId: string,
) {
  assertSessionIsMutable(session, "rescheduled");
  if (
    session.status !== CareSessionStatus.UPCOMING &&
    session.status !== CareSessionStatus.ONGOING
  ) {
    throw new ApiError(400, "Only active sessions can be rescheduled.", "INVALID_SESSION_STATE");
  }
  if (nextStartTime.getTime() <= Date.now()) {
    throw new ApiError(400, "Choose a future date and time.", "INVALID_START_TIME");
  }

  await assertRescheduleSlotAvailable(tx, session, nextStartTime, duration);

  if (session.bookingId) {
    const dayStart = new Date(nextStartTime);
    dayStart.setHours(0, 0, 0, 0);
    await tx.booking.update({
      where: { id: session.bookingId },
      data: {
        requestedDate: dayStart,
        requestedTime: formatLocalTimeValue(nextStartTime),
        duration,
      },
    });
  }

  if (session.listenerRequestId) {
    const dayStart = new Date(nextStartTime);
    dayStart.setHours(0, 0, 0, 0);
    await tx.listenerBookingRequest.update({
      where: { id: session.listenerRequestId },
      data: {
        preferredDate: dayStart,
        preferredTime: formatLocalTimeValue(nextStartTime),
        duration,
      },
    });
  }

  await tx.careSession.update({
    where: { id: session.id },
    data: {
      startTime: nextStartTime,
      duration,
      endTime: null,
    },
  });

  await tx.sessionLog.create({
    data: {
      sessionId: session.id,
      event: SessionLogEvent.BOOKED,
      metadata: {
        action: "RESCHEDULED",
        actorId,
        fromStartTime: session.startTime.toISOString(),
        toStartTime: nextStartTime.toISOString(),
        duration,
      },
    },
  });
}

export async function updateSessionState(input: {
  sessionId: string;
  actorId: string;
  actorRole: Role;
  status?: CareSessionStatus;
  meetingLink?: string;
  description?: string;
  notes?: string;
  /** ISO datetime; used when completing listener-flow sessions to derive duration and endTime. */
  endedAt?: string;
  /** ISO datetime; reschedule an upcoming session to a new start time. */
  startTime?: string;
}) {
  const txResult = await prisma.$transaction(async (tx) => {
    let session = await tx.careSession.findUnique({
      where: { id: input.sessionId },
      include: sessionInclude,
    });

    if (!session) {
      throw new ApiError(404, "Session was not found.", "SESSION_NOT_FOUND");
    }

    const isReschedule = input.startTime !== undefined;
    const isCancel = input.status === CareSessionStatus.CANCELLED;
    const isProviderMutation =
      input.meetingLink !== undefined ||
      input.description !== undefined ||
      input.notes !== undefined ||
      input.endedAt !== undefined ||
      (input.status !== undefined && !isCancel && !isReschedule);

    if (isCancel || isReschedule) {
      assertResourceParticipant(
        { actorId: input.actorId, actorRole: input.actorRole },
        { userId: session.userId, providerId: session.providerId },
        "You do not have access to update this session.",
      );

      if (
        isCancel &&
        session.userId === input.actorId &&
        input.actorId !== session.providerId &&
        !isAdminRole(input.actorRole)
      ) {
        assertParticipantCancellationWindow(session);
      }
    } else if (isProviderMutation) {
      assertResourceProvider(
        { actorId: input.actorId, actorRole: input.actorRole },
        { providerId: session.providerId },
        "You do not have access to update this session.",
      );
    } else {
      assertResourceParticipant(
        { actorId: input.actorId, actorRole: input.actorRole },
        { userId: session.userId, providerId: session.providerId },
        "You do not have access to update this session.",
      );
    }

    if (isReschedule) {
      const nextStartTime = new Date(input.startTime!);
      if (Number.isNaN(nextStartTime.getTime())) {
        throw new ApiError(400, "Invalid start time.", "VALIDATION_ERROR");
      }
      await applySessionReschedule(tx, session, nextStartTime, session.duration, input.actorId);
      session = await tx.careSession.findUniqueOrThrow({
        where: { id: session.id },
        include: sessionInclude,
      });
    }

    const nextStatus = (input.status ?? session.status) as CareSessionStatus;
    const completingNow =
      nextStatus === CareSessionStatus.COMPLETED && session.status !== CareSessionStatus.COMPLETED;
    const cancellingNow =
      nextStatus === CareSessionStatus.CANCELLED && session.status !== CareSessionStatus.CANCELLED;
    const listenerFlow = isListenerFlowSession(session);

    if (completingNow) {
      assertResourceProvider(
        { actorId: input.actorId, actorRole: input.actorRole },
        { providerId: session.providerId },
        "Only the provider can complete this session.",
      );
    }

    if (completingNow && session.bookingId) {
      await settleTherapistSessionCompletion(tx, session);
    }

    if (completingNow && listenerFlow) {
      await settleListenerSessionPayout(tx, session);
    }

    if (cancellingNow) {
      assertSessionIsMutable(session, "cancelled");
      if (session.bookingId) {
        await refundTherapistSessionPayment(tx, session);
        await tx.booking.update({
          where: { id: session.bookingId },
          data: { status: BookingStatus.CANCELLED },
        });
      }
      if (listenerFlow) {
        await refundListenerSessionPayment(tx, session);
      }
    }

    let endTime: Date | undefined;
    let durationMinutes = session.duration;

    if (completingNow && listenerFlow) {
      const endedAt = input.endedAt ? new Date(input.endedAt) : new Date();
      if (Number.isNaN(endedAt.getTime())) {
        throw new ApiError(400, "Invalid endedAt timestamp.", "VALIDATION_ERROR");
      }
      if (endedAt.getTime() < session.startTime.getTime()) {
        throw new ApiError(
          400,
          "End time cannot be before the session start.",
          "INVALID_END_TIME",
        );
      }
      const diffMin = Math.round((endedAt.getTime() - session.startTime.getTime()) / 60_000);
      durationMinutes = Math.max(1, Math.min(LISTENER_SESSION_DURATION_CAP_MIN, diffMin));
      endTime = endedAt;
    } else if (completingNow) {
      endTime = new Date();
    }

    const data: Prisma.CareSessionUpdateInput = {};

    if (input.status !== undefined) {
      data.status = nextStatus;
    }

    if (input.meetingLink !== undefined) {
      const trimmed = input.meetingLink.trim();
      data.meetingLink = trimmed.length > 0 ? trimmed : null;
    }
    if (input.description !== undefined) {
      const trimmed = input.description.trim();
      data.description = trimmed.length > 0 ? trimmed : null;
    }
    if (input.notes !== undefined) {
      const trimmed = input.notes.trim();
      data.notes = trimmed.length > 0 ? trimmed : null;
    }
    if (endTime !== undefined) {
      data.endTime = endTime;
      data.duration = durationMinutes;
    }

    const updated = await tx.careSession.update({
      where: { id: session.id },
      data,
      include: sessionInclude,
    });

    if (input.status !== undefined && nextStatus !== session.status) {
      const event =
        nextStatus === CareSessionStatus.ONGOING
          ? SessionLogEvent.STARTED
          : nextStatus === CareSessionStatus.COMPLETED
            ? SessionLogEvent.ENDED
            : nextStatus === CareSessionStatus.CANCELLED
              ? SessionLogEvent.CANCELLED
              : nextStatus === CareSessionStatus.MISSED
                ? SessionLogEvent.CANCELLED
                : null;
      if (event) {
        await tx.sessionLog.create({
          data: {
            sessionId: session.id,
            event,
            metadata: {
              actorId: input.actorId,
              fromStatus: session.status,
              ...(nextStatus === CareSessionStatus.MISSED ? { reason: "NO_SHOW" } : {}),
              ...(completingNow && listenerFlow
                ? { durationMinutes, endTime: endTime?.toISOString() }
                : {}),
            },
          },
        });
      }
    }

    return { updated, priorStatus: session.status };
  });

  if (txResult.priorStatus !== txResult.updated.status) {
    void emitSessionStatusChanged({
      actorId: input.actorId,
      sessionId: txResult.updated.id,
      fromStatus: txResult.priorStatus,
      toStatus: txResult.updated.status,
      userId: txResult.updated.userId,
      providerId: txResult.updated.providerId,
      bookingId: txResult.updated.bookingId,
    }).catch((err) => console.error("[platform-events] session status:", err));
  }

  return txResult.updated;
}
