import { CareSessionStatus } from "@prisma/client";

/** Minimum notice required before a participant may cancel a therapist booking. */
export const SESSION_PARTICIPANT_CANCEL_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Pure helper: derives the *time-based* lifecycle phase of a session.
 * The DB still owns the authoritative `status` (incl. CANCELLED / MISSED),
 * but UIs use this to render UPCOMING / ONGOING / COMPLETED consistently
 * even when a backend cron hasn't flipped the row yet.
 */
export type DerivedSessionPhase = "UPCOMING" | "ONGOING" | "COMPLETED";

export function derivedSessionPhase(input: {
  startTime: Date | string;
  endTime?: Date | string | null;
  duration: number;
  now?: Date;
}): DerivedSessionPhase {
  const now = input.now ?? new Date();
  const start = new Date(input.startTime);
  const end = input.endTime
    ? new Date(input.endTime)
    : new Date(start.getTime() + Math.max(0, input.duration) * 60_000);

  if (now < start) return "UPCOMING";
  if (now <= end) return "ONGOING";
  return "COMPLETED";
}

/**
 * Returns the canonical display status. If the DB status is a terminal one
 * (CANCELLED / MISSED), we respect it; otherwise the time-derived phase wins.
 */
export function displaySessionStatus(input: {
  status: CareSessionStatus;
  startTime: Date | string;
  endTime?: Date | string | null;
  duration: number;
  now?: Date;
}): CareSessionStatus {
  if (
    input.status === CareSessionStatus.CANCELLED ||
    input.status === CareSessionStatus.MISSED
  ) {
    return input.status;
  }
  const phase = derivedSessionPhase(input);
  return CareSessionStatus[phase];
}

export function resolveScheduledSessionEnd(input: {
  startTime: Date | string;
  endTime?: Date | string | null;
  duration: number;
}): Date {
  if (input.endTime) {
    return new Date(input.endTime);
  }
  const start = new Date(input.startTime);
  return new Date(start.getTime() + Math.max(0, input.duration) * 60_000);
}

/**
 * When a session is still marked UPCOMING but its start time has passed, derive
 * the status the row should have in the database.
 */
export function autoAdvanceUpcomingStatus(input: {
  startTime: Date | string;
  endTime?: Date | string | null;
  duration: number;
  now?: Date;
}): "ONGOING" | "MISSED" | null {
  const now = input.now ?? new Date();
  const start = new Date(input.startTime);
  if (now < start) return null;

  const end = resolveScheduledSessionEnd(input);
  return now < end ? CareSessionStatus.ONGOING : CareSessionStatus.MISSED;
}

export function formatLocalTimeValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
