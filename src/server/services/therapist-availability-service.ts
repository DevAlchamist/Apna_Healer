import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import {
  DEFAULT_BREAK_DURATION_MIN,
  DEFAULT_SLOT_DURATION_MIN,
  generateAvailableSlots,
  generateSlotsForWindow,
  markBookedSlots,
  parseTimeToMinutes,
  type ConflictBooking,
  type ConflictSession,
} from "@/server/services/slot-engine";

export {
  DEFAULT_SLOT_DURATION_MIN,
  DEFAULT_BREAK_DURATION_MIN,
  generateSlotsForWindow,
  markBookedSlots,
};
export type { ConflictBooking, ConflictSession };

export type TherapistWeeklyWindow = {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration?: number;
  breakDuration?: number;
  timezone?: string;
  isActive?: boolean;
};

export type GeneratedSlot = {
  start: string;
  end: string;
  isBooked: boolean;
};

export { dayOfWeekForDate } from "@/server/services/slot-engine";

function assertValidWindow(window: TherapistWeeklyWindow) {
  if (!Number.isInteger(window.dayOfWeek) || window.dayOfWeek < 0 || window.dayOfWeek > 6) {
    throw new ApiError(400, "dayOfWeek must be 0..6", "INVALID_DAY_OF_WEEK");
  }
  const startMin = parseTimeToMinutes(window.startTime);
  const endMin = parseTimeToMinutes(window.endTime);
  if (startMin === null || endMin === null) {
    throw new ApiError(400, "startTime/endTime must be 'HH:mm'.", "INVALID_TIME");
  }
  if (endMin <= startMin) {
    throw new ApiError(400, "endTime must be after startTime.", "INVALID_WINDOW");
  }
  const slotDuration = window.slotDuration ?? DEFAULT_SLOT_DURATION_MIN;
  const breakDuration = window.breakDuration ?? DEFAULT_BREAK_DURATION_MIN;
  if (slotDuration <= 0 || slotDuration > 240) {
    throw new ApiError(400, "slotDuration must be 1..240 minutes.", "INVALID_SLOT_DURATION");
  }
  if (breakDuration < 0 || breakDuration > 120) {
    throw new ApiError(400, "breakDuration must be 0..120 minutes.", "INVALID_BREAK_DURATION");
  }
}

export async function getTherapistWeeklySchedule(therapistId: string) {
  return prisma.therapistAvailability.findMany({
    where: { therapistId },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}

export async function replaceTherapistWeeklySchedule(
  therapistId: string,
  windows: TherapistWeeklyWindow[],
) {
  for (const window of windows) {
    assertValidWindow(window);
  }

  return prisma.$transaction(async (tx) => {
    await tx.therapistAvailability.deleteMany({ where: { therapistId } });
    if (windows.length === 0) return [];
    await tx.therapistAvailability.createMany({
      data: windows.map((window) => ({
        therapistId,
        dayOfWeek: window.dayOfWeek,
        startTime: window.startTime,
        endTime: window.endTime,
        slotDuration: window.slotDuration ?? DEFAULT_SLOT_DURATION_MIN,
        breakDuration: window.breakDuration ?? DEFAULT_BREAK_DURATION_MIN,
        timezone: window.timezone ?? "Asia/Kolkata",
        isActive: window.isActive ?? true,
      })),
    });
    return tx.therapistAvailability.findMany({
      where: { therapistId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  });
}

export async function getTherapistDynamicSlots(input: {
  therapistId: string;
  date: Date;
}) {
  const result = await generateAvailableSlots({
    providerId: input.therapistId,
    providerType: "THERAPIST",
    date: input.date,
  });

  return result.slots.map((slot) => ({
    start: slot.start,
    end: slot.end,
    isBooked: slot.isBooked,
    slotDuration: result.slotDuration,
  }));
}

export type TherapistAvailabilityRow = Prisma.TherapistAvailabilityGetPayload<{
  select: {
    id: true;
    therapistId: true;
    dayOfWeek: true;
    startTime: true;
    endTime: true;
    slotDuration: true;
    breakDuration: true;
    timezone: true;
    isActive: true;
    createdAt: true;
    updatedAt: true;
  };
}>;
