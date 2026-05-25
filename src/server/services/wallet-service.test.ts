import { Prisma, TransactionStatus, TransactionType } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, createTransactionRecordMock } = vi.hoisted(() => ({
  prismaMock: {
    wallet: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  createTransactionRecordMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/server/services/transaction-service", () => ({
  createTransactionRecord: createTransactionRecordMock,
}));

import {
  addMoneyToWallet,
  getWalletForUser,
  withdrawFromWallet,
} from "@/server/services/wallet-service";

function buildWallet(overrides?: Partial<{
  id: string;
  userId: string;
  availableBalance: Prisma.Decimal;
  heldBalance: Prisma.Decimal;
  totalSpent: Prisma.Decimal;
}>) {
  return {
    id: "wallet_1",
    userId: "user_1",
    availableBalance: new Prisma.Decimal("500.00"),
    heldBalance: new Prisma.Decimal("25.00"),
    totalSpent: new Prisma.Decimal("30.00"),
    ...overrides,
  };
}

function createTxWalletMock(wallet = buildWallet()) {
  return {
    wallet: {
      findUnique: vi.fn().mockResolvedValue(wallet),
      update: vi.fn().mockImplementation(({ data }: { data: Record<string, Prisma.Decimal> }) =>
        Promise.resolve({
          ...wallet,
          availableBalance: data.availableBalance ?? wallet.availableBalance,
          totalSpent: data.totalSpent ?? wallet.totalSpent,
        }),
      ),
    },
  };
}

describe("wallet service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads a wallet with recent transactions", async () => {
    const wallet = buildWallet();
    prismaMock.wallet.findUnique.mockResolvedValue(wallet);

    await expect(getWalletForUser("user_1")).resolves.toBe(wallet);
    expect(prismaMock.wallet.findUnique).toHaveBeenCalledWith({
      where: { userId: "user_1" },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
  });

  it("throws when the requested wallet does not exist", async () => {
    prismaMock.wallet.findUnique.mockResolvedValue(null);

    await expect(getWalletForUser("missing_user")).rejects.toMatchObject({
      status: 404,
      code: "WALLET_NOT_FOUND",
    });
  });

  it("adds money and records a successful credit transaction", async () => {
    const wallet = buildWallet();
    const tx = createTxWalletMock(wallet);
    const recordedTransaction = { id: "txn_credit" };
    createTransactionRecordMock.mockResolvedValue(recordedTransaction);
    prismaMock.$transaction.mockImplementation(async (callback: (txArg: typeof tx) => unknown) =>
      callback(tx),
    );

    const result = await addMoneyToWallet("user_1", 120.5);

    expect(tx.wallet.update).toHaveBeenCalledWith({
      where: { id: wallet.id },
      data: {
        availableBalance: wallet.availableBalance.plus(new Prisma.Decimal("120.5")),
      },
    });
    expect(createTransactionRecordMock).toHaveBeenCalledWith(tx, {
      walletId: wallet.id,
      userId: "user_1",
      type: TransactionType.CREDIT,
      amount: new Prisma.Decimal("120.5"),
      status: TransactionStatus.SUCCESS,
      purpose: "WALLET_TOP_UP",
      metadata: { source: "manual" },
    });
    expect(result.transaction).toBe(recordedTransaction);
    expect(result.wallet.availableBalance.toString()).toBe("620.5");
  });

  it("rejects withdrawals that exceed the available balance", async () => {
    const wallet = buildWallet({
      availableBalance: new Prisma.Decimal("40.00"),
    });
    const tx = createTxWalletMock(wallet);
    prismaMock.$transaction.mockImplementation(async (callback: (txArg: typeof tx) => unknown) =>
      callback(tx),
    );

    await expect(withdrawFromWallet("user_1", 50)).rejects.toMatchObject({
      status: 400,
      code: "INSUFFICIENT_FUNDS",
    });
    expect(tx.wallet.update).not.toHaveBeenCalled();
    expect(createTransactionRecordMock).not.toHaveBeenCalled();
  });

  it("withdraws money and records a successful debit transaction", async () => {
    const wallet = buildWallet();
    const tx = createTxWalletMock(wallet);
    const recordedTransaction = { id: "txn_debit" };
    createTransactionRecordMock.mockResolvedValue(recordedTransaction);
    prismaMock.$transaction.mockImplementation(async (callback: (txArg: typeof tx) => unknown) =>
      callback(tx),
    );

    const result = await withdrawFromWallet("user_1", 75);

    expect(tx.wallet.update).toHaveBeenCalledWith({
      where: { id: wallet.id },
      data: {
        availableBalance: wallet.availableBalance.minus(new Prisma.Decimal("75")),
        totalSpent: wallet.totalSpent.plus(new Prisma.Decimal("75")),
      },
    });
    expect(createTransactionRecordMock).toHaveBeenCalledWith(tx, {
      walletId: wallet.id,
      userId: "user_1",
      type: TransactionType.DEBIT,
      amount: new Prisma.Decimal("75"),
      status: TransactionStatus.SUCCESS,
      purpose: "WALLET_WITHDRAWAL",
      metadata: { destination: "manual" },
    });
    expect(result.transaction).toBe(recordedTransaction);
    expect(result.wallet.availableBalance.toString()).toBe("425");
    expect(result.wallet.totalSpent.toString()).toBe("105");
  });
});
