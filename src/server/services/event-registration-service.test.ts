import {
  BookingPaymentMethod,
  EventRegistrationStatus,
  EventStatus,
} from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, getEventBySlugMock, isActiveClubMemberMock, chargeWalletMock } = vi.hoisted(
  () => ({
    prismaMock: {
      eventRegistration: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), upsert: vi.fn() },
      event: { updateMany: vi.fn() },
      wallet: { findUnique: vi.fn() },
      $transaction: vi.fn(),
    },
    getEventBySlugMock: vi.fn(),
    isActiveClubMemberMock: vi.fn(),
    chargeWalletMock: vi.fn(),
  }),
);

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/server/services/event-service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/services/event-service")>();
  return {
    ...actual,
    getEventBySlug: getEventBySlugMock,
    isActiveClubMember: isActiveClubMemberMock,
    assertCanManageEvent: vi.fn(),
    getEventById: vi.fn(),
  };
});
vi.mock("@/server/services/event-payment", () => ({
  chargeWalletForEvent: chargeWalletMock,
  recordExternalEventPayment: vi.fn(),
  refundEventRegistration: vi.fn(),
}));
vi.mock("@/server/services/platform-events", () => ({
  emitEventRegistrationConfirmed: vi.fn(),
  emitEventRegistrationReceived: vi.fn(),
  emitEventRegistrationCancelled: vi.fn(),
}));

import { registerForEvent } from "./event-registration-service";
import { ApiError } from "@/lib/api-errors";

function buildEvent(overrides?: Record<string, unknown>) {
  return {
    id: "evt_1",
    slug: "test-event",
    status: EventStatus.PUBLISHED,
    seatsRemaining: 5,
    clubId: null,
    basePrice: { toString: () => "200" },
    memberPrice: null,
    guestPrice: null,
    membersPay: true,
    nonMembersPay: true,
    title: "Test",
    club: null,
    ...overrides,
  };
}

describe("registerForEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getEventBySlugMock.mockResolvedValue(buildEvent());
    isActiveClubMemberMock.mockResolvedValue(false);
    prismaMock.eventRegistration.findUnique.mockResolvedValue(null);
  });

  it("creates free confirmed registration when price is zero", async () => {
    getEventBySlugMock.mockResolvedValue(
      buildEvent({ nonMembersPay: false, membersPay: true }),
    );
    isActiveClubMemberMock.mockResolvedValue(false);

    const reg = { id: "reg_1", status: EventRegistrationStatus.CONFIRMED, amountCharged: { toString: () => "0" } };
    prismaMock.$transaction.mockImplementation(async (fn: (tx: typeof prismaMock) => Promise<unknown>) => {
      prismaMock.event.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.eventRegistration.upsert.mockResolvedValue(reg);
      return fn(prismaMock);
    });

    const result = await registerForEvent("user_1", "test-event", {});
    expect(result.status).toBe(EventRegistrationStatus.CONFIRMED);
    expect(prismaMock.eventRegistration.upsert).toHaveBeenCalled();
  });

  it("rejects when event is full", async () => {
    getEventBySlugMock.mockResolvedValue(buildEvent({ seatsRemaining: 0 }));
    await expect(registerForEvent("user_1", "test-event", {})).rejects.toThrow(ApiError);
  });

  it("rejects duplicate registration", async () => {
    prismaMock.eventRegistration.findUnique.mockResolvedValue({
      status: EventRegistrationStatus.CONFIRMED,
    });
    await expect(registerForEvent("user_1", "test-event", {})).rejects.toThrow(ApiError);
  });
});
