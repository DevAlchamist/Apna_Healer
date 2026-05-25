import {
  BookingStatus,
  CareSessionStatus,
  ProfessionalApplicationStatus,
  Prisma,
  Role,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AdminSessionsQuery } from "@/lib/validators/admin-session";
import { mergeDateAndTime, decimalToNumber } from "@/server/services/service-utils";

const SESSION_FETCH_CAP = 400;
const BOOKING_FETCH_CAP = 400;

const sessionInclude = {
  booking: true,
  user: true,
  provider: true,
} satisfies Prisma.CareSessionInclude;

const bookingInclude = {
  user: true,
  provider: true,
  session: true,
} satisfies Prisma.BookingInclude;

export type AdminOperationsRow =
  | {
      kind: "session";
      id: string;
      sortAt: Date;
      session: Awaited<ReturnType<typeof prisma.careSession.findMany>>[number];
      booking: Awaited<ReturnType<typeof prisma.booking.findMany>>[number] | null;
    }
  | {
      kind: "booking";
      id: string;
      sortAt: Date;
      booking: Awaited<ReturnType<typeof prisma.booking.findMany>>[number];
    };

function parseRangeBoundary(value: string | undefined, endOfDay: boolean): Date | undefined {
  if (!value?.trim()) return undefined;
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return undefined;
  if (value.trim().length <= 10) {
    if (endOfDay) d.setHours(23, 59, 59, 999);
    else d.setHours(0, 0, 0, 0);
  }
  return d;
}

function buildSessionDateWhere(from?: string, to?: string): Prisma.CareSessionWhereInput {
  const gte = parseRangeBoundary(from, false);
  const lte = parseRangeBoundary(to, true);
  if (!gte && !lte) return {};
  const startTime: Prisma.DateTimeFilter = {};
  if (gte) startTime.gte = gte;
  if (lte) startTime.lte = lte;
  return { startTime };
}

function buildBookingDateWhere(from?: string, to?: string): Prisma.BookingWhereInput {
  const gte = parseRangeBoundary(from, false);
  const lte = parseRangeBoundary(to, true);
  if (!gte && !lte) return {};
  const requestedDate: Prisma.DateTimeFilter = {};
  if (gte) requestedDate.gte = gte;
  if (lte) requestedDate.lte = lte;
  return { requestedDate };
}

const BOOKING_STATUSES = new Set<string>([
  BookingStatus.PENDING,
  BookingStatus.ACCEPTED,
  BookingStatus.REJECTED,
  BookingStatus.CANCELLED,
  BookingStatus.COMPLETED,
]);

const SESSION_STATUSES = new Set<string>([
  CareSessionStatus.UPCOMING,
  CareSessionStatus.ONGOING,
  CareSessionStatus.COMPLETED,
  CareSessionStatus.MISSED,
  CareSessionStatus.CANCELLED,
]);

function rowMatchesStatus(row: AdminOperationsRow, status: string): boolean {
  if (row.kind === "session") {
    return row.session.status === status;
  }
  return row.booking.status === status;
}

function mergeOperationsRows(
  sessions: Awaited<ReturnType<typeof prisma.careSession.findMany<{ include: typeof sessionInclude }>>>,
  bookings: Awaited<ReturnType<typeof prisma.booking.findMany<{ include: typeof bookingInclude }>>>,
): AdminOperationsRow[] {
  const rows: AdminOperationsRow[] = [];

  for (const session of sessions) {
    rows.push({
      kind: "session",
      id: `session:${session.id}`,
      sortAt: new Date(session.startTime),
      session,
      booking: session.booking ?? null,
    });
  }

  for (const booking of bookings) {
    if (booking.session) continue;
    rows.push({
      kind: "booking",
      id: `booking:${booking.id}`,
      sortAt: mergeDateAndTime(booking.requestedDate, booking.requestedTime),
      booking,
    });
  }

  rows.sort((a, b) => b.sortAt.getTime() - a.sortAt.getTime());
  return rows;
}

