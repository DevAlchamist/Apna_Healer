import { Prisma, TransactionStatus, TransactionType } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    transaction: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    wallet: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

import {
  WELCOME_BONUS_AMOUNT,
  WELCOME_BONUS_PURPOSE,
  getWelcomeBonusState,
  grantWelcomeBonusIfNeeded,
  markWelcomeBonusClaimed,
} from "@/server/services/welcome-bonus-service";

function buildWallet() {
  return {
    id: "wallet_1",
    userId: "user_1",
    availableBalance: new Prisma.Decimal(0),
    heldBalance: new Prisma.Decimal(0),
    totalSpent: new Prisma.Decimal(0),
    totalReceived: new Prisma.Decimal(0),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("welcome-bonus-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("grants the welcome bonus once and credits the wallet", async () => {
    const wallet = buildWallet();

    prismaMock.transaction.findFirst.mockResolvedValueOnce(null);

    const tx = {
      transaction: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: "txn_1" }),
      },
      wallet: {
        update: vi.fn(),
      },
    };
    prismaMock.$transaction.mockImplementation(
      async (cb: (arg: typeof tx) => unknown) => cb(tx),
    );

    const result = await grantWelcomeBonusIfNeeded({
      userId: "user_1",
      wallet,
    });

    expect(result).toEqual({ granted: true, transactionId: "txn_1" });
    expect(tx.wallet.update).toHaveBeenCalledWith({
      where: { id: wallet.id },
      data: {
        availableBalance: wallet.availableBalance.plus(WELCOME_BONUS_AMOUNT),
        totalReceived: wallet.totalReceived.plus(WELCOME_BONUS_AMOUNT),
      },
    });
    expect(tx.transaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        walletId: wallet.id,
        userId: "user_1",
        type: TransactionType.CREDIT,
        status: TransactionStatus.SUCCESS,
        purpose: WELCOME_BONUS_PURPOSE,
        metadata: { claimed: false },
      }),
      select: { id: true },
    });
  });

  it("does not grant the bonus a second time", async () => {
    prismaMock.transaction.findFirst.mockResolvedValueOnce({
      id: "txn_existing",
    });

    const result = await grantWelcomeBonusIfNeeded({
      userId: "user_1",
      wallet: buildWallet(),
    });

    expect(result).toEqual({ granted: false, transactionId: "txn_existing" });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("reports the bonus as available when never claimed", async () => {
    prismaMock.transaction.findFirst.mockResolvedValueOnce({
      id: "txn_1",
      amount: new Prisma.Decimal(WELCOME_BONUS_AMOUNT),
      metadata: { claimed: false },
    });

    const state = await getWelcomeBonusState("user_1");
    expect(state).toEqual({
      available: true,
      amount: WELCOME_BONUS_AMOUNT,
      claimed: false,
    });
  });

  it("reports the bonus as claimed once metadata.claimed is true", async () => {
    prismaMock.transaction.findFirst.mockResolvedValueOnce({
      id: "txn_1",
      amount: new Prisma.Decimal(WELCOME_BONUS_AMOUNT),
      metadata: { claimed: true },
    });

    const state = await getWelcomeBonusState("user_1");
    expect(state.available).toBe(false);
    expect(state.claimed).toBe(true);
  });

  it("marks the bonus as claimed when present", async () => {
    prismaMock.transaction.findFirst.mockResolvedValueOnce({
      id: "txn_1",
      metadata: { claimed: false },
    });
    prismaMock.transaction.update.mockResolvedValueOnce({});

    const result = await markWelcomeBonusClaimed("user_1");

    expect(result).toEqual({ alreadyClaimed: false });
    expect(prismaMock.transaction.update).toHaveBeenCalledWith({
      where: { id: "txn_1" },
      data: { metadata: expect.objectContaining({ claimed: true }) },
    });
  });

  it("returns alreadyClaimed when the bonus has been claimed before", async () => {
    prismaMock.transaction.findFirst.mockResolvedValueOnce({
      id: "txn_1",
      metadata: { claimed: true },
    });

    const result = await markWelcomeBonusClaimed("user_1");
    expect(result).toEqual({ alreadyClaimed: true });
    expect(prismaMock.transaction.update).not.toHaveBeenCalled();
  });

  it("throws 404 when no welcome-bonus transaction exists", async () => {
    prismaMock.transaction.findFirst.mockResolvedValueOnce(null);

    await expect(markWelcomeBonusClaimed("user_1")).rejects.toMatchObject({
      status: 404,
      code: "WELCOME_BONUS_NOT_FOUND",
    });
  });
});
