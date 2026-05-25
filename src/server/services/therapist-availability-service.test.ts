import { BookingStatus, CareSessionStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    therapistAvailability: { findMany: vi.fn(), deleteMany: vi.fn(), createMany: vi.fn() },
    booking: { findMany: vi.fn() },
    careSession: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import {
  generateSlotsForWindow,
  markBookedSlots,
} from "@/server/services/therapist-availability-service";

describe("therapist-availability-service helpers", () => {
  describe("generateSlotsForWindow", () => {
    it("generates 60 min slots back-to-back when there is no break", () => {
      const slots = generateSlotsForWindow({
        startTime: "09:00",
        endTime: "12:00",
        slotDuration: 60,
        breakDuration: 0,
      });
      expect(slots).toEqual([
        { start: "09:00", end: "10:00" },
        { start: "10:00", end: "11:00" },
        { start: "11:00", end: "12:00" },
      ]);
    });

    it("respects breakDuration between slots", () => {
      const slots = generateSlotsForWindow({
        startTime: "09:00",
        endTime: "12:00",
        slotDuration: 60,
        breakDuration: 15,
      });
      expect(slots).toEqual([
        { start: "09:00", end: "10:00" },
        { start: "10:15", end: "11:15" },
      ]);
    });

    it("drops slots that would overflow endTime", () => {
      const slots = generateSlotsForWindow({
        startTime: "09:00",
        endTime: "09:45",
        slotDuration: 60,
        breakDuration: 0,
      });
      expect(slots).toEqual([]);
    });

    it("supports custom slotDuration like 45 minutes", () => {
      const slots = generateSlotsForWindow({
        startTime: "10:00",
        endTime: "11:30",
        slotDuration: 45,
        breakDuration: 0,
      });
      expect(slots).toEqual([
        { start: "10:00", end: "10:45" },
        { start: "10:45", end: "11:30" },
      ]);
    });
  });

  describe("markBookedSlots", () => {
    const date = new Date("2026-05-15T00:00:00.000Z");

    it("marks slots overlapping an active booking as booked", () => {
      const slots = [
        { start: "09:00", end: "10:00" },
        { start: "10:00", end: "11:00" },
      ];
      const result = markBookedSlots({
        date,
        slots,
        bookings: [
          {
            requestedDate: date,
            requestedTime: "09:30",
            duration: 30,
            status: BookingStatus.PENDING,
          },
        ],
        sessions: [],
      });
      expect(result[0].isBooked).toBe(true);
      expect(result[1].isBooked).toBe(false);
    });

    it("marks slots overlapping an upcoming session as booked", () => {
      const slots = [{ start: "14:00", end: "15:00" }];
      const result = markBookedSlots({
        date,
        slots,
        bookings: [],
        sessions: [
          {
            startTime: new Date("2026-05-15T14:30:00.000Z"),
            duration: 30,
            status: CareSessionStatus.UPCOMING,
          },
        ],
      });
      expect(result[0].isBooked).toBe(true);
    });

    it("ignores cancelled bookings and sessions", () => {
      const slots = [{ start: "09:00", end: "10:00" }];
      const result = markBookedSlots({
        date,
        slots,
        bookings: [
          {
            requestedDate: date,
            requestedTime: "09:00",
            duration: 60,
            status: BookingStatus.CANCELLED,
          },
        ],
        sessions: [
          {
            startTime: new Date("2026-05-15T09:00:00.000Z"),
            duration: 60,
            status: CareSessionStatus.CANCELLED,
          },
        ],
      });
      expect(result[0].isBooked).toBe(false);
    });

    it("filters out conflicts that fall on different dates", () => {
      const slots = [{ start: "09:00", end: "10:00" }];
      const result = markBookedSlots({
        date,
        slots,
        bookings: [
          {
            requestedDate: new Date("2026-05-14T00:00:00.000Z"),
            requestedTime: "09:30",
            duration: 30,
            status: BookingStatus.PENDING,
          },
        ],
        sessions: [],
      });
      expect(result[0].isBooked).toBe(false);
    });
  });
});
