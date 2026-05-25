import { describe, expect, it } from "vitest";
import {
  displayAccountLabel,
  formatCurrency,
  formatDateTime,
  formatDurationDayHourMinSec,
  formatSentAgo,
  formatShortDate,
  formatSessionScheduledDateTime,
  getInitials,
  isCareSessionJoinWindowOpen,
  sessionCounterpartyLabel,
  toSentenceCase,
} from "@/lib/display";

describe("display helpers", () => {
  it("formats INR currency values and defaults missing values to zero", () => {
    expect(formatCurrency(1234.5)).toBe("₹1,234.50");
    expect(formatCurrency(null)).toBe("₹0.00");
  });

  it("returns a stable fallback when date values are missing", () => {
    expect(formatShortDate(null)).toBe("Not available");
    expect(formatDateTime(undefined)).toBe("Not available");
  });

  it("derives initials from names and email fallbacks", () => {
    expect(getInitials("Apna Healer")).toBe("AH");
    expect(getInitials("solo")).toBe("SO");
    expect(getInitials(undefined, "healer@example.com")).toBe("HE");
  });

  it("picks a display label from name, then email local-part, then Member", () => {
    expect(displayAccountLabel("  Priya  ", "p@x.com")).toBe("Priya");
    expect(displayAccountLabel(null, "healer@example.com")).toBe("healer");
    expect(displayAccountLabel(undefined, undefined)).toBe("Member");
  });

  it("converts enum-like values to sentence case", () => {
    expect(toSentenceCase("THERAPIST")).toBe("Therapist");
    expect(toSentenceCase("SESSION_PAYMENT")).toBe("Session Payment");
  });

  it("labels the session counterparty for client vs provider viewers", () => {
    const session = {
      userId: "u1",
      user: { name: "Client One", email: "c@x.com" },
      provider: { name: "Dr. Pro" },
    };
    expect(sessionCounterpartyLabel(session, "u1")).toBe("Dr. Pro");
    expect(sessionCounterpartyLabel(session, "p1")).toBe("Client One");
    expect(sessionCounterpartyLabel(session, null)).toBe("Dr. Pro");
  });

  it("opens the join window 15 minutes before start through scheduled end", () => {
    const session = {
      startTime: "2026-05-14T14:00:00.000Z",
      duration: 30,
      status: "UPCOMING",
      meetingLink: "https://meet.example/x",
    };
    expect(isCareSessionJoinWindowOpen(session, new Date("2026-05-14T13:44:00.000Z"))).toBe(false);
    expect(isCareSessionJoinWindowOpen(session, new Date("2026-05-14T13:45:00.000Z"))).toBe(true);
    expect(isCareSessionJoinWindowOpen(session, new Date("2026-05-14T14:29:00.000Z"))).toBe(true);
    expect(isCareSessionJoinWindowOpen(session, new Date("2026-05-14T14:30:00.000Z"))).toBe(false);
  });

  it("keeps join open for ongoing sessions until end time", () => {
    const session = {
      startTime: "2026-05-14T14:00:00.000Z",
      duration: 30,
      status: "ONGOING",
      meetingLink: "https://meet.example/x",
    };
    expect(isCareSessionJoinWindowOpen(session, new Date("2026-05-14T13:00:00.000Z"))).toBe(true);
    expect(isCareSessionJoinWindowOpen(session, new Date("2026-05-14T14:29:59.000Z"))).toBe(true);
    expect(isCareSessionJoinWindowOpen(session, new Date("2026-05-14T14:30:00.000Z"))).toBe(false);
  });

  it("does not open join without a meeting link", () => {
    const session = {
      startTime: "2026-05-14T14:00:00.000Z",
      duration: 30,
      status: "UPCOMING",
      meetingLink: null,
    };
    expect(isCareSessionJoinWindowOpen(session, new Date("2026-05-14T13:50:00.000Z"))).toBe(false);
  });

  it("formats duration with days through seconds, skipping empty units", () => {
    expect(formatDurationDayHourMinSec((2 * 3600 + 35 * 60 + 24) * 1000)).toBe("2 hr 35 min 24 sec");
    expect(formatDurationDayHourMinSec(45_000)).toBe("45 sec");
    expect(formatDurationDayHourMinSec(61_000)).toBe("1 min 1 sec");
    expect(formatDurationDayHourMinSec(86400_000 + 3600_000)).toBe("1 day 1 hr");
  });

  it("formats scheduled session time with calendar and seconds", () => {
    const out = formatSessionScheduledDateTime("2026-05-14T14:30:45.000Z");
    expect(out).toMatch(/2026/);
    expect(out.toLowerCase()).toContain("may");
    expect(out).toMatch(/14/);
  });

  it("formats sent-ago labels", () => {
    const past = new Date(Date.now() - 45 * 60_000).toISOString();
    expect(formatSentAgo(past)).toMatch(/^Sent \d+m ago$/);
  });
});
