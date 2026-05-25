import {
  BookingPaymentMethod,
  Prisma,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import { ApiError } from "@/lib/api-errors";
import { createTransactionRecord } from "@/server/services/transaction-service";

type Tx = Prisma.TransactionClient;

export function eventExternalPaymentPurpose(method: BookingPaymentMethod): string {
  if (method === BookingPaymentMethod.QR) return "EVENT_REGISTRATION_QR";
  if (method === BookingPaymentMethod.CARD) return "EVENT_REGISTRATION_CARD";
  return "EVENT_REGISTRATION_EXTERNAL";
}

export async function chargeWalletForEvent(
  tx: Tx,
  input: {
    wallet: {
      id: string;
      userId: string;
      availableBalance: Prisma.Decimal;
      totalSpent: Prisma.Decimal;
    };
    eventId: string;
    registrationId: string;
    userId: string;
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
      totalSpent: input.wallet.totalSpent.plus(input.amount),
    },
  });

  return createTransactionRecord(tx, {
    walletId: input.wallet.id,
    userId: input.userId,
    type: TransactionType.SESSION_PAYMENT,
    amount: input.amount,
    status: TransactionStatus.SUCCESS,
    purpose: "EVENT_REGISTRATION_WALLET",
    referenceId: input.registrationId,
    metadata: {
      eventId: input.eventId,
      paymentMethod: BookingPaymentMethod.WALLET,
    },
  });
}

export async function recordExternalEventPayment(
  tx: Tx,
  input: {
    wallet: { id: string; userId: string; totalSpent: Prisma.Decimal };
    eventId: string;
    registrationId: string;
    userId: string;
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

  return createTransactionRecord(tx, {
    walletId: input.wallet.id,
    userId: input.userId,
    type: TransactionType.SESSION_PAYMENT,
    amount: input.amount,
    status: TransactionStatus.SUCCESS,
    purpose: eventExternalPaymentPurpose(input.paymentMethod),
    referenceId: input.registrationId,
    metadata: {
      eventId: input.eventId,
      paymentMethod: input.paymentMethod,
    },
  });
}

export async function refundEventRegistration(
  tx: Tx,
  input: {
    registrationId: string;
    userId: string;
    amount: Prisma.Decimal;
    eventId: string;
  },
) {
  const wallet = await tx.wallet.findUnique({ where: { userId: input.userId } });
  if (!wallet) {
    throw new ApiError(404, "Wallet was not found.", "WALLET_NOT_FOUND");
  }

  if (input.amount.greaterThan(0)) {
    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        availableBalance: wallet.availableBalance.plus(input.amount),
        totalSpent: wallet.totalSpent.greaterThan(input.amount)
          ? wallet.totalSpent.minus(input.amount)
          : new Prisma.Decimal(0),
      },
    });

    await createTransactionRecord(tx, {
      walletId: wallet.id,
      userId: input.userId,
      type: TransactionType.REFUND,
      amount: input.amount,
      status: TransactionStatus.SUCCESS,
      purpose: "EVENT_REGISTRATION_REFUND",
      referenceId: input.registrationId,
      metadata: { eventId: input.eventId },
    });
  }
}
