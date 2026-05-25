import { CareSessionStatus, ListenerConfirmation, ListenerRequestStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    listenerAvailability: { findMany: vi.fn(), deleteMany: vi.fn(), createMany: vi.fn() },
    listenerBookingRequest: { findMany: vi.fn() },
    careSession: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import {
  aggregateListenerSlots,
  dayOfWeekForDate,
  generateSlotsForWindow,
  LISTENER_SLOT_DURATION_MIN,
  listenerBusyRangesForDate,
  subtractBusySlots,
} from "@/server/services/listener-availability-service";

describe("listener-availability-service helpers", () => {
  describe("dayOfWeekForDate", () => {
    it("returns 0..6 matching Date#getDay()", () => {
      const sunday = new Date(2026, 4, 17);
      const wednesday = new Date(2026, 4, 13);
      expect(dayOfWeekForDate(sunday)).toBe(0);
      expect(dayOfWeekForDate(wednesday)).toBe(3);
    });
  });

  describe("generateSlotsForWindow", () => {
    function slotStarts(
      window: { startTime: string; endTime: string },
      slotDuration = LISTENER_SLOT_DURATION_MIN,
    ) {
      return generateSlotsForWindow({
        ...window,
        slotDuration,
        breakDuration: 0,
      }).map((slot) => slot.start);
    }

    it("steps in 30 minute increments and clamps to the window end", () => {
      expect(slotStarts({ startTime: "19:00", endTime: "21:00" })).toEqual([
        "19:00",
        "19:30",
        "20:00",
        "20:30",
      ]);
    });

    it("returns an empty array when the window is too short", () => {
      expect(slotStarts({ startTime: "19:00", endTime: "19:15" })).toEqual([]);
    });

    it("rejects inverted or invalid time strings", () => {
      expect(generateSlotsForWindow({ startTime: "20:00", endTime: "19:00" })).toEqual([]);
      expect(generateSlotsForWindow({ startTime: "abc", endTime: "20:00" })).toEqual([]);
    });

    it("honours a custom duration", () => {
      expect(slotStarts({ startTime: "09:00", endTime: "10:30" }, 45)).toEqual(["09:00", "09:45"]);
    });
  });

  describe("subtractBusySlots", () => {
    it("removes slots that overlap a busy range", () => {
      const remaining = subtractBusySlots(
        ["19:00", "19:30", "20:00"],
        LISTENER_SLOT_DURATION_MIN,
        [{ startMinutes: 19 * 60 + 15, endMinutes: 19 * 60 + 45 }],
      );
      expect(remaining).toEqual(["20:00"]);
    });

    it("returns the input untouched when there is nothing busy", () => {
      const remaining = subtractBusySlots(
        ["19:00", "19:30"],
        LISTENER_SLOT_DURATION_MIN,
        [],
      );
      expect(remaining).toEqual(["19:00", "19:30"]);
    });
  });

  describe("listenerBusyRangesForDate", () => {
    const date = new Date("2026-05-15T00:00:00.000Z");

    it("includes pending and assigned requests but not declined ones", () => {
      const ranges = listenerBusyRangesForDate({
        date,
        requests: [
          {
            preferredDate: date,
            preferredTime: "19:00",
            duration: 30,
            status: ListenerRequestStatus.PENDING,
            listenerConfirmation: ListenerConfirmation.PENDING,
          },
          {
            preferredDate: date,
            preferredTime: "20:00",
            duration: 30,
            status: ListenerRequestStatus.ASSIGNED,
            listenerConfirmation: ListenerConfirmation.DECLINED,
          },
          {
            preferredDate: date,
            preferredTime: "21:00",
            duration: 30,
            status: ListenerRequestStatus.DECLINED,
            listenerConfirmation: ListenerConfirmation.PENDING,
          },
        ],
        sessions: [],
      });
      expect(ranges).toEqual([
        { startMinutes: 19 * 60, endMinutes: 19 * 60 + 30 },
      ]);
    });

    it("includes upcoming sessions and ignores cancelled ones", () => {
      const ranges = listenerBusyRangesForDate({
        date,
        requests: [],
        sessions: [
          {
            startTime: new Date("2026-05-15T19:00:00.000Z"),
            duration: 30,
            status: CareSessionStatus.UPCOMING,
          },
          {
            startTime: new Date("2026-05-15T20:00:00.000Z"),
            duration: 30,
            status: CareSessionStatus.CANCELLED,
          },
        ],
      });
      expect(ranges).toHaveLength(1);
      expect(ranges[0].startMinutes).toBe(19 * 60);
    });

    it("ignores entries from other dates", () => {
      const ranges = listenerBusyRangesForDate({
        date,
        requests: [
          {
            preferredDate: new Date("2026-05-14T00:00:00.000Z"),
            preferredTime: "19:00",
            duration: 30,
            status: ListenerRequestStatus.PENDING,
            listenerConfirmation: ListenerConfirmation.PENDING,
          },
        ],
        sessions: [],
      });
      expect(ranges).toEqual([]);
    });
  });

  describe("aggregateListenerSlots", () => {
    const date = new Date(2026, 4, 15);

    it("unions slots across listeners and removes busy ones per listener", () => {
      const slots = aggregateListenerSlots({
        date,
        durationMin: LISTENER_SLOT_DURATION_MIN,
        perListener: [
          {
            listenerId: "l1",
            windows: [{ startTime: "19:00", endTime: "20:30" }],
            busy: [{ startMinutes: 19 * 60, endMinutes: 19 * 60 + 30 }],
          },
          {
            listenerId: "l2",
            windows: [{ startTime: "19:00", endTime: "20:00" }],
            busy: [],
          },
        ],
      });
      // l1 free: 19:30, 20:00; l2 free: 19:00, 19:30; union sorted
      expect(slots).toEqual(["19:00", "19:30", "20:00"]);
    });

    it("returns empty when every listener is busy", () => {
      const slots = aggregateListenerSlots({
        date,
        durationMin: LISTENER_SLOT_DURATION_MIN,
        perListener: [
          {
            listenerId: "l1",
            windows: [{ startTime: "19:00", endTime: "19:30" }],
            busy: [{ startMinutes: 19 * 60, endMinutes: 19 * 60 + 30 }],
          },
        ],
      });
      expect(slots).toEqual([]);
    });
  });
});
