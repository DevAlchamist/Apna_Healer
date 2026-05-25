import { BookingStatus, CareSessionStatus, Prisma } from "@prisma/client";

export type AvailabilitySlotInput = {
  start: string;
  end: string;
  isBooked?: boolean;
};

export type ResolvedSlot = {
  start: string;
  end: string;
  isBooked: boolean;
};

export type BookingConflictSource = {
  requestedTime: string;
  duration: number;
};

export type SessionConflictSource = {
  startTime: Date;
  duration: number;
};

const TIME_PATTERN = /^([0-9]{1,2}):([0-9]{2})$/;

function parseTimeOfDayMinutes(value: string): number | null {
  const match = TIME_PATTERN.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/**
 * Returns the [start, end) range in minutes-from-midnight for a slot. Slots that
 * span past midnight clamp to end-of-day so the same-day comparison stays sane.
 */
export function slotRangeMinutes(slot: { start: string; end: string }): {
  startMinutes: number;
  endMinutes: number;
} | null {
  const startMinutes = parseTimeOfDayMinutes(slot.start);
  const endMinutes = parseTimeOfDayMinutes(slot.end);
  if (startMinutes === null || endMinutes === null) return null;
  if (endMinutes <= startMinutes) return null;
  return { startMinutes, endMinutes };
}

export function bookingRangeMinutes(input: BookingConflictSource): {
  startMinutes: number;
  endMinutes: number;
} | null {
  const startMinutes = parseTimeOfDayMinutes(input.requestedTime);
  if (startMinutes === null) return null;
  const duration = Math.max(0, Math.floor(input.duration));
  return {
    startMinutes,
    endMinutes: Math.min(startMinutes + duration, 24 * 60),
  };
}

export function sessionRangeMinutes(input: SessionConflictSource): {
  startMinutes: number;
  endMinutes: number;
} {
  const date = input.startTime;
  const startMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();
  const duration = Math.max(0, Math.floor(input.duration));
  return {
    startMinutes,
    endMinutes: Math.min(startMinutes + duration, 24 * 60),
  };
}

export function rangesOverlap(
  a: { startMinutes: number; endMinutes: number },
  b: { startMinutes: number; endMinutes: number },
): boolean {
  return a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;
}

/**
 * Returns the start of the calendar day (local server time) for a date value.
 * Slot conflict comparisons are anchored on `Availability.date` which Prisma
 * stores at midnight UTC for our use case.
 */
export function dayKey(date: Date): string {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
    .toISOString()
    .slice(0, 10);
}

export function parseStoredSlots(value: Prisma.JsonValue): AvailabilitySlotInput[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
    const start = "start" in entry && typeof entry.start === "string" ? entry.start : null;
    const end = "end" in entry && typeof entry.end === "string" ? entry.end : null;
    const isBooked =
      "isBooked" in entry && typeof entry.isBooked === "boolean" ? entry.isBooked : false;
    if (!start || !end) return [];
    return [{ start, end, isBooked }];
  });
}

export type ConflictBooking = {
  requestedDate: Date;
  requestedTime: string;
  duration: number;
  status: BookingStatus;
};

export type ConflictSession = {
  startTime: Date;
  duration: number;
  status: CareSessionStatus;
};

const ACTIVE_BOOKING_STATUSES = new Set<BookingStatus>([
  BookingStatus.PENDING,
  BookingStatus.ACCEPTED,
]);

const ACTIVE_SESSION_STATUSES = new Set<CareSessionStatus>([
  CareSessionStatus.UPCOMING,
  CareSessionStatus.ONGOING,
]);

/**
 * Reconciles published slots with active bookings/sessions to produce a fresh
 * `isBooked` for the supplied date. The provided arrays may include bookings
 * or sessions outside the date; those are filtered out by day key.
 */
export function reconcileSlotsForDate(input: {
  date: Date;
  slots: AvailabilitySlotInput[];
  bookings: ConflictBooking[];
  sessions: ConflictSession[];
}): ResolvedSlot[] {
  const targetKey = dayKey(input.date);

  const bookingRanges = input.bookings
    .filter((booking) => ACTIVE_BOOKING_STATUSES.has(booking.status))
    .filter((booking) => dayKey(booking.requestedDate) === targetKey)
    .map((booking) =>
      bookingRangeMinutes({
        requestedTime: booking.requestedTime,
        duration: booking.duration,
      }),
    )
    .filter((range): range is { startMinutes: number; endMinutes: number } => range !== null);

  const sessionRanges = input.sessions
    .filter((session) => ACTIVE_SESSION_STATUSES.has(session.status))
    .filter((session) => dayKey(session.startTime) === targetKey)
    .map((session) =>
      sessionRangeMinutes({ startTime: session.startTime, duration: session.duration }),
    );

  return input.slots.map((slot) => {
    const range = slotRangeMinutes(slot);
    if (!range) {
      return { start: slot.start, end: slot.end, isBooked: true };
    }
    const conflicted =
      slot.isBooked === true ||
      bookingRanges.some((bookingRange) => rangesOverlap(bookingRange, range)) ||
      sessionRanges.some((sessionRange) => rangesOverlap(sessionRange, range));

    return { start: slot.start, end: slot.end, isBooked: conflicted };
  });
}

