import {
  BookingPaymentMethod,
  BookingType,
  CareSessionStatus,
  Prisma,
  Role,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, createTransactionRecordMock } = vi.hoisted(() => ({
  prismaMock: {
    careSession: {
      findMany: vi.fn(),
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

import { listSessions, updateSessionState } from "@/server/services/session-service";

function buildSession(
  overrides?: Partial<{
    id: string;
    bookingId: string | null;
    listenerRequestId: string | null;
    userId: string;
    providerId: string;
    amount: Prisma.Decimal;
    status: CareSessionStatus;
    startTime: Date;
    duration: number;
    sessionMode: BookingType;
  }>,
) {
  return {
    id: "session_1",
    bookingId: "booking_1" as string | null,
    listenerRequestId: null as string | null,
    userId: "user_1",
    providerId: "provider_1",
    amount: new Prisma.Decimal("200.00"),
    status: CareSessionStatus.UPCOMING,
    startTime: new Date("2026-05-14T10:00:00.000Z"),
    duration: 60,
    sessionMode: BookingType.THERAPIST,
    ...overrides,
  };
}

describe("session service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scopes session listings to the participant by default", async () => {
    prismaMock.careSession.findMany.mockResolvedValue([]);

    await listSessions("user_1", Role.USER, {});

    expect(prismaMock.careSession.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
      },
      include: {
        booking: true,
        user: true,
        provider: true,
      },
      orderBy: { startTime: "desc" },
      take: 25,
    });
  });

  it("scopes session listings to provider when using provider scope", async () => {
    prismaMock.careSession.findMany.mockResolvedValue([]);

    await listSessions("therapist_1", Role.THERAPIST, { scope: "provider" });

    expect(prismaMock.careSession.findMany).toHaveBeenCalledWith({
      where: {
        providerId: "therapist_1",
      },
      include: {
        booking: true,
        user: true,
        provider: true,
      },
      orderBy: { startTime: "desc" },
      take: 25,
    });
  });

  it("defaults listeners and therapists to provider-sided session listings", async () => {
    prismaMock.careSession.findMany.mockResolvedValue([]);

    await listSessions("listener_1", Role.LISTENER, {});

    expect(prismaMock.careSession.findMany).toHaveBeenCalledWith({
      where: {
        providerId: "listener_1",
      },
      include: {
        booking: true,
        user: true,
        provider: true,
      },
      orderBy: { startTime: "desc" },
      take: 25,
    });
  });

  it("settles ledger movements and creates a payout when a session is completed", async () => {
    const session = buildSession();
    const participantWallet = {
      id: "wallet_user",
      heldBalance: new Prisma.Decimal("200.00"),
      totalSpent: new Prisma.Decimal("50.00"),
    };
    const providerWallet = {
      id: "wallet_provider",
      availableBalance: new Prisma.Decimal("25.00"),
      totalReceived: new Prisma.Decimal("100.00"),
    };
    const updatedSession = {
      ...session,
      status: CareSessionStatus.COMPLETED,
      booking: { id: session.bookingId, status: "COMPLETED" },
      user: { id: session.userId, name: "Member" },
      provider: { id: session.providerId, name: "Provider" },
    };
    const tx = {
      careSession: {
        findUnique: vi.fn().mockResolvedValue({
          ...session,
          booking: session.bookingId
            ? { id: session.bookingId, paymentMethod: BookingPaymentMethod.WALLET }
            : null,
        }),
        update: vi.fn().mockResolvedValue(updatedSession),
      },
      wallet: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce(participantWallet)
          .mockResolvedValueOnce(providerWallet),
        update: vi.fn().mockResolvedValue({}),
      },
      transaction: {
        findFirst: vi.fn().mockResolvedValue({
          id: "txn_hold",
          status: TransactionStatus.PENDING,
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      booking: {
        update: vi.fn().mockResolvedValue({}),
      },
      sessionLog: {
        create: vi.fn(),
      },
    };

    prismaMock.$transaction.mockImplementation(async (callback: (txArg: typeof tx) => unknown) =>
      callback(tx),
    );

    const result = await updateSessionState({
      sessionId: session.id,
      actorId: session.providerId,
      actorRole: Role.THERAPIST,
      status: CareSessionStatus.COMPLETED,
      notes: "Completed successfully",
    });

    expect(tx.wallet.update).toHaveBeenNthCalledWith(1, {
      where: { id: participantWallet.id },
      data: {
        heldBalance: participantWallet.heldBalance.minus(new Prisma.Decimal("200")),
        totalSpent: participantWallet.totalSpent.plus(new Prisma.Decimal("200")),
      },
    });
    expect(tx.wallet.update).toHaveBeenNthCalledWith(2, {
      where: { id: providerWallet.id },
      data: {
        availableBalance: providerWallet.availableBalance.plus(new Prisma.Decimal("170")),
        totalReceived: providerWallet.totalReceived.plus(new Prisma.Decimal("170")),
      },
    });
    expect(tx.transaction.update).toHaveBeenCalledWith({
      where: { id: "txn_hold" },
      data: {
        status: TransactionStatus.SUCCESS,
        purpose: "SESSION_COMPLETED",
        metadata: {
          platformFee: 30,
          providerNet: 170,
          sessionId: session.id,
          paymentMethod: BookingPaymentMethod.WALLET,
        },
      },
    });
    expect(createTransactionRecordMock).toHaveBeenCalledWith(tx, {
      walletId: providerWallet.id,
      userId: session.providerId,
      type: TransactionType.PAYOUT,
      amount: new Prisma.Decimal("170"),
      status: TransactionStatus.SUCCESS,
      purpose: "SESSION_PAYOUT",
      referenceId: session.id,
      metadata: {
        bookingId: session.bookingId,
        grossAmount: 200,
        platformFee: 30,
        paymentMethod: BookingPaymentMethod.WALLET,
      },
    });
    expect(tx.booking.update).toHaveBeenCalledWith({
      where: { id: session.bookingId },
      data: { status: "COMPLETED" },
    });
    expect(result).toBe(updatedSession);
  });

  it("sets endTime and recomputed duration when completing a listener-flow session", async () => {
    const startTime = new Date("2026-05-14T10:00:00.000Z");
    const session = buildSession({
      bookingId: null,
      listenerRequestId: "lr_1",
      startTime,
      duration: 30,
      sessionMode: BookingType.LISTENER,
    });
    const updatedSession = {
      ...session,
      status: CareSessionStatus.COMPLETED,
      endTime: new Date("2026-05-14T10:18:00.000Z"),
      duration: 18,
      booking: null,
      user: { id: session.userId, name: "Member" },
      provider: { id: session.providerId, name: "Listener" },
    };
    const tx = {
      careSession: {
        findUnique: vi.fn().mockResolvedValue({
          ...session,
          booking: null,
        }),
        update: vi.fn().mockResolvedValue(updatedSession),
      },
      wallet: {
        findUnique: vi.fn().mockResolvedValue({
          id: "wallet_provider",
          availableBalance: new Prisma.Decimal("10.00"),
          totalReceived: new Prisma.Decimal("0.00"),
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      transaction: {
        findFirst: vi.fn().mockResolvedValue(null),
        update: vi.fn(),
      },
      booking: { update: vi.fn() },
      sessionLog: {
        create: vi.fn(),
      },
    };

    prismaMock.$transaction.mockImplementation(async (callback: (txArg: typeof tx) => unknown) =>
      callback(tx),
    );

    await updateSessionState({
      sessionId: session.id,
      actorId: session.providerId,
      actorRole: Role.LISTENER,
      status: CareSessionStatus.COMPLETED,
      endedAt: "2026-05-14T10:18:00.000Z",
    });

    expect(tx.careSession.update).toHaveBeenCalledWith({
      where: { id: session.id },
      data: expect.objectContaining({
        status: CareSessionStatus.COMPLETED,
        endTime: new Date("2026-05-14T10:18:00.000Z"),
        duration: 18,
      }),
      include: {
        booking: true,
        user: true,
        provider: true,
      },
    });
    expect(tx.wallet.update).toHaveBeenCalledWith({
      where: { id: "wallet_provider" },
      data: {
        availableBalance: expect.anything(),
        totalReceived: expect.anything(),
      },
    });
    expect(createTransactionRecordMock).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        userId: session.providerId,
        type: TransactionType.PAYOUT,
        purpose: "SESSION_PAYOUT",
        referenceId: session.id,
      }),
    );
  });
});
