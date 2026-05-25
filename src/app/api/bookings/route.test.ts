import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireSessionUserMock, createBookingMock, listBookingsMock } = vi.hoisted(() => ({
  requireSessionUserMock: vi.fn(),
  createBookingMock: vi.fn(),
  listBookingsMock: vi.fn(),
}));

vi.mock("@/lib/session-auth", () => ({
  requireSessionUser: requireSessionUserMock,
}));

vi.mock("@/server/services/booking-service", () => ({
  createBooking: createBookingMock,
  listBookings: listBookingsMock,
}));

import { GET, POST } from "@/app/api/bookings/route";

describe("bookings route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists bookings for the authenticated user with parsed query filters", async () => {
    requireSessionUserMock.mockResolvedValue({
      id: "user_1",
      role: "USER",
    });
    listBookingsMock.mockResolvedValue([{ id: "booking_1" }]);

    const response = await GET(
      new NextRequest(
        "http://localhost/api/bookings?scope=requester&status=PENDING&take=5",
      ),
    );

    expect(listBookingsMock).toHaveBeenCalledWith("user_1", "USER", {
      scope: "requester",
      status: "PENDING",
      take: 5,
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: [{ id: "booking_1" }],
    });
  });

  it("creates a booking and converts the requested date into a Date instance", async () => {
    requireSessionUserMock.mockResolvedValue({
      id: "user_1",
      role: "USER",
    });
    createBookingMock.mockResolvedValue({ id: "booking_1" });

    const response = await POST(
      new Request("http://localhost/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          providerId: "provider_1",
          type: "THERAPIST",
          requestedDate: "2026-05-13T10:00:00.000Z",
          requestedTime: "10:00",
          duration: "60",
          amount: 499.5,
          note: "  Need support with burnout  ",
        }),
      }),
    );

    expect(createBookingMock).toHaveBeenCalledWith({
      userId: "user_1",
      providerId: "provider_1",
      type: "THERAPIST",
      requestedDate: new Date("2026-05-13T10:00:00.000Z"),
      requestedTime: "10:00",
      duration: 60,
      amount: 499.5,
      note: "Need support with burnout",
    });
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { id: "booking_1" },
    });
  });

  it("returns a validation error for invalid booking payloads", async () => {
    requireSessionUserMock.mockResolvedValue({
      id: "user_1",
      role: "USER",
    });

    const response = await POST(
      new Request("http://localhost/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          providerId: "provider_1",
          type: "THERAPIST",
          requestedDate: "2026-05-13T10:00:00.000Z",
          requestedTime: "10:00",
          duration: 60,
          amount: 499.555,
        }),
      }),
    );

    expect(createBookingMock).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.success).toBe(false);
    expect(payload.error.code).toBe("VALIDATION_ERROR");
  });
});
