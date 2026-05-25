import { BookingStatus, CareSessionStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  activeRangesForDate,
  bookingConflictsExist,
  findContainingSlot,
  findPublishedSlot,
  parseStoredSlots,
  reconcileSlotsForDate,
  slotRangeMinutes,
} from "@/server/services/slot-availability";

describe("slot-availability helpers", () => {
  describe("slotRangeMinutes", () => {
    it("parses 24h slot strings to minute ranges", () => {
      expect(slotRangeMinutes({ start: "09:30", end: "10:30" })).toEqual({
        startMinutes: 570,
        endMinutes: 630,
      });
    });

    it("rejects malformed or zero-length ranges", () => {
      expect(slotRangeMinutes({ start: "bad", end: "10:30" })).toBeNull();
      expect(slotRangeMinutes({ start: "10:30", end: "10:30" })).toBeNull();
      expect(slotRangeMinutes({ start: "10:30", end: "09:30" })).toBeNull();
    });
  });

  describe("parseStoredSlots", () => {
    it("normalises stored JSON to typed slots and drops malformed entries", () => {
      const value = [
        { start: "09:00", end: "10:00", isBooked: true },
        { start: "10:00", end: "11:00" },
        { foo: "bar" },
        null,
      ];
      expect(parseStoredSlots(value)).toEqual([
        { start: "09:00", end: "10:00", isBooked: true },
        { start: "10:00", end: "11:00", isBooked: false },
      ]);
    });

    it("returns an empty list when input is not an array", () => {
      expect(parseStoredSlots(null)).toEqual([]);
      expect(parseStoredSlots({} as never)).toEqual([]);
    });
  });

  describe("reconcileSlotsForDate", () => {
    const date = new Date("2026-05-15T00:00:00.000Z");

    it("marks slots booked when an active booking overlaps", () => {
      const slots = [
        { start: "09:00", end: "10:00", isBooked: false },
        { start: "10:00", end: "11:00", isBooked: false },
        { start: "11:00", end: "12:00", isBooked: false },
      ];

      const result = reconcileSlotsForDate({
        date,
        slots,
        bookings: [
          {
            requestedDate: date,
            requestedTime: "10:00",
            duration: 60,
            status: BookingStatus.PENDING,
          },
        ],
        sessions: [],
      });

      expect(result).toEqual([
        { start: "09:00", end: "10:00", isBooked: false },
        { start: "10:00", end: "11:00", isBooked: true },
        { start: "11:00", end: "12:00", isBooked: false },
      ]);
    });

    it("ignores bookings on other days and non-active statuses", () => {
      const slots = [{ start: "09:00", end: "10:00", isBooked: false }];
      const result = reconcileSlotsForDate({
        date,
        slots,
        bookings: [
          {
            requestedDate: new Date("2026-05-14T00:00:00.000Z"),
            requestedTime: "09:00",
            duration: 60,
            status: BookingStatus.PENDING,
          },
          {
            requestedDate: date,
            requestedTime: "09:00",
            duration: 60,
            status: BookingStatus.CANCELLED,
          },
        ],
        sessions: [],
      });

      expect(result[0].isBooked).toBe(false);
    });

    it("respects active sessions that share the slot range", () => {
      const slots = [{ start: "09:00", end: "10:00", isBooked: false }];
      const result = reconcileSlotsForDate({
        date,
        slots,
        bookings: [],
        sessions: [
          {
            startTime: new Date("2026-05-15T09:30:00.000Z"),
            duration: 60,
            status: CareSessionStatus.UPCOMING,
          },
        ],
      });

      expect(result[0].isBooked).toBe(true);
    });

    it("treats malformed slots as booked so they cannot be selected", () => {
      const slots = [{ start: "garbage", end: "10:00", isBooked: false }];
      const result = reconcileSlotsForDate({
        date,
        slots,
        bookings: [],
        sessions: [],
      });
      expect(result[0].isBooked).toBe(true);
    });
  });

  describe("bookingConflictsExist", () => {
    const date = new Date("2026-05-15T00:00:00.000Z");

    it("detects overlapping active bookings", () => {
      expect(
        bookingConflictsExist({
          requestedDate: date,
          requestedTime: "10:30",
          duration: 60,
          bookings: [
            {
              requestedDate: date,
              requestedTime: "10:00",
              duration: 60,
              status: BookingStatus.ACCEPTED,
            },
          ],
          sessions: [],
        }),
      ).toBe(true);
    });

    it("returns false when the only conflicting booking is cancelled", () => {
      expect(
        bookingConflictsExist({
          requestedDate: date,
          requestedTime: "10:00",
          duration: 60,
          bookings: [
            {
              requestedDate: date,
              requestedTime: "10:00",
              duration: 60,
              status: BookingStatus.REJECTED,
            },
          ],
          sessions: [],
        }),
      ).toBe(false);
    });

    it("returns false when no conflict exists", () => {
      expect(
        bookingConflictsExist({
          requestedDate: date,
          requestedTime: "13:00",
          duration: 60,
          bookings: [
            {
              requestedDate: date,
              requestedTime: "10:00",
              duration: 60,
              status: BookingStatus.PENDING,
            },
          ],
          sessions: [],
        }),
      ).toBe(false);
    });
  });

  describe("findPublishedSlot", () => {
    it("returns the published slot matching the requested time", () => {
      const slots = [
        { start: "09:00", end: "10:00" },
        { start: "10:00", end: "11:00" },
      ];
      expect(findPublishedSlot(slots, "10:00")).toEqual({ start: "10:00", end: "11:00" });
      expect(findPublishedSlot(slots, "11:00")).toBeNull();
    });
  });

  describe("findContainingSlot", () => {
    const slots = [
      { start: "09:00", end: "12:00" },
      { start: "14:00", end: "17:00" },
    ];

    it("returns the window that contains a custom start + duration", () => {
      expect(findContainingSlot(slots, "10:30", 60)).toEqual({ start: "09:00", end: "12:00" });
      expect(findContainingSlot(slots, "14:00", 90)).toEqual({ start: "14:00", end: "17:00" });
    });

    it("returns null when the session would spill past the window", () => {
      expect(findContainingSlot(slots, "11:30", 60)).toBeNull();
      expect(findContainingSlot(slots, "16:30", 60)).toBeNull();
    });

    it("returns null when the start is outside all windows", () => {
      expect(findContainingSlot(slots, "08:00", 60)).toBeNull();
      expect(findContainingSlot(slots, "12:30", 60)).toBeNull();
    });
  });

  describe("activeRangesForDate", () => {
    const date = new Date("2026-05-15T00:00:00.000Z");

    it("returns sorted ranges from active bookings + sessions", () => {
      const ranges = activeRangesForDate({
        date,
        bookings: [
          {
            requestedDate: date,
            requestedTime: "14:00",
            duration: 60,
            status: BookingStatus.ACCEPTED,
          },
          {
            requestedDate: date,
            requestedTime: "09:30",
            duration: 45,
            status: BookingStatus.PENDING,
          },
        ],
        sessions: [
          {
            startTime: new Date("2026-05-15T11:00:00.000Z"),
            duration: 30,
            status: CareSessionStatus.UPCOMING,
          },
        ],
      });

      expect(ranges).toEqual([
        { start: "09:30", end: "10:15" },
        { start: "11:00", end: "11:30" },
        { start: "14:00", end: "15:00" },
      ]);
    });

    it("skips cancelled bookings and sessions on other days", () => {
      const ranges = activeRangesForDate({
        date,
        bookings: [
          {
            requestedDate: date,
            requestedTime: "09:00",
            duration: 60,
            status: BookingStatus.CANCELLED,
          },
          {
            requestedDate: new Date("2026-05-14T00:00:00.000Z"),
            requestedTime: "10:00",
            duration: 60,
            status: BookingStatus.PENDING,
          },
        ],
        sessions: [],
      });

      expect(ranges).toEqual([]);
    });
  });
});
