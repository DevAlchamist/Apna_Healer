import {
  BookingStatus,
  CareSessionStatus,
  ListenerConfirmation,
  ListenerRequestStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  bookingRangeMinutes,
  dayKey,
  rangesOverlap,
  sessionRangeMinutes,
} from "@/server/services/slot-availability";

export type ProviderType = "THERAPIST" | "LISTENER";

export type UnavailableReason = "outside_hours" | "break" | "booked" | "blocked";

export type SlotTimeRange = { start: string; end: string };

export type GeneratedSlot = SlotTimeRange & { isBooked: boolean };

export const DEFAULT_SLOT_DURATION_MIN = 60;
export const DEFAULT_BREAK_DURATION_MIN = 0;
export const LISTENER_SLOT_DURATION_MIN = 30;
export const DEFAULT_TIMEZONE = "Asia/Kolkata";

const TIME_PATTERN = /^([0-9]{1,2}):([0-9]{2})$/;

export const ACTIVE_BOOKING_STATUSES = new Set<BookingStatus>([
  BookingStatus.PENDING,
  BookingStatus.ACCEPTED,
]);

export const ACTIVE_SESSION_STATUSES = new Set<CareSessionStatus>([
  CareSessionStatus.UPCOMING,
  CareSessionStatus.ONGOING,
]);

export const ACTIVE_REQUEST_STATUSES = new Set<ListenerRequestStatus>([
  ListenerRequestStatus.PENDING,
  ListenerRequestStatus.ASSIGNED,
  ListenerRequestStatus.APPROVED,
]);

