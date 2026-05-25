import {
  BookingPaymentMethod,
  BookingType,
  Prisma,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import { ApiError } from "@/lib/api-errors";
import { createTransactionRecord } from "@/server/services/transaction-service";
import { toDecimal } from "@/server/services/service-utils";

type Tx = Prisma.TransactionClient;

export function resolveBookingPaymentMethod(
  bookingType: BookingType,
  requested?: BookingPaymentMethod,
): BookingPaymentMethod {
  if (bookingType === BookingType.LISTENER) {
    if (requested && requested !== BookingPaymentMethod.WALLET) {
      throw new ApiError(
        400,
        "Listener sessions must be paid from your wallet balance.",
        "LISTENER_WALLET_ONLY",
      );
    }
    return BookingPaymentMethod.WALLET;
  }

  return requested ?? BookingPaymentMethod.WALLET;
}

export function externalPaymentPurpose(method: BookingPaymentMethod): string {
  if (method === BookingPaymentMethod.QR) return "THERAPIST_BOOKING_QR";
  if (method === BookingPaymentMethod.CARD) return "THERAPIST_BOOKING_CARD";
  return "THERAPIST_BOOKING_EXTERNAL";
}

export async function applyWalletHoldForBooking(
  tx: Tx,
  input: {
    wallet: {
      id: string;
      userId: string;
      availableBalance: Prisma.Decimal;
      heldBalance: Prisma.Decimal;
    };
    bookingId: string;
    userId: string;
    providerId: string;
    bookingType: BookingType;
    amount: Prisma.Decimal;
  },
) {
  if (input.wallet.availableBalance.lessThan(input.amount)) {
    throw new ApiError(
      400,
      "Insufficient wallet balance. Top up your wallet to continue.",
      "INSUFFICIENT_FUNDS",
    );
  }

  await tx.wallet.update({
    where: { id: input.wallet.id },
    data: {
      availableBalance: input.wallet.availableBalance.minus(input.amount),
      heldBalance: input.wallet.heldBalance.plus(input.amount),
    },
  });

  await createTransactionRecord(tx, {
    walletId: input.wallet.id,
    userId: input.userId,
    type: TransactionType.SESSION_PAYMENT,
    amount: input.amount,
    status: TransactionStatus.PENDING,
    purpose: "BOOKING_HOLD",
    referenceId: input.bookingId,
    metadata: {
      providerId: input.providerId,
      bookingType: input.bookingType,
      paymentMethod: BookingPaymentMethod.WALLET,
    },
  });
}

export async function recordExternalBookingPayment(
  tx: Tx,
  input: {
    wallet: { id: string; userId: string; totalSpent: Prisma.Decimal };
    bookingId: string;
    userId: string;
    providerId: string;
    bookingType: BookingType;
    amount: Prisma.Decimal;
    paymentMethod: BookingPaymentMethod;
  },
) {
  if (
    input.paymentMethod !== BookingPaymentMethod.QR &&
    input.paymentMethod !== BookingPaymentMethod.CARD
  ) {
    throw new ApiError(400, "Invalid external payment method.", "INVALID_PAYMENT_METHOD");
  }

  await tx.wallet.update({
    where: { id: input.wallet.id },
    data: {
      totalSpent: input.wallet.totalSpent.plus(input.amount),
    },
  });

  await createTransactionRecord(tx, {
    walletId: input.wallet.id,
    userId: input.userId,
    type: TransactionType.SESSION_PAYMENT,
    amount: input.amount,
    status: TransactionStatus.SUCCESS,
    purpose: externalPaymentPurpose(input.paymentMethod),
    referenceId: input.bookingId,
    metadata: {
      providerId: input.providerId,
      bookingType: input.bookingType,
      paymentMethod: input.paymentMethod,
      channel: input.paymentMethod === BookingPaymentMethod.QR ? "UPI_QR" : "CARD",
    },
  });
}

export async function releaseWalletHoldForBooking(
  tx: Tx,
  input: {
    bookingId: string;
    userId: string;
    amount: Prisma.Decimal;
    action: "REJECTED" | "CANCELLED";
  },
) {
  const wallet = await tx.wallet.findUnique({ where: { userId: input.userId } });
  if (!wallet) {
    throw new ApiError(404, "Booking wallet was not found.", "WALLET_NOT_FOUND");
  }

  const pendingPayment = await tx.transaction.findFirst({
    where: {
      referenceId: input.bookingId,
      type: TransactionType.SESSION_PAYMENT,
      status: TransactionStatus.PENDING,
    },
  });

  await tx.wallet.update({
    where: { id: wallet.id },
    data: {
      availableBalance: wallet.availableBalance.plus(input.amount),
      heldBalance: wallet.heldBalance.minus(input.amount),
    },
  });

  if (pendingPayment) {
    await tx.transaction.update({
      where: { id: pendingPayment.id },
      data: {
        status: TransactionStatus.FAILED,
        metadata: { action: input.action },
      },
    });
  }

  await createTransactionRecord(tx, {
    walletId: wallet.id,
    userId: input.userId,
    type: TransactionType.REFUND,
    amount: input.amount,
    status: TransactionStatus.SUCCESS,
    purpose: input.action === "REJECTED" ? "BOOKING_REJECTED" : "BOOKING_CANCELLED",
    referenceId: input.bookingId,
    metadata: { paymentMethod: BookingPaymentMethod.WALLET },
  });
}

export async function voidExternalBookingPayment(
  tx: Tx,
  input: {
    bookingId: string;
    action: "REJECTED" | "CANCELLED";
  },
) {
  const settled = await tx.transaction.findFirst({
    where: {
      referenceId: input.bookingId,
      type: TransactionType.SESSION_PAYMENT,
      status: TransactionStatus.SUCCESS,
    },
  });

  if (settled) {
    await tx.transaction.update({
      where: { id: settled.id },
      data: {
        status: TransactionStatus.FAILED,
        metadata: {
          action: input.action,
          refundNote: "External payment requires manual refund processing.",
        },
      },
    });
  }
}
