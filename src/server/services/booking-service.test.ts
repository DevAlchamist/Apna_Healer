import {
  BookingPaymentMethod,
  BookingStatus,
  BookingType,
  Prisma,
  Role,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, createTransactionRecordMock } = vi.hoisted(() => ({
  prismaMock: {
    booking: {
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

const { generateAvailableSlotsMock, findOpenSlotMock } = vi.hoisted(() => ({
  generateAvailableSlotsMock: vi.fn(),
  findOpenSlotMock: vi.fn(),
}));

vi.mock("@/server/services/slot-engine", () => ({
  generateAvailableSlots: generateAvailableSlotsMock,
  findOpenSlot: findOpenSlotMock,
}));

import {
  createBooking,
  listBookings,
  updateBookingStatus,
} from "@/server/services/booking-service";
import { mergeDateAndTime } from "@/server/services/service-utils";

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
    availableBalance: new Prisma.Decimal("600.00"),
    heldBalance: new Prisma.Decimal("0.00"),
    totalSpent: new Prisma.Decimal("0.00"),
    ...overrides,
  };
}

function buildBooking(overrides?: Partial<{
  id: string;
  userId: string;
  providerId: string;
  type: BookingType;
  requestedDate: Date;
  requestedTime: string;
  duration: number;
  amount: Prisma.Decimal;
  status: BookingStatus;
  session: unknown;
}>) {
  return {
    id: "booking_1",
    userId: "user_1",
    providerId: "provider_1",
    type: BookingType.THERAPIST,
    requestedDate: new Date("2026-05-13T00:00:00.000Z"),
    requestedTime: "10:00",
    duration: 60,
    amount: new Prisma.Decimal("150.00"),
    paymentMethod: BookingPaymentMethod.WALLET,
    status: BookingStatus.PENDING,
    session: null,
    ...overrides,
  };
}

describe("booking service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generateAvailableSlotsMock.mockResolvedValue({
      date: "2026-05-13",
      timezone: "Asia/Kolkata",
      slots: [{ start: "10:00", end: "11:00", isBooked: false }],
      available: [{ start: "10:00", end: "11:00" }],
      booked: [],
      unavailableRanges: [],
      slotDuration: 60,
    });
    findOpenSlotMock.mockReturnValue({ start: "10:00", end: "11:00", isBooked: false });
  });

  it("scopes booking listings to the requester by default", async () => {
    prismaMock.booking.findMany.mockResolvedValue([]);

    await listBookings("user_1", Role.USER, {});

    expect(prismaMock.booking.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
      },
      include: {
        user: true,
        provider: true,
        session: true,
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    });
  });

  it("creates a booking, moves wallet funds to held balance, and records a pending payment hold", async () => {
    const wallet = buildWallet();
    const requester = { id: "user_1", role: Role.USER };
    const provider = { id: "provider_1", role: Role.THERAPIST };
    const createdBooking = {
      ...buildBooking(),
      user: requester,
      provider,
    };

    const tx = {
      user: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce(requester)
          .mockResolvedValueOnce(provider),
      },
      wallet: {
        findUnique: vi.fn().mockResolvedValue(wallet),
        update: vi.fn().mockResolvedValue({
          ...wallet,
          availableBalance: wallet.availableBalance.minus(new Prisma.Decimal("150")),
          heldBalance: wallet.heldBalance.plus(new Prisma.Decimal("150")),
        }),
      },
      booking: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({ ...createdBooking, status: BookingStatus.ACCEPTED }),
      },
      careSession: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({
          id: "session_1",
          bookingId: createdBooking.id,
          userId: "user_1",
          providerId: "provider_1",
          sessionMode: BookingType.THERAPIST,
        }),
      },
      sessionLog: {
        create: vi.fn().mockResolvedValue({}),
      },
    };

    prismaMock.$transaction.mockImplementation(async (callback: (txArg: typeof tx) => unknown) =>
      callback(tx),
    );

    const result = await createBooking({
      userId: "user_1",
      providerId: "provider_1",
      type: BookingType.THERAPIST,
      requestedDate: new Date("2026-05-13T10:00:00.000Z"),
      requestedTime: "10:00",
      duration: 60,
      amount: 150,
      note: "Need support",
    });

    expect(tx.booking.create).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        providerId: "provider_1",
        type: BookingType.THERAPIST,
        requestedDate: new Date("2026-05-13T10:00:00.000Z"),
        requestedTime: "10:00",
        duration: 60,
        amount: new Prisma.Decimal("150"),
        paymentMethod: "WALLET",
        note: "Need support",
        status: BookingStatus.ACCEPTED,
      },
      include: {
        user: true,
        provider: true,
      },
    });
    expect(tx.wallet.update).toHaveBeenCalledWith({
      where: { id: wallet.id },
      data: {
        availableBalance: wallet.availableBalance.minus(new Prisma.Decimal("150")),
        heldBalance: wallet.heldBalance.plus(new Prisma.Decimal("150")),
      },
    });
    expect(createTransactionRecordMock).toHaveBeenCalledWith(tx, {
      walletId: wallet.id,
      userId: "user_1",
      type: TransactionType.SESSION_PAYMENT,
      amount: new Prisma.Decimal("150"),
      status: TransactionStatus.PENDING,
      purpose: "BOOKING_HOLD",
      referenceId: createdBooking.id,
      metadata: {
        providerId: "provider_1",
        bookingType: BookingType.THERAPIST,
        paymentMethod: "WALLET",
      },
    });
    expect(result.status).toBe(BookingStatus.ACCEPTED);
    expect(result.session).toBeDefined();
  });

  it("records an immediate external payment for therapist QR bookings without wallet holds", async () => {
    const wallet = buildWallet();
    const requester = { id: "user_1", role: Role.USER };
    const provider = { id: "provider_1", role: Role.THERAPIST };
    const createdBooking = {
      ...buildBooking(),
      paymentMethod: "QR",
      user: requester,
      provider,
    };

    const tx = {
      user: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce(requester)
          .mockResolvedValueOnce(provider),
      },
      wallet: {
        findUnique: vi.fn().mockResolvedValue(wallet),
        update: vi.fn().mockResolvedValue({
          ...wallet,
          totalSpent: wallet.totalSpent.plus(new Prisma.Decimal("150")),
        }),
      },
      booking: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({ ...createdBooking, status: BookingStatus.ACCEPTED }),
      },
      careSession: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({
          id: "session_1",
          bookingId: createdBooking.id,
          userId: "user_1",
          providerId: "provider_1",
          sessionMode: BookingType.THERAPIST,
        }),
      },
      sessionLog: {
        create: vi.fn().mockResolvedValue({}),
      },
    };

    prismaMock.$transaction.mockImplementation(async (callback: (txArg: typeof tx) => unknown) =>
      callback(tx),
    );

    await createBooking({
      userId: "user_1",
      providerId: "provider_1",
      type: BookingType.THERAPIST,
      requestedDate: new Date("2026-05-13T10:00:00.000Z"),
      requestedTime: "10:00",
      duration: 60,
      amount: 150,
      paymentMethod: "QR" as never,
    });

    expect(tx.wallet.update).toHaveBeenCalledWith({
      where: { id: wallet.id },
      data: {
        totalSpent: wallet.totalSpent.plus(new Prisma.Decimal("150")),
      },
    });
    expect(createTransactionRecordMock).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        status: TransactionStatus.SUCCESS,
        purpose: "THERAPIST_BOOKING_QR",
      }),
    );
  });

  it("rejects booking creation when no published availability matches the requested day", async () => {
    generateAvailableSlotsMock.mockResolvedValueOnce({
      date: "2026-05-13",
      timezone: "Asia/Kolkata",
      slots: [],
      available: [],
      booked: [],
      unavailableRanges: [],
      slotDuration: 60,
    });
    findOpenSlotMock.mockReturnValueOnce(null);

    await expect(
      createBooking({
        userId: "user_1",
        providerId: "provider_1",
        type: BookingType.THERAPIST,
        requestedDate: new Date("2026-05-13T00:00:00.000Z"),
        requestedTime: "10:00",
        duration: 60,
        amount: 150,
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: "SLOT_NOT_PUBLISHED",
    });
  });

  it("rejects booking creation when the requested time spills outside any published window", async () => {
    findOpenSlotMock.mockReturnValueOnce(null);

    await expect(
      createBooking({
        userId: "user_1",
        providerId: "provider_1",
        type: BookingType.THERAPIST,
        requestedDate: new Date("2026-05-13T00:00:00.000Z"),
        requestedTime: "11:30",
        duration: 60,
        amount: 150,
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: "SLOT_OUT_OF_WINDOW",
    });
  });

  it("rejects booking creation when an overlapping active booking exists", async () => {
    const wallet = buildWallet();
    const tx = {
      user: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({ id: "user_1", role: Role.USER })
          .mockResolvedValueOnce({ id: "provider_1", role: Role.THERAPIST }),
      },
      wallet: {
        findUnique: vi.fn().mockResolvedValue(wallet),
      },
      booking: {
        findMany: vi.fn().mockResolvedValue([
          {
            requestedDate: new Date("2026-05-13T00:00:00.000Z"),
            requestedTime: "10:00",
            duration: 60,
            status: BookingStatus.PENDING,
          },
        ]),
        create: vi.fn(),
      },
      careSession: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn(),
      },
      sessionLog: {
        create: vi.fn(),
      },
    };

    prismaMock.$transaction.mockImplementation(async (callback: (txArg: typeof tx) => unknown) =>
      callback(tx),
    );

    await expect(
      createBooking({
        userId: "user_1",
        providerId: "provider_1",
        type: BookingType.THERAPIST,
        requestedDate: new Date("2026-05-13T00:00:00.000Z"),
        requestedTime: "10:00",
        duration: 60,
        amount: 150,
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: "SLOT_TAKEN",
    });

    expect(tx.booking.create).not.toHaveBeenCalled();
  });

  it("rejects booking creation when the selected provider role does not match the booking type", async () => {
    const wallet = buildWallet();
    const tx = {
      user: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({ id: "user_1", role: Role.USER })
          .mockResolvedValueOnce({ id: "provider_1", role: Role.LISTENER }),
      },
      wallet: {
        findUnique: vi.fn().mockResolvedValue(wallet),
      },
      booking: {
        create: vi.fn(),
      },
    };

    prismaMock.$transaction.mockImplementation(async (callback: (txArg: typeof tx) => unknown) =>
      callback(tx),
    );

    await expect(
      createBooking({
        userId: "user_1",
        providerId: "provider_1",
        type: BookingType.THERAPIST,
        requestedDate: new Date("2026-05-13T10:00:00.000Z"),
        requestedTime: "10:00",
        duration: 60,
        amount: 150,
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: "INVALID_PROVIDER_ROLE",
    });

    expect(tx.booking.create).not.toHaveBeenCalled();
    expect(createTransactionRecordMock).not.toHaveBeenCalled();
  });

  it("creates a care session when a pending booking is accepted by its provider", async () => {
    const booking = buildBooking();
    const expectedStartTime = mergeDateAndTime(booking.requestedDate, booking.requestedTime);
    const updatedBooking = {
      ...booking,
      status: BookingStatus.ACCEPTED,
      session: { id: "session_1" },
      user: { id: booking.userId, name: "Requester" },
      provider: { id: booking.providerId, name: "Provider" },
    };
    const createdSession = {
      id: "session_1",
      bookingId: booking.id,
      userId: booking.userId,
      providerId: booking.providerId,
      sessionMode: booking.type,
      amount: booking.amount,
      duration: booking.duration,
      startTime: expectedStartTime,
    };
    const tx = {
      booking: {
        findUnique: vi.fn().mockResolvedValue(booking),
        update: vi.fn().mockResolvedValue(updatedBooking),
      },
      careSession: {
        create: vi.fn().mockResolvedValue(createdSession),
      },
      sessionLog: {
        create: vi.fn(),
      },
      wallet: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      transaction: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
    };

    prismaMock.$transaction.mockImplementation(async (callback: (txArg: typeof tx) => unknown) =>
      callback(tx),
    );

    const result = await updateBookingStatus({
      bookingId: booking.id,
      actorId: booking.providerId,
      actorRole: Role.THERAPIST,
      status: BookingStatus.ACCEPTED,
      meetingLink: "https://meet.example/abc",
      description: "Intake session",
    });

    expect(tx.sessionLog.create).toHaveBeenCalledTimes(2);
    expect(tx.careSession.create).toHaveBeenCalledWith({
      data: {
        bookingId: booking.id,
        userId: booking.userId,
        providerId: booking.providerId,
        sessionMode: booking.type,
        amount: booking.amount,
        duration: booking.duration,
        startTime: expectedStartTime,
        meetingLink: "https://meet.example/abc",
        description: "Intake session",
      },
    });
    expect(tx.booking.update).toHaveBeenCalledWith({
      where: { id: booking.id },
      data: { status: BookingStatus.ACCEPTED },
      include: {
        session: true,
        user: true,
        provider: true,
      },
    });
    expect(tx.wallet.update).not.toHaveBeenCalled();
    expect(createTransactionRecordMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      booking: updatedBooking,
      session: createdSession,
    });
  });

  it("rejects acceptance attempts from actors who are not on the booking", async () => {
    const booking = buildBooking();
    const tx = {
      booking: {
        findUnique: vi.fn().mockResolvedValue(booking),
        update: vi.fn(),
      },
      careSession: {
        create: vi.fn(),
      },
      wallet: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      transaction: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
    };

    prismaMock.$transaction.mockImplementation(async (callback: (txArg: typeof tx) => unknown) =>
      callback(tx),
    );

    await expect(
      updateBookingStatus({
        bookingId: booking.id,
        actorId: "stranger",
        actorRole: Role.USER,
        status: BookingStatus.ACCEPTED,
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
    });

    expect(tx.careSession.create).not.toHaveBeenCalled();
    expect(tx.booking.update).not.toHaveBeenCalled();
  });

  it("refunds held funds and writes a refund transaction when a booking is cancelled", async () => {
    const booking = buildBooking();
    const wallet = buildWallet({
      availableBalance: new Prisma.Decimal("450.00"),
      heldBalance: new Prisma.Decimal("150.00"),
    });
    const updatedBooking = {
      ...booking,
      status: BookingStatus.CANCELLED,
      user: { id: booking.userId, name: "Requester" },
      provider: { id: booking.providerId, name: "Provider" },
    };
    const tx = {
      booking: {
        findUnique: vi.fn().mockResolvedValue(booking),
        update: vi.fn().mockResolvedValue(updatedBooking),
      },
      wallet: {
        findUnique: vi.fn().mockResolvedValue(wallet),
        update: vi.fn().mockResolvedValue({
          ...wallet,
          availableBalance: wallet.availableBalance.plus(booking.amount),
          heldBalance: wallet.heldBalance.minus(booking.amount),
        }),
      },
      transaction: {
        findFirst: vi.fn().mockResolvedValue({ id: "txn_hold" }),
        update: vi.fn().mockResolvedValue({
          id: "txn_hold",
          status: TransactionStatus.FAILED,
        }),
      },
      careSession: {
        create: vi.fn(),
      },
    };

    prismaMock.$transaction.mockImplementation(async (callback: (txArg: typeof tx) => unknown) =>
      callback(tx),
    );

    const result = await updateBookingStatus({
      bookingId: booking.id,
      actorId: booking.userId,
      actorRole: Role.USER,
      status: BookingStatus.CANCELLED,
    });

    expect(tx.wallet.update).toHaveBeenCalledWith({
      where: { id: wallet.id },
      data: {
        availableBalance: wallet.availableBalance.plus(booking.amount),
        heldBalance: wallet.heldBalance.minus(booking.amount),
      },
    });
    expect(tx.transaction.update).toHaveBeenCalledWith({
      where: { id: "txn_hold" },
      data: {
        status: TransactionStatus.FAILED,
        metadata: {
          action: BookingStatus.CANCELLED,
        },
      },
    });
    expect(createTransactionRecordMock).toHaveBeenCalledWith(tx, {
      walletId: wallet.id,
      userId: booking.userId,
      type: TransactionType.REFUND,
      amount: booking.amount,
      status: TransactionStatus.SUCCESS,
      purpose: "BOOKING_CANCELLED",
      referenceId: booking.id,
      metadata: { paymentMethod: BookingPaymentMethod.WALLET },
    });
    expect(result).toEqual({
      booking: updatedBooking,
    });
  });
});
