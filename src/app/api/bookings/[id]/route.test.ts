import { ApiError } from "@/lib/api-errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireSessionUserMock, getBookingByIdMock, updateBookingStatusMock } = vi.hoisted(() => ({
  requireSessionUserMock: vi.fn(),
  getBookingByIdMock: vi.fn(),
  updateBookingStatusMock: vi.fn(),
}));

vi.mock("@/lib/session-auth", () => ({
  requireSessionUser: requireSessionUserMock,
}));

vi.mock("@/server/services/booking-service", () => ({
  getBookingById: getBookingByIdMock,
  updateBookingStatus: updateBookingStatusMock,
}));

import { GET, PATCH } from "@/app/api/bookings/[id]/route";

describe("booking detail route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads a booking for the authenticated actor using the route param", async () => {
    requireSessionUserMock.mockResolvedValue({
      id: "user_1",
      role: "USER",
    });
    getBookingByIdMock.mockResolvedValue({ id: "booking_1" });

    const response = await GET(new Request("http://localhost/api/bookings/booking_1"), {
      params: Promise.resolve({ id: "booking_1" }),
    });

    expect(getBookingByIdMock).toHaveBeenCalledWith("booking_1", "user_1", "USER");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { id: "booking_1" },
    });
  });

  it("updates a booking status with route params and authenticated actor context", async () => {
    requireSessionUserMock.mockResolvedValue({
      id: "provider_1",
      role: "THERAPIST",
    });
    updateBookingStatusMock.mockResolvedValue({
      booking: { id: "booking_1", status: "ACCEPTED" },
    });

    const response = await PATCH(new Request("http://localhost/api/bookings/booking_1", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "ACCEPTED",
        meetingLink: "https://meet.example.com/room-1",
        description: "See you soon",
      }),
    }), {
      params: Promise.resolve({ id: "booking_1" }),
    });

    expect(updateBookingStatusMock).toHaveBeenCalledWith({
      bookingId: "booking_1",
      actorId: "provider_1",
      actorRole: "THERAPIST",
      status: "ACCEPTED",
      meetingLink: "https://meet.example.com/room-1",
      description: "See you soon",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        booking: { id: "booking_1", status: "ACCEPTED" },
      },
    });
  });

  it("returns handler errors in the shared response shape", async () => {
    requireSessionUserMock.mockRejectedValue(
      new ApiError(401, "Authentication required.", "UNAUTHORIZED"),
    );

    const response = await PATCH(new Request("http://localhost/api/bookings/booking_1", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "CANCELLED",
      }),
    }), {
      params: Promise.resolve({ id: "booking_1" }),
    });

    expect(updateBookingStatusMock).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required.",
      },
    });
  });
});