/**
 * For a given slot range + date, return true if it conflicts with the provided
 * bookings/sessions. Used by `createBooking` to guard against double-booking.
 */
export function bookingConflictsExist(input: {
  requestedDate: Date;
  requestedTime: string;
  duration: number;
  bookings: ConflictBooking[];
  sessions: ConflictSession[];
}): boolean {
  const targetKey = dayKey(input.requestedDate);
  const requestedRange = bookingRangeMinutes({
    requestedTime: input.requestedTime,
    duration: input.duration,
  });
  if (!requestedRange) return false;

  const bookingClash = input.bookings.some((booking) => {
    if (!ACTIVE_BOOKING_STATUSES.has(booking.status)) return false;
    if (dayKey(booking.requestedDate) !== targetKey) return false;
    const range = bookingRangeMinutes({
      requestedTime: booking.requestedTime,
      duration: booking.duration,
    });
    return range ? rangesOverlap(range, requestedRange) : false;
  });

  if (bookingClash) return true;

  return input.sessions.some((session) => {
    if (!ACTIVE_SESSION_STATUSES.has(session.status)) return false;
    if (dayKey(session.startTime) !== targetKey) return false;
    const range = sessionRangeMinutes({
      startTime: session.startTime,
      duration: session.duration,
    });
    return rangesOverlap(range, requestedRange);
  });
}

/**
 * Returns the published slot that exactly matches `requestedTime`, or null if
 * the requested start does not correspond to any published opening.
 */
export function findPublishedSlot(
  slots: AvailabilitySlotInput[],
  requestedTime: string,
): AvailabilitySlotInput | null {
  return slots.find((slot) => slot.start === requestedTime) ?? null;
}

/**
 * Returns the published slot whose [start, end) range fully contains
 * [requestedTime, requestedTime + duration). Used when the requester is
 * allowed to pick an arbitrary start time within the provider's window.
 */
export function findContainingSlot(
  slots: AvailabilitySlotInput[],
  requestedTime: string,
  duration: number,
): AvailabilitySlotInput | null {
  const reqRange = bookingRangeMinutes({ requestedTime, duration });
  if (!reqRange) return null;

  return (
    slots.find((slot) => {
      const slotRange = slotRangeMinutes(slot);
      if (!slotRange) return false;
      return (
        slotRange.startMinutes <= reqRange.startMinutes &&
        reqRange.endMinutes <= slotRange.endMinutes
      );
    }) ?? null
  );
}

/**
 * Reduces active bookings + sessions for a date to plain time-of-day ranges
 * so the frontend can highlight booked sub-intervals inside a published
 * window. Used together with `findContainingSlot` for arbitrary timing.
 */
export function activeRangesForDate(input: {
  date: Date;
  bookings: ConflictBooking[];
  sessions: ConflictSession[];
}): Array<{ start: string; end: string }> {
  const targetKey = dayKey(input.date);
  const fromMinutes = (minutes: number): string => {
    const h = Math.floor(minutes / 60)
      .toString()
      .padStart(2, "0");
    const m = (minutes % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  const ranges: Array<{ startMinutes: number; endMinutes: number }> = [];

  for (const booking of input.bookings) {
    if (!ACTIVE_BOOKING_STATUSES.has(booking.status)) continue;
    if (dayKey(booking.requestedDate) !== targetKey) continue;
    const range = bookingRangeMinutes({
      requestedTime: booking.requestedTime,
      duration: booking.duration,
    });
    if (range) ranges.push(range);
  }

  for (const session of input.sessions) {
    if (!ACTIVE_SESSION_STATUSES.has(session.status)) continue;
    if (dayKey(session.startTime) !== targetKey) continue;
    ranges.push(
      sessionRangeMinutes({ startTime: session.startTime, duration: session.duration }),
    );
  }

  ranges.sort((a, b) => a.startMinutes - b.startMinutes);

  return ranges.map((range) => ({
    start: fromMinutes(range.startMinutes),
    end: fromMinutes(range.endMinutes),
  }));
}
