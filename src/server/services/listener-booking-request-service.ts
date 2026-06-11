import {
  BookingType,
  ListenerConfirmation,
  ListenerRequestStatus,
  Prisma,
  Role,
  SessionLogEvent,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import { assertAdmin } from "@/lib/authz";
import { createTransactionRecord } from "@/server/services/transaction-service";
import { mergeDateAndTime, toDecimal } from "@/server/services/service-utils";
import { emitListenerRequestUpdated } from "@/server/services/platform-events";
import {
  getAggregatedListenerSlots,
  LISTENER_SLOT_DURATION_MIN,
} from "@/server/services/listener-availability-service";
import type { CreateListenerBookingRequestInput } from "@/lib/validators/listener-booking-request";

/** Fixed hold for anonymous listener support requests (₹ / healing points). */
export const LISTENER_REQUEST_HOLD_AMOUNT = 50;

async function releaseHold(tx: Prisma.TransactionClient, requestId: string) {
  const request = await tx.listenerBookingRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) {
    throw new ApiError(404, "Listener request was not found.", "LISTENER_REQUEST_NOT_FOUND");
  }

  const wallet = await tx.wallet.findUnique({ where: { userId: request.userId } });
  if (!wallet) {
    throw new ApiError(404, "Wallet was not found.", "WALLET_NOT_FOUND");
  }

  const amount = toDecimal(request.amountHeld);
  if (amount.lessThanOrEqualTo(0)) {
    return;
  }

  const pendingPayment = await tx.transaction.findFirst({
    where: {
      referenceId: requestId,
      type: TransactionType.SESSION_PAYMENT,
      status: TransactionStatus.PENDING,
    },
  });

  await tx.wallet.update({
    where: { id: wallet.id },
    data: {
      availableBalance: wallet.availableBalance.plus(amount),
      heldBalance: wallet.heldBalance.minus(amount),
    },
  });

  if (pendingPayment) {
    await tx.transaction.update({
      where: { id: pendingPayment.id },
      data: {
        status: TransactionStatus.FAILED,
        metadata: { reason: "LISTENER_REQUEST_RELEASED" },
      },
    });
  }

  await createTransactionRecord(tx, {
    walletId: wallet.id,
    userId: request.userId,
    type: TransactionType.REFUND,
    amount,
    status: TransactionStatus.SUCCESS,
    purpose: "LISTENER_REQUEST_RELEASED",
    referenceId: requestId,
  });
}

export async function createListenerBookingRequest(
  userId: string,
  input: CreateListenerBookingRequestInput,
) {
  const holdAmount = toDecimal(LISTENER_REQUEST_HOLD_AMOUNT);
  const preferredDate = new Date(`${input.preferredDate}T00:00:00`);

  const slots = await getAggregatedListenerSlots(preferredDate);
  if (!slots.includes(input.preferredTime)) {
    throw new ApiError(
      400,
      "That time is not available for listener support right now.",
      "LISTENER_SLOT_UNAVAILABLE",
    );
  }

  if (input.duration !== LISTENER_SLOT_DURATION_MIN) {
    throw new ApiError(
      400,
      `Listener support slots are ${LISTENER_SLOT_DURATION_MIN} minutes.`,
      "INVALID_LISTENER_DURATION",
    );
  }

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new ApiError(404, "Wallet was not found.", "WALLET_NOT_FOUND");
    }

    if (wallet.availableBalance.lessThan(holdAmount)) {
      throw new ApiError(400, "Insufficient wallet balance for this request.", "INSUFFICIENT_FUNDS");
    }

    const request = await tx.listenerBookingRequest.create({
      data: {
        userId,
        preferredDate,
        preferredTime: input.preferredTime,
        duration: input.duration,
        emotionalTags: input.emotionalTags,
        preferredTone: input.preferredTone ?? undefined,
        preferredLanguage: input.preferredLanguage ?? undefined,
        note: input.note ?? undefined,
        status: ListenerRequestStatus.PENDING,
        listenerConfirmation: ListenerConfirmation.PENDING,
        amountHeld: holdAmount,
      },
    });

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        availableBalance: wallet.availableBalance.minus(holdAmount),
        heldBalance: wallet.heldBalance.plus(holdAmount),
      },
    });

    const holdTx = await createTransactionRecord(tx, {
      walletId: wallet.id,
      userId,
      type: TransactionType.SESSION_PAYMENT,
      amount: holdAmount,
      status: TransactionStatus.PENDING,
      purpose: "LISTENER_REQUEST_HOLD",
      referenceId: request.id,
      metadata: {
        preferredDate: input.preferredDate,
        preferredTime: input.preferredTime,
      },
    });

    await tx.listenerBookingRequest.update({
      where: { id: request.id },
      data: { holdTransactionId: holdTx.id },
    });

    return tx.listenerBookingRequest.findUniqueOrThrow({
      where: { id: request.id },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        assignedListener: { select: { id: true, name: true, email: true, image: true } },
        session: true,
      },
    });
  });
}

