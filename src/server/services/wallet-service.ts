import { TransactionStatus, TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import { createTransactionRecord } from "@/server/services/transaction-service";
import { toDecimal } from "@/server/services/service-utils";
import { emitWalletTransaction } from "@/server/services/platform-events";

export async function getWalletForUser(userId: string) {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!wallet) {
    throw new ApiError(404, "Wallet was not found.", "WALLET_NOT_FOUND");
  }

  return wallet;
}

export async function addMoneyToWallet(userId: string, amount: number) {
  const decimalAmount = toDecimal(amount);

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } });

    if (!wallet) {
      throw new ApiError(404, "Wallet was not found.", "WALLET_NOT_FOUND");
    }

    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        availableBalance: wallet.availableBalance.plus(decimalAmount),
      },
    });

    const transaction = await createTransactionRecord(tx, {
      walletId: wallet.id,
      userId,
      type: TransactionType.CREDIT,
      amount: decimalAmount,
      status: TransactionStatus.SUCCESS,
      purpose: "WALLET_TOP_UP",
      metadata: { source: "manual" },
    });

    const payload = {
      wallet: updatedWallet,
      transaction,
    };

    void emitWalletTransaction({
      transactionId: transaction.id,
      type: "CREDIT",
      amount: decimalAmount.toString(),
      userId,
      purpose: "WALLET_TOP_UP",
    }).catch((err) => console.error("[platform-events] wallet credit:", err));

    return payload;
  });
}

export async function withdrawFromWallet(userId: string, amount: number) {
  const decimalAmount = toDecimal(amount);

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } });

    if (!wallet) {
      throw new ApiError(404, "Wallet was not found.", "WALLET_NOT_FOUND");
    }

    if (wallet.availableBalance.lessThan(decimalAmount)) {
      throw new ApiError(400, "Insufficient wallet balance.", "INSUFFICIENT_FUNDS");
    }

    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        availableBalance: wallet.availableBalance.minus(decimalAmount),
        totalSpent: wallet.totalSpent.plus(decimalAmount),
      },
    });

    const transaction = await createTransactionRecord(tx, {
      walletId: wallet.id,
      userId,
      type: TransactionType.DEBIT,
      amount: decimalAmount,
      status: TransactionStatus.SUCCESS,
      purpose: "WALLET_WITHDRAWAL",
      metadata: { destination: "manual" },
    });

    const payload = {
      wallet: updatedWallet,
      transaction,
    };

    void emitWalletTransaction({
      transactionId: transaction.id,
      type: "DEBIT",
      amount: decimalAmount.toString(),
      userId,
      purpose: "WALLET_WITHDRAWAL",
    }).catch((err) => console.error("[platform-events] wallet debit:", err));

    return payload;
  });
}
