import { CareSessionStatus, ListenerRequestStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { ApiError } from "@/lib/api-errors";

import { rangesOverlap } from "@/server/services/slot-availability";

import {

  dayOfWeekForDate,

  generateAvailableSlots,

  generateSlotsForWindow,

  listenerBusyRangesForDate,

  LISTENER_SLOT_DURATION_MIN,

  parseTimeToMinutes,

  subtractBusySlots,

  type BusyListenerRequest,

  type ConflictSession,

} from "@/server/services/slot-engine";



export {

  LISTENER_SLOT_DURATION_MIN,

  generateSlotsForWindow,

  listenerBusyRangesForDate,

  subtractBusySlots,

};

export type { BusyListenerRequest as BusyRequest };

export type { ConflictSession as BusySession };



export type ListenerWeeklyWindow = {

  id?: string;

  dayOfWeek: number;

  startTime: string;

  endTime: string;

  timezone?: string;

  isActive?: boolean;

};



export type GeneratedListenerSlot = {

  start: string;

  end: string;

  isBooked: boolean;

};



export { dayOfWeekForDate };



const ACTIVE_REQUEST_STATUSES: ListenerRequestStatus[] = [

  ListenerRequestStatus.PENDING,

  ListenerRequestStatus.ASSIGNED,

  ListenerRequestStatus.APPROVED,

];



const ACTIVE_SESSION_STATUSES: CareSessionStatus[] = [

  CareSessionStatus.UPCOMING,

  CareSessionStatus.ONGOING,

];



function generateListenerSlotStarts(

  window: { startTime: string; endTime: string },

  durationMin: number = LISTENER_SLOT_DURATION_MIN,

): string[] {

  return generateSlotsForWindow({

    startTime: window.startTime,

    endTime: window.endTime,

    slotDuration: durationMin,

    breakDuration: 0,

  }).map((slot) => slot.start);

}



export function aggregateListenerSlots(input: {

  date: Date;

  durationMin: number;

  perListener: Array<{

    listenerId: string;

    windows: Array<{ startTime: string; endTime: string }>;

    busy: Array<{ startMinutes: number; endMinutes: number }>;

  }>;

}): string[] {

  const all = new Set<string>();



  for (const listener of input.perListener) {

    const free = new Set<string>();

    for (const window of listener.windows) {

      for (const start of generateListenerSlotStarts(window, input.durationMin)) {

        free.add(start);

      }

    }

    if (free.size === 0) continue;

    const trimmed = subtractBusySlots(

      Array.from(free),

      input.durationMin,

      listener.busy,

    );

    for (const slot of trimmed) {

      all.add(slot);

    }

  }



  return Array.from(all).sort();

}



function assertValidWindow(window: ListenerWeeklyWindow) {

  if (!Number.isInteger(window.dayOfWeek) || window.dayOfWeek < 0 || window.dayOfWeek > 6) {

    throw new ApiError(400, "dayOfWeek must be an integer 0..6", "INVALID_DAY_OF_WEEK");

  }

  const startMin = parseTimeToMinutes(window.startTime);

  const endMin = parseTimeToMinutes(window.endTime);

  if (startMin === null || endMin === null) {

    throw new ApiError(400, "startTime/endTime must be 'HH:mm'.", "INVALID_TIME");

  }

  if (endMin <= startMin) {

    throw new ApiError(400, "endTime must be after startTime.", "INVALID_WINDOW");

  }

}



export async function getListenerWeeklySchedule(listenerId: string) {

  return prisma.listenerAvailability.findMany({

    where: { listenerId },

    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],

  });

}



export async function replaceListenerWeeklySchedule(

  listenerId: string,

  windows: ListenerWeeklyWindow[],

) {

  for (const window of windows) {

    assertValidWindow(window);

  }



  return prisma.$transaction(async (tx) => {

    await tx.listenerAvailability.deleteMany({ where: { listenerId } });

    if (windows.length === 0) return [];

    await tx.listenerAvailability.createMany({

      data: windows.map((window) => ({

        listenerId,

        dayOfWeek: window.dayOfWeek,

        startTime: window.startTime,

        endTime: window.endTime,

        timezone: window.timezone ?? "Asia/Kolkata",

        isActive: window.isActive ?? true,

      })),

    });

    return tx.listenerAvailability.findMany({

      where: { listenerId },

      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],

    });

  });

}



export async function getListenerDynamicSlots(input: {

  listenerId: string;

  date: Date;

}): Promise<GeneratedListenerSlot[]> {

  const result = await generateAvailableSlots({

    providerId: input.listenerId,

    providerType: "LISTENER",

    date: input.date,

  });

  return result.slots;

}



