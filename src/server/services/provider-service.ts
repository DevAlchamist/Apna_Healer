import { Role, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import {
  buildWeeklyProviderAvailability,
  findNextOpenAvailabilityDate,
  type DynamicAvailabilityDay,
} from "@/server/services/provider-dynamic-availability";
import { generateAvailableSlots } from "@/server/services/slot-engine";
import { activeRangesForDate, type ResolvedSlot } from "@/server/services/slot-availability";

type ProviderDirectoryRole = "THERAPIST" | "LISTENER";

type ProviderRecord = Prisma.UserGetPayload<{
  include: {
    therapistProfile: true;
    listenerProfile: true;
    _count: {
      select: {
        providedSessions: true;
      };
    };
  };
}>;

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function mapDynamicAvailabilityDays(days: DynamicAvailabilityDay[]) {
  return days.map((day) => ({
    id: day.id,
    providerId: day.providerId,
    date: day.date.toISOString(),
    timezone: day.timezone,
    slots: day.slots,
    createdAt: day.createdAt.toISOString(),
    updatedAt: day.updatedAt.toISOString(),
  }));
}

function firstOpenDayIso(days: ReturnType<typeof mapDynamicAvailabilityDays>) {
  const open = days.find((day) => day.slots.some((slot) => !slot.isBooked));
  return open?.date ?? days[0]?.date ?? null;
}

function mapProvider(
  record: ProviderRecord,
  options: {
    includeAvailability: boolean;
    dynamicAvailability?: DynamicAvailabilityDay[];
    nextAvailabilityDate?: string | null;
  },
) {
  const { includeAvailability, dynamicAvailability = [], nextAvailabilityDate } = options;
  const dynamicDays = mapDynamicAvailabilityDays(dynamicAvailability);

  return {
    id: record.id,
    name: record.name,
    image: record.image,
    role: record.role as ProviderDirectoryRole,
    isVerified: record.isVerified,
    bio: record.therapistProfile?.bio ?? record.listenerProfile?.bio ?? null,
    hourlyRate: record.therapistProfile?.hourlyRate?.toString() ?? null,
    specializations: record.therapistProfile?.specializations ?? [],
    languages: record.listenerProfile?.languages ?? [],
    sessionCount: record._count.providedSessions,
    nextAvailabilityDate: nextAvailabilityDate ?? firstOpenDayIso(dynamicDays),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    availability: includeAvailability
      ? dynamicDays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      : undefined,
  };
}

function buildProviderFilters(filters: {
  role?: ProviderDirectoryRole;
  query?: string;
  specialization?: string;
}) {
  const queryConditions: Prisma.UserWhereInput[] = [];

  if (filters.query) {
    queryConditions.push({
      OR: [
        { name: { contains: filters.query, mode: "insensitive" } },
        {
          therapistProfile: {
            is: {
              bio: { contains: filters.query, mode: "insensitive" },
            },
          },
        },
        {
          listenerProfile: {
            is: {
              bio: { contains: filters.query, mode: "insensitive" },
            },
          },
        },
        {
          therapistProfile: {
            is: {
              specializations: { has: filters.query },
            },
          },
        },
        {
          listenerProfile: {
            is: {
              languages: { has: filters.query },
            },
          },
        },
      ],
    });
  }

  if (filters.specialization) {
    queryConditions.push({
      OR: [
        {
          therapistProfile: {
            is: {
              specializations: { has: filters.specialization },
            },
          },
        },
        {
          listenerProfile: {
            is: {
              languages: { has: filters.specialization },
            },
          },
        },
      ],
    });
  }

  return {
    role: { in: filters.role ? [filters.role] : [Role.THERAPIST, Role.LISTENER] },
    isVerified: true,
    ...(queryConditions.length > 0 ? { AND: queryConditions } : {}),
  } satisfies Prisma.UserWhereInput;
}

export async function listProviders(filters: {
  role?: ProviderDirectoryRole;
  query?: string;
  specialization?: string;
  take?: number;
}) {
  const records = await prisma.user.findMany({
    where: buildProviderFilters(filters),
    include: {
      therapistProfile: true,
      listenerProfile: true,
      _count: {
        select: {
          providedSessions: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
    take: filters.take ?? 24,
  });

  const today = startOfToday();

  const enriched = await Promise.all(
    records.map(async (record) => {
      let nextAvailabilityDate: string | null = null;
      if (record.role === Role.THERAPIST || record.role === Role.LISTENER) {
        const next = await findNextOpenAvailabilityDate({
          providerId: record.id,
          role: record.role,
          fromDate: today,
          dayCount: 30,
        });
        nextAvailabilityDate = next?.toISOString() ?? null;
      }
      const mapped = mapProvider(record, {
        includeAvailability: false,
        nextAvailabilityDate,
      });
      return { ...mapped, nextAvailabilityDate };
    }),
  );

  return enriched;
}

export async function getProviderById(providerId: string) {
  const today = startOfToday();
  const record = await prisma.user.findFirst({
    where: {
      id: providerId,
      ...buildProviderFilters({}),
    },
    include: {
      therapistProfile: true,
      listenerProfile: true,
      _count: {
        select: {
          providedSessions: true,
        },
      },
    },
  });

  if (!record) {
    throw new ApiError(404, "Provider was not found.", "PROVIDER_NOT_FOUND");
  }

  let dynamicAvailability: DynamicAvailabilityDay[] = [];
  if (record.role === Role.THERAPIST || record.role === Role.LISTENER) {
    dynamicAvailability = await buildWeeklyProviderAvailability({
      providerId,
      role: record.role,
      fromDate: today,
      dayCount: 14,
    });
  }

  const next = await findNextOpenAvailabilityDate({
    providerId,
    role: record.role,
    fromDate: today,
    dayCount: 30,
  });

  return mapProvider(record, {
    includeAvailability: true,
    dynamicAvailability,
    nextAvailabilityDate: next?.toISOString() ?? null,
  });
}

export async function getPublicTherapistById(providerId: string) {
  const today = startOfToday();
  const record = await prisma.user.findFirst({
    where: {
      id: providerId,
      role: Role.THERAPIST,
      isVerified: true,
    },
    include: {
      therapistProfile: true,
      listenerProfile: true,
      _count: {
        select: {
          providedSessions: true,
        },
      },
    },
  });

  if (!record?.therapistProfile) {
    throw new ApiError(404, "Therapist was not found.", "PROVIDER_NOT_FOUND");
  }

  const next = await findNextOpenAvailabilityDate({
    providerId,
    role: Role.THERAPIST,
    fromDate: today,
    dayCount: 30,
  });

  const base = mapProvider(record, {
    includeAvailability: false,
    nextAvailabilityDate: next?.toISOString() ?? null,
  });

  const profile = record.therapistProfile;

  return {
    ...base,
    certifications: profile.certifications ?? [],
    experienceYears: profile.experienceYears,
    rating: profile.rating.toString(),
    profileSessionCount: profile.totalSessions,
    profileDescription: profile.profileDescription,
    philosophyQuote: profile.philosophyQuote,
    experienceDescription: profile.experienceDescription,
    testimonialQuote: profile.testimonialQuote,
    testimonialAuthor: profile.testimonialAuthor,
    retentionRate: profile.retentionRate,
  };
}

export async function getProviderSlotsForDate(input: {
  providerId: string;
  date: Date;
}): Promise<{
  providerId: string;
  date: string;
  timezone: string;
  slots: ResolvedSlot[];
  bookings: Array<{ start: string; end: string }>;
} | null> {
  const dayStart = new Date(input.date);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const provider = await prisma.user.findFirst({
    where: { id: input.providerId, ...buildProviderFilters({}) },
    select: { id: true, role: true },
  });

  if (!provider) {
    throw new ApiError(404, "Provider was not found.", "PROVIDER_NOT_FOUND");
  }

  const providerType =
    provider.role === Role.THERAPIST
      ? "THERAPIST"
      : provider.role === Role.LISTENER
        ? "LISTENER"
        : null;

  if (!providerType) return null;

  const result = await generateAvailableSlots({
    providerId: input.providerId,
    providerType,
    date: input.date,
  });

  if (result.slots.length === 0) return null;

  const noon = new Date(input.date);
  noon.setHours(12, 0, 0, 0);

  const [bookings, sessions] = await Promise.all([
    prisma.booking.findMany({
      where: {
        providerId: input.providerId,
        status: { in: ["PENDING", "ACCEPTED"] },
        requestedDate: { gte: dayStart, lt: dayEnd },
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
        status: { in: ["UPCOMING", "ONGOING"] },
        startTime: { gte: dayStart, lt: dayEnd },
      },
      select: {
        startTime: true,
        duration: true,
        status: true,
      },
    }),
  ]);

  const activeRanges = activeRangesForDate({
    date: input.date,
    bookings,
    sessions,
  });

  return {
    providerId: input.providerId,
    date: noon.toISOString(),
    timezone: result.timezone,
    slots: result.slots.map((slot) => ({
      start: slot.start,
      end: slot.end,
      isBooked: slot.isBooked,
    })),
    bookings: activeRanges,
  };
}
