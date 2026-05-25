import { Prisma, TransactionStatus, TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type TransactionClient = Prisma.TransactionClient;

type CreateTransactionInput = {
  walletId: string;
  userId: string;
  type: TransactionType;
  amount: Prisma.Decimal;
  status: TransactionStatus;
  purpose: string;
  referenceId?: string;
  metadata?: Prisma.InputJsonValue;
};

export async function createTransactionRecord(
  tx: TransactionClient,
  input: CreateTransactionInput,
) {
  return tx.transaction.create({
    data: input,
  });
}

export async function listUserTransactions(
  userId: string,
  filters: {
    status?: TransactionStatus;
    take?: number;
  },
) {
  return prisma.transaction.findMany({
    where: {
      userId,
      ...(filters.status ? { status: filters.status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: filters.take ?? 20,
  });
}

export async function listPayoutTransactions(take = 50) {
  return prisma.transaction.findMany({
    where: {
      type: TransactionType.PAYOUT,
      status: TransactionStatus.SUCCESS,
    },
    include: {
      user: true,
      wallet: true,
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}