export async function getAggregatedListenerSlots(date: Date) {

  const dow = dayOfWeekForDate(date);



  const availabilities = await prisma.listenerAvailability.findMany({

    where: { dayOfWeek: dow, isActive: true, listener: { role: "LISTENER" } },

    select: {

      listenerId: true,

      startTime: true,

      endTime: true,

    },

  });

  if (availabilities.length === 0) return [];



  const listenerIds = Array.from(new Set(availabilities.map((row) => row.listenerId)));



  const dayStart = new Date(date);

  dayStart.setHours(0, 0, 0, 0);

  const nextDay = new Date(dayStart);

  nextDay.setDate(nextDay.getDate() + 1);



  const [requests, sessionsForDate] = await Promise.all([

    prisma.listenerBookingRequest.findMany({

      where: {

        assignedListenerId: { in: listenerIds },

        preferredDate: { gte: dayStart, lt: nextDay },

        status: { in: ACTIVE_REQUEST_STATUSES },

      },

      select: {

        assignedListenerId: true,

        preferredDate: true,

        preferredTime: true,

        duration: true,

        status: true,

        listenerConfirmation: true,

      },

    }),

    prisma.careSession.findMany({

      where: {

        providerId: { in: listenerIds },

        sessionMode: "LISTENER",

        startTime: { gte: dayStart, lt: nextDay },

        status: { in: ACTIVE_SESSION_STATUSES },

      },

      select: {

        providerId: true,

        startTime: true,

        duration: true,

        status: true,

      },

    }),

  ]);



  const windowsByListener = new Map<string, Array<{ startTime: string; endTime: string }>>();

  for (const row of availabilities) {

    const list = windowsByListener.get(row.listenerId) ?? [];

    list.push({ startTime: row.startTime, endTime: row.endTime });

    windowsByListener.set(row.listenerId, list);

  }



  const requestsByListener = new Map<string, BusyListenerRequest[]>();

  for (const request of requests) {

    if (!request.assignedListenerId) continue;

    const list = requestsByListener.get(request.assignedListenerId) ?? [];

    list.push({

      preferredDate: request.preferredDate,

      preferredTime: request.preferredTime,

      duration: request.duration,

      status: request.status,

      listenerConfirmation: request.listenerConfirmation,

    });

    requestsByListener.set(request.assignedListenerId, list);

  }



  const sessionsByListener = new Map<string, ConflictSession[]>();

  for (const session of sessionsForDate) {

    const list = sessionsByListener.get(session.providerId) ?? [];

    list.push({

      startTime: session.startTime,

      duration: session.duration,

      status: session.status,

    });

    sessionsByListener.set(session.providerId, list);

  }



  const perListener = listenerIds.map((listenerId) => ({

    listenerId,

    windows: windowsByListener.get(listenerId) ?? [],

    busy: listenerBusyRangesForDate({

      date,

      requests: requestsByListener.get(listenerId) ?? [],

      sessions: sessionsByListener.get(listenerId) ?? [],

    }),

  }));



  return aggregateListenerSlots({

    date,

    durationMin: LISTENER_SLOT_DURATION_MIN,

    perListener,

  });

}



export async function getEligibleListenersForSlot(input: {

  date: Date;

  time: string;

  durationMin?: number;

}): Promise<string[]> {

  const duration = input.durationMin ?? LISTENER_SLOT_DURATION_MIN;

  const startMin = parseTimeToMinutes(input.time);

  if (startMin === null) return [];

  const slotRange = { startMinutes: startMin, endMinutes: startMin + duration };

  const dow = dayOfWeekForDate(input.date);



  const availabilities = await prisma.listenerAvailability.findMany({

    where: { dayOfWeek: dow, isActive: true, listener: { role: "LISTENER" } },

    select: { listenerId: true, startTime: true, endTime: true },

  });



  const candidates = new Map<string, Array<{ startTime: string; endTime: string }>>();

  for (const row of availabilities) {

    const winStart = parseTimeToMinutes(row.startTime);

    const winEnd = parseTimeToMinutes(row.endTime);

    if (winStart === null || winEnd === null) continue;

    if (winStart <= slotRange.startMinutes && slotRange.endMinutes <= winEnd) {

      const list = candidates.get(row.listenerId) ?? [];

      list.push({ startTime: row.startTime, endTime: row.endTime });

      candidates.set(row.listenerId, list);

    }

  }

  if (candidates.size === 0) return [];



  const listenerIds = Array.from(candidates.keys());

  const dayStart = new Date(input.date);

  dayStart.setHours(0, 0, 0, 0);

  const nextDay = new Date(dayStart);

  nextDay.setDate(nextDay.getDate() + 1);



  const [requests, sessions] = await Promise.all([

    prisma.listenerBookingRequest.findMany({

      where: {

        assignedListenerId: { in: listenerIds },

        preferredDate: { gte: dayStart, lt: nextDay },

        status: { in: ACTIVE_REQUEST_STATUSES },

      },

      select: {

        assignedListenerId: true,

        preferredDate: true,

        preferredTime: true,

        duration: true,

        status: true,

        listenerConfirmation: true,

      },

    }),

    prisma.careSession.findMany({

      where: {

        providerId: { in: listenerIds },

        sessionMode: "LISTENER",

        startTime: { gte: dayStart, lt: nextDay },

        status: { in: ACTIVE_SESSION_STATUSES },

      },

      select: {

        providerId: true,

        startTime: true,

        duration: true,

        status: true,

      },

    }),

  ]);



  const eligible: string[] = [];

  for (const listenerId of listenerIds) {

    const busy = listenerBusyRangesForDate({

      date: input.date,

      requests: requests

        .filter((r) => r.assignedListenerId === listenerId)

        .map((r) => ({

          preferredDate: r.preferredDate,

          preferredTime: r.preferredTime,

          duration: r.duration,

          status: r.status,

          listenerConfirmation: r.listenerConfirmation,

        })),

      sessions: sessions

        .filter((s) => s.providerId === listenerId)

        .map((s) => ({

          startTime: s.startTime,

          duration: s.duration,

          status: s.status,

        })),

    });

    const conflict = busy.some((range) => rangesOverlap(range, slotRange));

    if (!conflict) eligible.push(listenerId);

  }



  return eligible;

}



export type ListenerAvailabilityRow = Prisma.ListenerAvailabilityGetPayload<{

  select: {

    id: true;

    listenerId: true;

    dayOfWeek: true;

    startTime: true;

    endTime: true;

    timezone: true;

    isActive: true;

    createdAt: true;

    updatedAt: true;

  };

}>;