export function parseTimeToMinutes(value: string): number | null {
  const match = TIME_PATTERN.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function formatMinutesToTime(minutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60, minutes));
  const h = Math.floor(clamped / 60)
    .toString()
    .padStart(2, "0");
  const m = (clamped % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function dayOfWeekForDate(date: Date): number {
  return new Date(date).getDay();
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Generates slot windows inside a weekly window. Supports therapist breaks via
 * `breakDuration`; listeners pass breakDuration equal to slot step (30 min).
 */
export function generateSlotsForWindow(window: {
  startTime: string;
  endTime: string;
  slotDuration?: number;
  breakDuration?: number;
}): SlotTimeRange[] {
  const startMin = parseTimeToMinutes(window.startTime);
  const endMin = parseTimeToMinutes(window.endTime);
  if (startMin === null || endMin === null) return [];
  if (endMin <= startMin) return [];

  const slotDuration = window.slotDuration ?? DEFAULT_SLOT_DURATION_MIN;
  const breakDuration = window.breakDuration ?? DEFAULT_BREAK_DURATION_MIN;
  if (slotDuration <= 0) return [];

  const slots: SlotTimeRange[] = [];
  for (
    let cursor = startMin;
    cursor + slotDuration <= endMin;
    cursor += slotDuration + breakDuration
  ) {
    slots.push({
      start: formatMinutesToTime(cursor),
      end: formatMinutesToTime(cursor + slotDuration),
    });
  }
  return slots;
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

export type BusyListenerRequest = {
  preferredDate: Date;
  preferredTime: string;
  duration: number;
  status: ListenerRequestStatus;
  listenerConfirmation: ListenerConfirmation;
};

export function markBookedSlots(input: {
  date: Date;
  slots: SlotTimeRange[];
  bookings: ConflictBooking[];
  sessions: ConflictSession[];
}): GeneratedSlot[] {
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
    const startMin = parseTimeToMinutes(slot.start);
    const endMin = parseTimeToMinutes(slot.end);
    if (startMin === null || endMin === null) {
      return { ...slot, isBooked: true };
    }
    const range = { startMinutes: startMin, endMinutes: endMin };
    const conflict =
      bookingRanges.some((bookingRange) => rangesOverlap(bookingRange, range)) ||
      sessionRanges.some((sessionRange) => rangesOverlap(sessionRange, range));
    return { ...slot, isBooked: conflict };
  });
}

export function subtractBusySlots(
  slotStarts: string[],
  durationMin: number,
  busyRanges: Array<{ startMinutes: number; endMinutes: number }>,
): string[] {
  if (busyRanges.length === 0) return slotStarts;
  return slotStarts.filter((slotStart) => {
    const startMin = parseTimeToMinutes(slotStart);
    if (startMin === null) return false;
    const slotRange = {
      startMinutes: startMin,
      endMinutes: startMin + durationMin,
    };
    return !busyRanges.some((busy) => rangesOverlap(busy, slotRange));
  });
}

export function listenerBusyRangesForDate(input: {
  date: Date;
  requests: BusyListenerRequest[];
  sessions: ConflictSession[];
}): Array<{ startMinutes: number; endMinutes: number }> {
  const targetKey = dayKey(input.date);
  const ranges: Array<{ startMinutes: number; endMinutes: number }> = [];

  for (const request of input.requests) {
    if (!ACTIVE_REQUEST_STATUSES.has(request.status)) continue;
    if (request.listenerConfirmation === ListenerConfirmation.DECLINED) continue;
    if (dayKey(request.preferredDate) !== targetKey) continue;
    const range = bookingRangeMinutes({
      requestedTime: request.preferredTime,
      duration: request.duration,
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

  return ranges;
}

export function markListenerSlotsBooked(
  date: Date,
  slots: SlotTimeRange[],
  busy: Array<{ startMinutes: number; endMinutes: number }>,
  durationMin: number,
): GeneratedSlot[] {
  return slots.map((slot) => {
    const startMin = parseTimeToMinutes(slot.start);
    if (startMin === null) return { ...slot, isBooked: true };
    const range = { startMinutes: startMin, endMinutes: startMin + durationMin };
    const isBooked = busy.some((busyRange) => rangesOverlap(busyRange, range));
    return { ...slot, isBooked };
  });
}

function dayBounds(date: Date) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const nextDay = new Date(dayStart);
  nextDay.setDate(nextDay.getDate() + 1);
  return { dayStart, nextDay };
}

export type GenerateAvailableSlotsInput = {
  providerId: string;
  providerType: ProviderType;
  date: Date;
  slotDuration?: number;
  breakDuration?: number;
  availabilityExceptions?: Array<{ start: string; end: string }>;
};

export type GenerateAvailableSlotsResult = {
  date: string;
  timezone: string;
  slots: GeneratedSlot[];
  available: SlotTimeRange[];
  booked: SlotTimeRange[];
  unavailableRanges: Array<SlotTimeRange & { reason: UnavailableReason }>;
  slotDuration: number;
};

export async function generateAvailableSlots(
  input: GenerateAvailableSlotsInput,
): Promise<GenerateAvailableSlotsResult> {
  const dow = dayOfWeekForDate(input.date);
  const { dayStart, nextDay } = dayBounds(input.date);
  const dateIso = toDateKey(input.date);

  if (input.providerType === "THERAPIST") {
    const windows = await prisma.therapistAvailability.findMany({
      where: {
        therapistId: input.providerId,
        dayOfWeek: dow,
        isActive: true,
      },
      orderBy: { startTime: "asc" },
    });

    const timezone = windows[0]?.timezone ?? DEFAULT_TIMEZONE;
    if (windows.length === 0) {
      return emptyResult(dateIso, timezone, input.slotDuration ?? DEFAULT_SLOT_DURATION_MIN);
    }

    const [bookings, sessions] = await Promise.all([
      prisma.booking.findMany({
        where: {
          providerId: input.providerId,
          requestedDate: { gte: dayStart, lt: nextDay },
          status: { in: Array.from(ACTIVE_BOOKING_STATUSES) },
        },
        select: {
          requestedDate: true,
          requestedTime: true,
          duration: true,
          status: true,
        },
      }),
      prisma.careSession.findMany({
        where: {
          providerId: input.providerId,
          startTime: { gte: dayStart, lt: nextDay },
          status: { in: Array.from(ACTIVE_SESSION_STATUSES) },
        },
        select: {
          startTime: true,
          duration: true,
          status: true,
        },
      }),
    ]);

    const generated = windows.flatMap((window) =>
      generateSlotsForWindow({
        startTime: window.startTime,
        endTime: window.endTime,
        slotDuration: input.slotDuration ?? window.slotDuration,
        breakDuration: input.breakDuration ?? window.breakDuration,
      }),
    );

    const slots = markBookedSlots({
      date: input.date,
      slots: generated,
      bookings,
      sessions,
    });

    const primaryDuration =
      input.slotDuration ?? windows[0]?.slotDuration ?? DEFAULT_SLOT_DURATION_MIN;

    return buildResult(dateIso, timezone, slots, primaryDuration);
  }

  const windows = await prisma.listenerAvailability.findMany({
    where: {
      listenerId: input.providerId,
      dayOfWeek: dow,
      isActive: true,
    },
    orderBy: { startTime: "asc" },
  });

  const timezone = windows[0]?.timezone ?? DEFAULT_TIMEZONE;
  const durationMin = input.slotDuration ?? LISTENER_SLOT_DURATION_MIN;

  if (windows.length === 0) {
    return emptyResult(dateIso, timezone, durationMin);
  }

  const [requests, sessions] = await Promise.all([
    prisma.listenerBookingRequest.findMany({
      where: {
        assignedListenerId: input.providerId,
        preferredDate: { gte: dayStart, lt: nextDay },
        status: { in: Array.from(ACTIVE_REQUEST_STATUSES) },
      },
      select: {
        preferredDate: true,
        preferredTime: true,
        duration: true,
        status: true,
        listenerConfirmation: true,
      },
    }),
    prisma.careSession.findMany({
      where: {
        providerId: input.providerId,
        startTime: { gte: dayStart, lt: nextDay },
        status: { in: Array.from(ACTIVE_SESSION_STATUSES) },
      },
      select: {
        startTime: true,
        duration: true,
        status: true,
      },
    }),
  ]);

  const busy = listenerBusyRangesForDate({ date: input.date, requests, sessions });

  const generated: SlotTimeRange[] = [];
  for (const window of windows) {
    generated.push(
      ...generateSlotsForWindow({
        startTime: window.startTime,
        endTime: window.endTime,
        slotDuration: durationMin,
        breakDuration: 0,
      }),
    );
  }

  const slots = markListenerSlotsBooked(input.date, generated, busy, durationMin);

  return buildResult(dateIso, timezone, slots, durationMin);
}

function emptyResult(
  date: string,
  timezone: string,
  slotDuration: number,
): GenerateAvailableSlotsResult {
  return {
    date,
    timezone,
    slots: [],
    available: [],
    booked: [],
    unavailableRanges: [],
    slotDuration,
  };
}

function buildResult(
  date: string,
  timezone: string,
  slots: GeneratedSlot[],
  slotDuration: number,
): GenerateAvailableSlotsResult {
  const available = slots.filter((s) => !s.isBooked).map(({ start, end }) => ({ start, end }));
  const booked = slots.filter((s) => s.isBooked).map(({ start, end }) => ({ start, end }));
  const unavailableRanges = booked.map((slot) => ({ ...slot, reason: "booked" as const }));

  return {
    date,
    timezone,
    slots,
    available,
    booked,
    unavailableRanges,
    slotDuration,
  };
}

/** Validates that a requested time fits an open generated slot. */
export function findOpenSlot(
  slots: GeneratedSlot[],
  requestedTime: string,
  duration: number,
): GeneratedSlot | null {
  const reqStart = parseTimeToMinutes(requestedTime);
  if (reqStart === null) return null;

  return (
    slots.find((slot) => {
      if (slot.isBooked) return false;
      const slotStart = parseTimeToMinutes(slot.start);
      const slotEnd = parseTimeToMinutes(slot.end);
      if (slotStart === null || slotEnd === null) return false;
      if (slot.start !== requestedTime.trim()) return false;
      const reqEnd = reqStart + duration;
      return reqEnd <= slotEnd;
    }) ?? null
  );
}
