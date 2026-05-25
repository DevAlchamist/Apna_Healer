/**
 * CareSession lifecycle owner: reschedule, cancel, complete, and disputes are
 * handled here. Booking and ListenerBookingRequest records are intake/payment
 * artifacts only; session state does not follow booking status after creation.
 */
import {
  BookingPaymentMethod,
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
  type SessionScope,
} from "@/lib/authz";
import { createTransactionRecord } from "@/server/services/transaction-service";
import { emitSessionStatusChanged } from "@/server/services/platform-events";
import { PLATFORM_FEE_RATE, decimalToNumber, toDecimal } from "@/server/services/service-utils";

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

  return prisma.careSession.findMany({
    where: {
      ...(scope === "participant"
        ? { userId: actorId }
        : scope === "provider"
          ? { providerId: actorId }
          : scope === "both"
            ? { OR: [{ userId: actorId }, { providerId: actorId }] }
            : {}),
      ...(filters.status ? { status: filters.status } : {}),
    },
    include: {
      booking: true,
      user: true,
      provider: true,
    },
    orderBy: { startTime: "desc" },
    take: filters.take ?? 25,
  });
}

export async function getSessionById(sessionId: string, actorId: string, actorRole: Role) {
  const session = await prisma.careSession.findUnique({
    where: { id: sessionId },
    include: {
      booking: true,
      user: true,
      provider: true,
    },
  });

  if (!session) {
    throw new ApiError(404, "Session was not found.", "SESSION_NOT_FOUND");
  }

  assertResourceParticipant(
    { actorId, actorRole },
    { userId: session.userId, providerId: session.providerId },
    "You do not have access to this session.",
  );

  return session;
}

const LISTENER_SESSION_DURATION_CAP_MIN = 240;

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
}) {
  const txResult = await prisma.$transaction(async (tx) => {
    const session = await tx.careSession.findUnique({
      where: { id: input.sessionId },
      include: {
        booking: true,
      },
    });

    if (!session) {
      throw new ApiError(404, "Session was not found.", "SESSION_NOT_FOUND");
    }

    assertResourceProvider(
      { actorId: input.actorId, actorRole: input.actorRole },
      { providerId: session.providerId },
      "You do not have access to update this session.",
    );

    const nextStatus = (input.status ?? session.status) as CareSessionStatus;
    const completingNow =
      nextStatus === CareSessionStatus.COMPLETED && session.status !== CareSessionStatus.COMPLETED;
    const isListenerFlowSession = Boolean(session.listenerRequestId) && !session.bookingId;

    if (completingNow && session.bookingId) {
      const participantWallet = await tx.wallet.findUnique({
        where: { userId: session.userId },
      });
      const providerWallet = await tx.wallet.findUnique({
        where: { userId: session.providerId },
      });
      const booking = session.booking ?? (await tx.booking.findUnique({
        where: { id: session.bookingId },
      }));

      if (!participantWallet || !providerWallet || !booking) {
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
        data: { status: "COMPLETED" },
      });
    }

    if (
      nextStatus === CareSessionStatus.CANCELLED &&
      session.status !== CareSessionStatus.CANCELLED
    ) {
      if (session.bookingId) {
        await tx.booking.update({
          where: { id: session.bookingId },
          data: { status: "CANCELLED" },
        });
      }
    }

    let endTime: Date | undefined;
    let durationMinutes = session.duration;
    if (completingNow && isListenerFlowSession) {
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
    }

    const data: Prisma.CareSessionUpdateInput = {
      status: nextStatus,
    };

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
      include: {
        booking: true,
        user: true,
        provider: true,
      },
    });

    if (nextStatus !== session.status) {
      const event =
        nextStatus === CareSessionStatus.ONGOING
          ? SessionLogEvent.STARTED
          : nextStatus === CareSessionStatus.COMPLETED
            ? SessionLogEvent.ENDED
            : nextStatus === CareSessionStatus.CANCELLED
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
              ...(completingNow && isListenerFlowSession
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