export async function listListenerBookingRequestsForUser(userId: string) {
  return prisma.listenerBookingRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      session: { select: { id: true, status: true, startTime: true } },
    },
  });
}

export async function listListenerBookingRequestsForListener(listenerId: string) {
  return prisma.listenerBookingRequest.findMany({
    where: { assignedListenerId: listenerId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      session: true,
    },
  });
}

export async function listListenerBookingRequestsForAdmin(filters: { status?: ListenerRequestStatus }) {
  return prisma.listenerBookingRequest.findMany({
    where: filters.status ? { status: filters.status } : {},
    orderBy: { createdAt: "asc" },
    take: 200,
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      assignedListener: { select: { id: true, name: true, email: true, image: true, role: true } },
      session: true,
    },
  });
}

export async function getListenerBookingRequestById(requestId: string, actorId: string, actorRole: Role) {
  const request = await prisma.listenerBookingRequest.findUnique({
    where: { id: requestId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      assignedListener: { select: { id: true, name: true, email: true, image: true, role: true } },
      session: true,
    },
  });

  if (!request) {
    throw new ApiError(404, "Listener request was not found.", "LISTENER_REQUEST_NOT_FOUND");
  }

  if (actorRole === Role.ADMIN) {
    return request;
  }
  if (request.userId === actorId || request.assignedListenerId === actorId) {
    return request;
  }

  throw new ApiError(403, "You do not have access to this request.", "FORBIDDEN");
}

export async function listenerRespondToRequest(input: {
  requestId: string;
  listenerId: string;
  decision: "accept" | "decline";
}) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.listenerBookingRequest.findUnique({
      where: { id: input.requestId },
    });

    if (!request) {
      throw new ApiError(404, "Listener request was not found.", "LISTENER_REQUEST_NOT_FOUND");
    }

    if (request.assignedListenerId !== input.listenerId) {
      throw new ApiError(403, "This request is not assigned to you.", "FORBIDDEN");
    }

    if (request.status !== ListenerRequestStatus.ASSIGNED) {
      throw new ApiError(400, "This request is not awaiting your response.", "INVALID_REQUEST_STATE");
    }

    if (request.listenerConfirmation !== ListenerConfirmation.PENDING) {
      throw new ApiError(400, "You have already responded to this request.", "ALREADY_RESPONDED");
    }

    if (input.decision === "decline") {
      await releaseHold(tx, request.id);
      return tx.listenerBookingRequest.update({
        where: { id: request.id },
        data: {
          status: ListenerRequestStatus.DECLINED,
          listenerConfirmation: ListenerConfirmation.DECLINED,
        },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          assignedListener: { select: { id: true, name: true, email: true, image: true } },
          session: true,
        },
      });
    }

    return tx.listenerBookingRequest.update({
      where: { id: request.id },
      data: { listenerConfirmation: ListenerConfirmation.ACCEPTED },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        assignedListener: { select: { id: true, name: true, email: true, image: true } },
        session: true,
      },
    });
  });
}

