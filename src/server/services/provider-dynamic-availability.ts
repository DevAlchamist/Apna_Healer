import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_TIMEZONE,
  generateAvailableSlots,
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

async function hasWeeklySchedule(providerId: string, role: Role) {
  if (role === Role.THERAPIST) {
    return prisma.therapistAvailability.count({
      where: { therapistId: providerId, isActive: true },
    });
  }
  if (role === Role.LISTENER) {
    return prisma.listenerAvailability.count({
      where: { listenerId: providerId, isActive: true },
    });
  }
  return 0;
}

function providerTypeForRole(role: Role): "THERAPIST" | "LISTENER" | null {
  if (role === Role.THERAPIST) return "THERAPIST";
  if (role === Role.LISTENER) return "LISTENER";
  return null;
}

/**
 * Builds per-day availability from weekly schedule via the centralized slot engine.
 */
export async function buildWeeklyProviderAvailability(input: {
  providerId: string;
  role: Role;
  fromDate: Date;
  dayCount?: number;
}): Promise<DynamicAvailabilityDay[]> {
  const providerType = providerTypeForRole(input.role);
  if (!providerType) return [];

  const weeklyCount = await hasWeeklySchedule(input.providerId, input.role);
  if (weeklyCount === 0) return [];

  const horizon = input.dayCount ?? DEFAULT_HORIZON_DAYS;
  const now = new Date();
  const days: DynamicAvailabilityDay[] = [];

  for (let offset = 0; offset < horizon; offset++) {
    const day = addDays(input.fromDate, offset);
    const result = await generateAvailableSlots({
      providerId: input.providerId,
      providerType,
      date: day,
    });
    if (result.slots.length === 0) continue;

    const noon = dateAtLocalNoon(day);
    days.push({
      id: syntheticAvailabilityId(input.providerId, day),
      providerId: input.providerId,
      date: noon,
      timezone: result.timezone,
      slots: result.slots.map((slot) => ({
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
