import { BookingStatus, CareSessionStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

import {
  DEFAULT_SLOT_DURATION_MIN,
  generateSlotsForWindow,
  LISTENER_SLOT_DURATION_MIN,
  markBookedSlots,
  findOpenSlot,
} from "@/server/services/slot-engine";

describe("slot-engine", () => {
  describe("generateSlotsForWindow", () => {
    it("generates 60 min therapist slots without breaks", () => {
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

    it("respects breakDuration between therapist slots", () => {
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

    it("generates back-to-back 30 min listener slots", () => {
      const slots = generateSlotsForWindow({
        startTime: "19:00",
        endTime: "20:00",
        slotDuration: LISTENER_SLOT_DURATION_MIN,
        breakDuration: 0,
      });
      expect(slots).toEqual([
        { start: "19:00", end: "19:30" },
        { start: "19:30", end: "20:00" },
      ]);
    });
  });

  describe("markBookedSlots", () => {
    const date = new Date("2026-05-13T12:00:00.000Z");

    it("marks slots overlapping active bookings", () => {
      const result = markBookedSlots({
        date,
        slots: [
          { start: "09:00", end: "10:00" },
          { start: "10:00", end: "11:00" },
        ],
        bookings: [
          {
            requestedDate: date,
            requestedTime: "09:00",
            duration: 30,
            status: BookingStatus.ACCEPTED,
          },
        ],
        sessions: [],
      });
      expect(result[0]?.isBooked).toBe(true);
      expect(result[1]?.isBooked).toBe(false);
    });

    it("marks slots overlapping active sessions", () => {
      const result = markBookedSlots({
        date,
        slots: [{ start: "14:00", end: "15:00" }],
        bookings: [],
        sessions: [
          {
            startTime: new Date("2026-05-13T14:30:00.000Z"),
            duration: 60,
            status: CareSessionStatus.UPCOMING,
          },
        ],
      });
      expect(result[0]?.isBooked).toBe(true);
    });
  });

  describe("findOpenSlot", () => {
    it("returns matching open slot for exact start and duration", () => {
      const match = findOpenSlot(
        [
          { start: "10:00", end: "11:00", isBooked: false },
          { start: "11:00", end: "12:00", isBooked: true },
        ],
        "10:00",
        DEFAULT_SLOT_DURATION_MIN,
      );
      expect(match?.start).toBe("10:00");
    });

    it("returns null for booked or mismatched slots", () => {
      expect(
        findOpenSlot(
          [{ start: "10:00", end: "11:00", isBooked: true }],
          "10:00",
          60,
        ),
      ).toBeNull();
    });
  });
});