export async function adminPatchListenerRequest(input: {
  requestId: string;
  adminId: string;
  adminRole: Role;
  action: "assign" | "approve" | "decline" | "update";
  listenerId?: string;
  approve?: {
    meetingLink?: string;
    notes?: string | null;
    description?: string | null;
  };
  update?: {
    preferredDate?: string;
    preferredTime?: string;
    duration?: number;
    emotionalTags?: string[];
    preferredTone?: string | null;
    preferredLanguage?: string | null;
    note?: string | null;
  };
}) {
  assertAdmin(input.adminRole);

  if (input.action === "assign") {
    if (!input.listenerId) {
      throw new ApiError(400, "listenerId is required to assign.", "VALIDATION_ERROR");
    }

    const prior = await prisma.listenerBookingRequest.findUnique({
      where: { id: input.requestId },
      select: { status: true, userId: true },
    });

    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.listenerBookingRequest.findUnique({
        where: { id: input.requestId },
      });
      if (!request) {
        throw new ApiError(404, "Listener request was not found.", "LISTENER_REQUEST_NOT_FOUND");
      }
      if (request.status !== ListenerRequestStatus.PENDING) {
        throw new ApiError(400, "Only pending requests can be assigned.", "INVALID_REQUEST_STATE");
      }

      const listener = await tx.user.findUnique({ where: { id: input.listenerId } });
      if (!listener || listener.role !== Role.LISTENER) {
        throw new ApiError(400, "Invalid listener account.", "INVALID_LISTENER");
      }

      return tx.listenerBookingRequest.update({
        where: { id: input.requestId },
        data: {
          assignedListenerId: input.listenerId,
          status: ListenerRequestStatus.ASSIGNED,
          listenerConfirmation: ListenerConfirmation.PENDING,
          reviewedBy: input.adminId,
          reviewedAt: new Date(),
        },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          assignedListener: { select: { id: true, name: true, email: true, image: true, role: true } },
          session: true,
        },
      });
    });

    if (prior && prior.status !== result.status) {
      void emitListenerRequestUpdated({
        adminId: input.adminId,
        requestId: result.id,
        fromStatus: prior.status,
        toStatus: result.status,
        userId: result.userId,
        assignedListenerId: result.assignedListenerId,
        sessionId: result.session?.id ?? null,
      }).catch((err) => console.error("[platform-events] listener request:", err));
    }

    return result;
  }

  if (input.action === "decline") {
    const prior = await prisma.listenerBookingRequest.findUnique({
      where: { id: input.requestId },
      select: { status: true, userId: true, assignedListenerId: true },
    });

    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.listenerBookingRequest.findUnique({
        where: { id: input.requestId },
      });
      if (!request) {
        throw new ApiError(404, "Listener request was not found.", "LISTENER_REQUEST_NOT_FOUND");
      }
      if (
        request.status === ListenerRequestStatus.APPROVED ||
        request.status === ListenerRequestStatus.DECLINED
      ) {
        throw new ApiError(400, "This request is already closed.", "INVALID_REQUEST_STATE");
      }

      await releaseHold(tx, request.id);

      return tx.listenerBookingRequest.update({
        where: { id: input.requestId },
        data: {
          status: ListenerRequestStatus.DECLINED,
          listenerConfirmation:
            request.status === ListenerRequestStatus.ASSIGNED
              ? ListenerConfirmation.DECLINED
              : request.listenerConfirmation,
          reviewedBy: input.adminId,
          reviewedAt: new Date(),
        },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          assignedListener: { select: { id: true, name: true, email: true, image: true, role: true } },
          session: true,
        },
      });
    });

    if (prior && prior.status !== result.status) {
      void emitListenerRequestUpdated({
        adminId: input.adminId,
        requestId: result.id,
        fromStatus: prior.status,
        toStatus: result.status,
        userId: result.userId,
        assignedListenerId: result.assignedListenerId,
        sessionId: result.session?.id ?? null,
      }).catch((err) => console.error("[platform-events] listener request:", err));
    }

    return result;
  }

  if (input.action === "update") {
    const patch = input.update;
    if (!patch) {
      throw new ApiError(400, "Update payload is required.", "VALIDATION_ERROR");
    }

    return prisma.$transaction(async (tx) => {
      const request = await tx.listenerBookingRequest.findUnique({
        where: { id: input.requestId },
      });
      if (!request) {
        throw new ApiError(404, "Listener request was not found.", "LISTENER_REQUEST_NOT_FOUND");
      }
      if (
        request.status === ListenerRequestStatus.APPROVED ||
        request.status === ListenerRequestStatus.DECLINED
      ) {
        throw new ApiError(400, "Closed requests cannot be edited.", "INVALID_REQUEST_STATE");
      }

      const data: {
        preferredDate?: Date;
        preferredTime?: string;
        duration?: number;
        emotionalTags?: string[];
        preferredTone?: string | null;
        preferredLanguage?: string | null;
        note?: string | null;
        reviewedBy: string;
        reviewedAt: Date;
      } = {
        reviewedBy: input.adminId,
        reviewedAt: new Date(),
      };

      if (patch.preferredDate) {
        data.preferredDate = new Date(`${patch.preferredDate}T00:00:00`);
      }
      if (patch.preferredTime) data.preferredTime = patch.preferredTime;
      if (patch.duration !== undefined) data.duration = patch.duration;
      if (patch.emotionalTags) data.emotionalTags = patch.emotionalTags;
      if (patch.preferredTone !== undefined) data.preferredTone = patch.preferredTone;
      if (patch.preferredLanguage !== undefined) data.preferredLanguage = patch.preferredLanguage;
      if (patch.note !== undefined) data.note = patch.note;

      return tx.listenerBookingRequest.update({
        where: { id: input.requestId },
        data,
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          assignedListener: { select: { id: true, name: true, email: true, image: true, role: true } },
          session: true,
        },
      });
    });
  }

  // approve
  const prior = await prisma.listenerBookingRequest.findUnique({
    where: { id: input.requestId },
    select: { status: true, userId: true, assignedListenerId: true },
  });

  const result = await prisma.$transaction(async (tx) => {
    const request = await tx.listenerBookingRequest.findUnique({
      where: { id: input.requestId },
    });
    if (!request) {
      throw new ApiError(404, "Listener request was not found.", "LISTENER_REQUEST_NOT_FOUND");
    }
    if (request.status !== ListenerRequestStatus.ASSIGNED) {
      throw new ApiError(400, "Only assigned requests can be approved.", "INVALID_REQUEST_STATE");
    }
    if (!request.assignedListenerId) {
      throw new ApiError(400, "No listener is assigned.", "NO_ASSIGNED_LISTENER");
    }

    const meetingLinkTrimmed = input.approve?.meetingLink?.trim();
    const meetingLink = meetingLinkTrimmed && meetingLinkTrimmed.length > 0 ? meetingLinkTrimmed : null;

    const existingSession = await tx.careSession.findFirst({
      where: { listenerRequestId: request.id },
    });
    if (existingSession) {
      throw new ApiError(400, "A session already exists for this request.", "SESSION_EXISTS");
    }

    const startTime = mergeDateAndTime(request.preferredDate, request.preferredTime);
    const amount = toDecimal(request.amountHeld);

    const tagDescription =
      [
        request.emotionalTags.length ? `Tags: ${request.emotionalTags.join(", ")}` : null,
        request.preferredTone ? `Tone: ${request.preferredTone}` : null,
        request.preferredLanguage ? `Language: ${request.preferredLanguage}` : null,
      ]
        .filter(Boolean)
        .join(" · ") || null;

    const approveDesc = input.approve?.description;
    const sessionDescription =
      approveDesc === undefined
        ? tagDescription
        : approveDesc !== null && approveDesc.trim().length > 0
          ? approveDesc.trim()
          : tagDescription;

    const approveNotesVal = input.approve?.notes;
    const sessionNotes =
      approveNotesVal === undefined
        ? request.note ?? null
        : approveNotesVal !== null && approveNotesVal.trim().length > 0
          ? approveNotesVal.trim()
          : null;
    const wallet = await tx.wallet.findUnique({ where: { userId: request.userId } });
    if (!wallet) {
      throw new ApiError(404, "Wallet was not found.", "WALLET_NOT_FOUND");
    }

    const pendingPayment = await tx.transaction.findFirst({
      where: {
        referenceId: request.id,
        type: TransactionType.SESSION_PAYMENT,
        status: TransactionStatus.PENDING,
      },
    });

    if (!pendingPayment) {
      throw new ApiError(400, "Hold transaction was not found.", "HOLD_NOT_FOUND");
    }

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        heldBalance: wallet.heldBalance.minus(amount),
        totalSpent: wallet.totalSpent.plus(amount),
      },
    });

    await tx.transaction.update({
      where: { id: pendingPayment.id },
      data: {
        status: TransactionStatus.SUCCESS,
        purpose: "LISTENER_REQUEST_CAPTURED",
        metadata: {
          listenerRequestId: request.id,
          assignedListenerId: request.assignedListenerId,
        },
      },
    });

    const session = await tx.careSession.create({
      data: {
        bookingId: null,
        listenerRequestId: request.id,
        userId: request.userId,
        providerId: request.assignedListenerId,
        sessionMode: BookingType.LISTENER,
        amount,
        duration: request.duration,
        startTime,
        meetingLink,
        notes: sessionNotes,
        description: sessionDescription,
      },
    });

    await tx.sessionLog.create({
      data: {
        sessionId: session.id,
        event: SessionLogEvent.BOOKED,
        metadata: { listenerRequestId: request.id },
      },
    });

    await tx.listenerBookingRequest.update({
      where: { id: request.id },
      data: {
        status: ListenerRequestStatus.APPROVED,
        captureTransactionId: pendingPayment.id,
        reviewedBy: input.adminId,
        reviewedAt: new Date(),
        listenerConfirmation: ListenerConfirmation.ACCEPTED,
      },
    });

    return tx.listenerBookingRequest.findUniqueOrThrow({
      where: { id: request.id },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        assignedListener: { select: { id: true, name: true, email: true, image: true, role: true } },
        session: true,
      },
    });
  });

  if (prior && prior.status !== result.status) {
    void emitListenerRequestUpdated({
      adminId: input.adminId,
      requestId: result.id,
      fromStatus: prior.status,
      toStatus: result.status,
      userId: result.userId,
      assignedListenerId: result.assignedListenerId,
      sessionId: result.session?.id ?? null,
    }).catch((err) => console.error("[platform-events] listener request:", err));
  }

  return result;
}
