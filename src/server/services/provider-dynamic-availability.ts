import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ACTIVE_BOOKING_STATUSES,
  ACTIVE_SESSION_STATUSES,
  ACTIVE_REQUEST_STATUSES,
  DEFAULT_TIMEZONE,
  DEFAULT_SLOT_DURATION_MIN,
  DEFAULT_BREAK_DURATION_MIN,
  LISTENER_SLOT_DURATION_MIN,
  dayOfWeekForDate,
  generateSlotsForWindow,
  markBookedSlots,
  listenerBusyRangesForDate,
  markListenerSlotsBooked,
} from "@/server/services/slot-engine";
import type { ResolvedSlot } from "@/server/services/slot-availability";

export type DynamicAvailabilityDay = {
  id: string;
  providerId: string;
  date: Date;
  timezone: string;
  slots: ResolvedSlot[];
  createdAt: Date;
  updatedAt: Date;
};

const DEFAULT_HORIZON_DAYS = 60;

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

function dateAtLocalNoon(base: Date) {
  const noon = new Date(base);
  noon.setHours(12, 0, 0, 0);
  return noon;
}

function syntheticAvailabilityId(providerId: string, date: Date) {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${providerId}-${y}${m}${d}`;
}

/**
 * Builds per-day availability from weekly schedule via optimized batch queries.
 */
export async function buildWeeklyProviderAvailability(input: {
  providerId: string;
  role: Role;
  fromDate: Date;
  dayCount?: number;
}): Promise<DynamicAvailabilityDay[]> {
  if (input.role !== Role.THERAPIST && input.role !== Role.LISTENER) {
    return [];
  }

  const horizon = input.dayCount ?? DEFAULT_HORIZON_DAYS;
  const toDate = addDays(input.fromDate, horizon);
  const now = new Date();
  const days: DynamicAvailabilityDay[] = [];

  if (input.role === Role.THERAPIST) {
    const windows = await prisma.therapistAvailability.findMany({
      where: { therapistId: input.providerId, isActive: true },
      orderBy: { startTime: "asc" },
    });
    if (windows.length === 0) return [];

    const timezone = windows[0]?.timezone ?? DEFAULT_TIMEZONE;
    const [bookings, sessions] = await Promise.all([
      prisma.booking.findMany({
        where: {
          providerId: input.providerId,
          requestedDate: { gte: input.fromDate, lt: toDate },
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
          startTime: { gte: input.fromDate, lt: toDate },
          status: { in: Array.from(ACTIVE_SESSION_STATUSES) },
        },
        select: {
          startTime: true,
          duration: true,
          status: true,
        },
      }),
    ]);

    for (let offset = 0; offset < horizon; offset++) {
      const day = addDays(input.fromDate, offset);
      const dow = dayOfWeekForDate(day);
      const dayWindows = windows.filter((w) => w.dayOfWeek === dow);
      if (dayWindows.length === 0) continue;

      const generated = dayWindows.flatMap((w) =>
        generateSlotsForWindow({
          startTime: w.startTime,
          endTime: w.endTime,
          slotDuration: w.slotDuration ?? DEFAULT_SLOT_DURATION_MIN,
          breakDuration: w.breakDuration ?? DEFAULT_BREAK_DURATION_MIN,
        }),
      );
      if (generated.length === 0) continue;

      const slots = markBookedSlots({
        date: day,
        slots: generated,
        bookings,
        sessions,
      });

      const noon = dateAtLocalNoon(day);
      days.push({
        id: syntheticAvailabilityId(input.providerId, day),
        providerId: input.providerId,
        date: noon,
        timezone,
        slots: slots.map((slot) => ({
          start: slot.start,
          end: slot.end,
          isBooked: slot.isBooked,
        })),
        createdAt: now,
        updatedAt: now,
      });
    }

    return days;
  }

  // Listener
  const windows = await prisma.listenerAvailability.findMany({
    where: { listenerId: input.providerId, isActive: true },
    orderBy: { startTime: "asc" },
  });
  if (windows.length === 0) return [];

  const timezone = windows[0]?.timezone ?? DEFAULT_TIMEZONE;
  const [requests, sessions] = await Promise.all([
    prisma.listenerBookingRequest.findMany({
      where: {
        assignedListenerId: input.providerId,
        preferredDate: { gte: input.fromDate, lt: toDate },
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
        startTime: { gte: input.fromDate, lt: toDate },
        status: { in: Array.from(ACTIVE_SESSION_STATUSES) },
      },
      select: {
        startTime: true,
        duration: true,
        status: true,
      },
    }),
  ]);

  for (let offset = 0; offset < horizon; offset++) {
    const day = addDays(input.fromDate, offset);
    const dow = dayOfWeekForDate(day);
    const dayWindows = windows.filter((w) => w.dayOfWeek === dow);
    if (dayWindows.length === 0) continue;

    const generated = dayWindows.flatMap((w) =>
      generateSlotsForWindow({
        startTime: w.startTime,
        endTime: w.endTime,
        slotDuration: LISTENER_SLOT_DURATION_MIN,
        breakDuration: 0,
      }),
    );
    if (generated.length === 0) continue;

    const busy = listenerBusyRangesForDate({ date: day, requests, sessions });
    const slots = markListenerSlotsBooked(day, generated, busy, LISTENER_SLOT_DURATION_MIN);

    const noon = dateAtLocalNoon(day);
    days.push({
      id: syntheticAvailabilityId(input.providerId, day),
      providerId: input.providerId,
      date: noon,
      timezone,
      slots: slots.map((slot) => ({
        start: slot.start,
        end: slot.end,
        isBooked: slot.isBooked,
      })),
      createdAt: now,
      updatedAt: now,
    });
  }

  return days;
}

export async function findNextOpenAvailabilityDate(input: {
  providerId: string;
  role: Role;
  fromDate: Date;
  dayCount?: number;
}): Promise<Date | null> {
  const days = await buildWeeklyProviderAvailability(input);
  for (const day of days) {
    if (day.slots.some((slot) => !slot.isBooked)) {
      return day.date;
    }
  }
  return null;
}

/**
 * Batches next-availability-date lookup across multiple providers in 3-4 parallel queries.
 */
export async function batchFindNextOpenAvailabilityDates(input: {
  providers: Array<{ id: string; role: Role }>;
  fromDate: Date;
  dayCount?: number;
}): Promise<Map<string, Date | null>> {
  const result = new Map<string, Date | null>();
  if (input.providers.length === 0) return result;

  const horizon = input.dayCount ?? 30;
  const toDate = addDays(input.fromDate, horizon);

  const therapistIds = input.providers
    .filter((p) => p.role === Role.THERAPIST)
    .map((p) => p.id);
  const listenerIds = input.providers
    .filter((p) => p.role === Role.LISTENER)
    .map((p) => p.id);

  const [
    therapistWindows,
    therapistBookings,
    therapistSessions,
    listenerWindows,
    listenerRequests,
    listenerSessions,
  ] = await Promise.all([
    therapistIds.length > 0
      ? prisma.therapistAvailability.findMany({
          where: { therapistId: { in: therapistIds }, isActive: true },
          orderBy: { startTime: "asc" },
        })
      : [],
    therapistIds.length > 0
      ? prisma.booking.findMany({
          where: {
            providerId: { in: therapistIds },
            requestedDate: { gte: input.fromDate, lt: toDate },
            status: { in: Array.from(ACTIVE_BOOKING_STATUSES) },
          },
          select: {
            providerId: true,
            requestedDate: true,
            requestedTime: true,
            duration: true,
            status: true,
          },
        })
      : [],
    therapistIds.length > 0
      ? prisma.careSession.findMany({
          where: {
            providerId: { in: therapistIds },
            startTime: { gte: input.fromDate, lt: toDate },
            status: { in: Array.from(ACTIVE_SESSION_STATUSES) },
          },
          select: {
            providerId: true,
            startTime: true,
            duration: true,
            status: true,
          },
        })
      : [],
    listenerIds.length > 0
      ? prisma.listenerAvailability.findMany({
          where: { listenerId: { in: listenerIds }, isActive: true },
          orderBy: { startTime: "asc" },
        })
      : [],
    listenerIds.length > 0
      ? prisma.listenerBookingRequest.findMany({
          where: {
            assignedListenerId: { in: listenerIds },
            preferredDate: { gte: input.fromDate, lt: toDate },
            status: { in: Array.from(ACTIVE_REQUEST_STATUSES) },
          },
          select: {
            assignedListenerId: true,
            preferredDate: true,
            preferredTime: true,
            duration: true,
            status: true,
            listenerConfirmation: true,
          },
        })
      : [],
    listenerIds.length > 0
      ? prisma.careSession.findMany({
          where: {
            providerId: { in: listenerIds },
            startTime: { gte: input.fromDate, lt: toDate },
            status: { in: Array.from(ACTIVE_SESSION_STATUSES) },
          },
          select: {
            providerId: true,
            startTime: true,
            duration: true,
            status: true,
          },
        })
      : [],
  ]);

  // Index therapist data by providerId
  const therapistWindowsByProvider = new Map<string, typeof therapistWindows>();
  for (const w of therapistWindows) {
    const list = therapistWindowsByProvider.get(w.therapistId) ?? [];
    list.push(w);
    therapistWindowsByProvider.set(w.therapistId, list);
  }

  const therapistBookingsByProvider = new Map<string, typeof therapistBookings>();
  for (const b of therapistBookings) {
    const list = therapistBookingsByProvider.get(b.providerId) ?? [];
    list.push(b);
    therapistBookingsByProvider.set(b.providerId, list);
  }

  const therapistSessionsByProvider = new Map<string, typeof therapistSessions>();
  for (const s of therapistSessions) {
    const list = therapistSessionsByProvider.get(s.providerId) ?? [];
    list.push(s);
    therapistSessionsByProvider.set(s.providerId, list);
  }

  // Index listener data by providerId
  const listenerWindowsByProvider = new Map<string, typeof listenerWindows>();
  for (const w of listenerWindows) {
    const list = listenerWindowsByProvider.get(w.listenerId) ?? [];
    list.push(w);
    listenerWindowsByProvider.set(w.listenerId, list);
  }

  const listenerRequestsByProvider = new Map<string, typeof listenerRequests>();
  for (const r of listenerRequests) {
    if (!r.assignedListenerId) continue;
    const list = listenerRequestsByProvider.get(r.assignedListenerId) ?? [];
    list.push(r);
    listenerRequestsByProvider.set(r.assignedListenerId, list);
  }

  const listenerSessionsByProvider = new Map<string, typeof listenerSessions>();
  for (const s of listenerSessions) {
    const list = listenerSessionsByProvider.get(s.providerId) ?? [];
    list.push(s);
    listenerSessionsByProvider.set(s.providerId, list);
  }

  // Evaluate in-memory
  for (const provider of input.providers) {
    if (provider.role === Role.THERAPIST) {
      const pWindows = therapistWindowsByProvider.get(provider.id);
      if (!pWindows || pWindows.length === 0) {
        result.set(provider.id, null);
        continue;
      }

      const pBookings = therapistBookingsByProvider.get(provider.id) ?? [];
      const pSessions = therapistSessionsByProvider.get(provider.id) ?? [];
      let foundDate: Date | null = null;

      for (let offset = 0; offset < horizon; offset++) {
        const day = addDays(input.fromDate, offset);
        const dow = dayOfWeekForDate(day);
        const dayWindows = pWindows.filter((w) => w.dayOfWeek === dow);
        if (dayWindows.length === 0) continue;

        const generated = dayWindows.flatMap((w) =>
          generateSlotsForWindow({
            startTime: w.startTime,
            endTime: w.endTime,
            slotDuration: w.slotDuration ?? DEFAULT_SLOT_DURATION_MIN,
            breakDuration: w.breakDuration ?? DEFAULT_BREAK_DURATION_MIN,
          }),
        );
        if (generated.length === 0) continue;

        const slots = markBookedSlots({
          date: day,
          slots: generated,
          bookings: pBookings,
          sessions: pSessions,
        });

        if (slots.some((s) => !s.isBooked)) {
          foundDate = dateAtLocalNoon(day);
          break;
        }
      }

      result.set(provider.id, foundDate);
      continue;
    }

    if (provider.role === Role.LISTENER) {
      const pWindows = listenerWindowsByProvider.get(provider.id);
      if (!pWindows || pWindows.length === 0) {
        result.set(provider.id, null);
        continue;
      }

      const pRequests = listenerRequestsByProvider.get(provider.id) ?? [];
      const pSessions = listenerSessionsByProvider.get(provider.id) ?? [];
      let foundDate: Date | null = null;

      for (let offset = 0; offset < horizon; offset++) {
        const day = addDays(input.fromDate, offset);
        const dow = dayOfWeekForDate(day);
        const dayWindows = pWindows.filter((w) => w.dayOfWeek === dow);
        if (dayWindows.length === 0) continue;

        const generated = dayWindows.flatMap((w) =>
          generateSlotsForWindow({
            startTime: w.startTime,
            endTime: w.endTime,
            slotDuration: LISTENER_SLOT_DURATION_MIN,
            breakDuration: 0,
          }),
        );
        if (generated.length === 0) continue;

        const busy = listenerBusyRangesForDate({ date: day, requests: pRequests, sessions: pSessions });
        const slots = markListenerSlotsBooked(day, generated, busy, LISTENER_SLOT_DURATION_MIN);

        if (slots.some((s) => !s.isBooked)) {
          foundDate = dateAtLocalNoon(day);
          break;
        }
      }

      result.set(provider.id, foundDate);
      continue;
    }

    result.set(provider.id, null);
  }

  return result;
}