export async function getAdminSessionsDashboard(query: AdminSessionsQuery) {
  const page = query.page ?? 1;
  const take = query.take ?? 10;

  const sessionDateWhere = buildSessionDateWhere(query.from, query.to);
  const bookingDateWhere = buildBookingDateWhere(query.from, query.to);

  const [
    sessions,
    bookings,
    revenueAgg,
    activeCount,
    pendingBookingsCount,
    completedDurationAgg,
    providerRoles,
    busyProviderGroups,
    reviewAgg,
    pendingApplications,
    weeklyReviewBuckets,
  ] = await Promise.all([
    prisma.careSession.findMany({
      where: sessionDateWhere,
      include: sessionInclude,
      orderBy: { startTime: "desc" },
      take: SESSION_FETCH_CAP,
    }),
    prisma.booking.findMany({
      where: bookingDateWhere,
      include: bookingInclude,
      orderBy: { createdAt: "desc" },
      take: BOOKING_FETCH_CAP,
    }),
    prisma.careSession.aggregate({
      where: {
        ...sessionDateWhere,
        status: CareSessionStatus.COMPLETED,
      },
      _sum: { amount: true },
    }),
    prisma.careSession.count({
      where: {
        ...sessionDateWhere,
        status: { in: [CareSessionStatus.UPCOMING, CareSessionStatus.ONGOING] },
      },
    }),
    prisma.booking.count({
      where: {
        ...bookingDateWhere,
        status: BookingStatus.PENDING,
      },
    }),
    prisma.careSession.aggregate({
      where: {
        ...sessionDateWhere,
        status: CareSessionStatus.COMPLETED,
      },
      _avg: { duration: true },
    }),
    prisma.user.count({
      where: {
        role: { in: [Role.THERAPIST, Role.LISTENER] },
        OR: [{ therapistProfile: { isNot: null } }, { listenerProfile: { isNot: null } }],
      },
    }),
    prisma.careSession.groupBy({
      by: ["providerId"],
      where: {
        ...sessionDateWhere,
        status: { in: [CareSessionStatus.UPCOMING, CareSessionStatus.ONGOING] },
      },
    }),
    prisma.sessionReview.aggregate({
      _avg: { rating: true },
      _count: true,
    }),
    prisma.professionalApplication.count({
      where: { status: ProfessionalApplicationStatus.PENDING },
    }),
    prisma.sessionReview.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      select: { createdAt: true, rating: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  let merged = mergeOperationsRows(sessions, bookings);

  if (query.status) {
    merged = merged.filter((row) => rowMatchesStatus(row, query.status!));
  }

  const total = merged.length;
  const skip = (page - 1) * take;
  const pageItems = merged.slice(skip, skip + take);

  const totalProviders = providerRoles || 1;
  const busyProviders = busyProviderGroups.length;
  const capacityPercent = Math.min(
    100,
    Math.round((busyProviders / totalProviders) * 100) || 0,
  );

  const satisfactionBars = buildWeeklySatisfactionBars(weeklyReviewBuckets);

  const items = pageItems.map((row) => ({
    ...row,
    sortAt: row.sortAt.toISOString(),
  }));

  return {
    items,
    total,
    page,
    pageSize: take,
    stats: {
      totalRevenue: decimalToNumber(revenueAgg._sum.amount ?? 0),
      activeSessions: activeCount,
      pendingBookings: pendingBookingsCount,
      capacityPercent,
      avgDurationMinutes: completedDurationAgg._avg.duration
        ? Math.round(completedDurationAgg._avg.duration)
        : 0,
    },
    satisfaction: {
      averageRating:
        reviewAgg._avg.rating != null
          ? Number(reviewAgg._avg.rating.toFixed(1))
          : null,
      reviewCount: reviewAgg._count,
      weeklyBars: satisfactionBars,
    },
    pendingCredentialingCount: pendingApplications,
  };
}

function buildWeeklySatisfactionBars(
  reviews: Array<{ createdAt: Date; rating: number }>,
): number[] {
  const buckets = [0, 0, 0, 0, 0, 0, 0];
  const now = new Date();
  for (const review of reviews) {
    const dayDiff = Math.floor(
      (now.getTime() - review.createdAt.getTime()) / (24 * 60 * 60 * 1000),
    );
    const index = Math.min(6, Math.max(0, 6 - dayDiff));
    buckets[index] += review.rating;
  }
  const max = Math.max(...buckets, 1);
  return buckets.map((v) => Math.round((v / max) * 100) || 8);
}

export { BOOKING_STATUSES, SESSION_STATUSES };
