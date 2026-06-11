import { CareSessionStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  autoAdvanceUpcomingStatus,
  derivedSessionPhase,
  displaySessionStatus,
} from "@/server/services/session-state";

describe("derivedSessionPhase", () => {
  const start = new Date("2026-05-15T19:00:00.000Z");
  const duration = 60;

  it("returns UPCOMING before start", () => {
    expect(
      derivedSessionPhase({
        startTime: start,
        duration,
        now: new Date("2026-05-15T18:30:00.000Z"),
      }),
    ).toBe("UPCOMING");
  });

  it("returns ONGOING during the window", () => {
    expect(
      derivedSessionPhase({
        startTime: start,
        duration,
        now: new Date("2026-05-15T19:30:00.000Z"),
      }),
    ).toBe("ONGOING");
  });

  it("returns COMPLETED after the window", () => {
    expect(
      derivedSessionPhase({
        startTime: start,
        duration,
        now: new Date("2026-05-15T20:30:00.000Z"),
      }),
    ).toBe("COMPLETED");
  });

  it("uses explicit endTime when provided", () => {
    expect(
      derivedSessionPhase({
        startTime: start,
        endTime: new Date("2026-05-15T20:00:00.000Z"),
        duration: 30, // ignored because endTime is explicit
        now: new Date("2026-05-15T19:59:00.000Z"),
      }),
    ).toBe("ONGOING");
  });
});

describe("displaySessionStatus", () => {
  const start = new Date("2026-05-15T19:00:00.000Z");
  const duration = 60;

  it("respects CANCELLED regardless of time", () => {
    expect(
      displaySessionStatus({
        status: CareSessionStatus.CANCELLED,
        startTime: start,
        duration,
        now: new Date("2026-05-15T18:00:00.000Z"),
      }),
    ).toBe(CareSessionStatus.CANCELLED);
  });

  it("respects MISSED", () => {
    expect(
      displaySessionStatus({
        status: CareSessionStatus.MISSED,
        startTime: start,
        duration,
        now: new Date("2026-05-15T22:00:00.000Z"),
      }),
    ).toBe(CareSessionStatus.MISSED);
  });

  it("upgrades stored UPCOMING to ONGOING once time enters the window", () => {
    expect(
      displaySessionStatus({
        status: CareSessionStatus.UPCOMING,
        startTime: start,
        duration,
        now: new Date("2026-05-15T19:10:00.000Z"),
      }),
    ).toBe(CareSessionStatus.ONGOING);
  });
});

describe("autoAdvanceUpcomingStatus", () => {
  const start = new Date("2026-05-15T19:00:00.000Z");
  const duration = 60;

  it("returns null before the scheduled start", () => {
    expect(
      autoAdvanceUpcomingStatus({
        startTime: start,
        duration,
        now: new Date("2026-05-15T18:30:00.000Z"),
      }),
    ).toBeNull();
  });

  it("returns ONGOING inside the scheduled window", () => {
    expect(
      autoAdvanceUpcomingStatus({
        startTime: start,
        duration,
        now: new Date("2026-05-15T19:30:00.000Z"),
      }),
    ).toBe(CareSessionStatus.ONGOING);
  });

  it("returns MISSED after the scheduled window passes", () => {
    expect(
      autoAdvanceUpcomingStatus({
        startTime: start,
        duration,
        now: new Date("2026-05-15T20:30:00.000Z"),
      }),
    ).toBe(CareSessionStatus.MISSED);
  });
});
