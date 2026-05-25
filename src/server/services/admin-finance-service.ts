import {
  BookingStatus,
  CareSessionStatus,
  ProfessionalApplicationStatus,
  Role,
  TransactionStatus,
  TransactionType,
  type Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AdminFinanceQuery } from "@/lib/validators/admin-finance";
import { decimalToNumber } from "@/server/services/service-utils";

const TRANSACTION_FETCH_CAP = 600;

const transactionInclude = {
  user: true,
} satisfies Prisma.TransactionInclude;

type RawTransaction = Awaited<
  ReturnType<typeof prisma.transaction.findMany<{ include: typeof transactionInclude }>>
>[number];

type BookingWithProvider = Awaited<
  ReturnType<
    typeof prisma.booking.findMany<{
      include: { provider: true; user: true };
    }>
  >
>[number];

function formatTrxId(id: string) {
  const tail = id.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase();
  return `#TRX-${tail}`;
}

function readMetadataProviderId(metadata: Prisma.JsonValue | null): string | undefined {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return undefined;
  const providerId = (metadata as Record<string, unknown>).providerId;
  return typeof providerId === "string" ? providerId : undefined;
}

function resolvePaymentMethod(txn: RawTransaction): string {
  if (txn.type === TransactionType.CREDIT) return "Wallet Top-up";
  if (txn.type === TransactionType.DEBIT) return "Direct Payment";
  if (txn.type === TransactionType.REFUND) return "Refund";
  if (txn.type === TransactionType.PAYOUT) return "Provider Payout";
  if (txn.purpose === "THERAPIST_BOOKING_QR") return "QR Payment";
  if (txn.purpose === "THERAPIST_BOOKING_CARD") return "Card Payment";
  if (txn.purpose.includes("HOLD")) return "Wallet Hold";
  if (txn.purpose.includes("WELCOME")) return "Platform Credit";
  return "Wallet Usage";
}

function resolveCounterpartyLabel(
  txn: RawTransaction,
  bookingById: Map<string, BookingWithProvider>,
  providerById: Map<string, { name: string | null }>,
): string {
  const purposeLabel = txn.purpose.replaceAll("_", " ").toLowerCase();

  if (txn.referenceId) {
    const booking = bookingById.get(txn.referenceId);
    if (booking?.provider?.name) {
      return `to ${booking.provider.name}`;
    }
  }

  const metaProviderId = readMetadataProviderId(txn.metadata);
  if (metaProviderId) {
    const provider = providerById.get(metaProviderId);
    if (provider?.name) return `to ${provider.name}`;
  }

  if (txn.type === TransactionType.CREDIT) return "Wallet credit";
  if (txn.type === TransactionType.PAYOUT) return "Session earnings";
  if (txn.type === TransactionType.REFUND) return "Funds returned";
  return purposeLabel;
}

function buildWeeklyChart(
  transactions: RawTransaction[],
): Array<{ earnings: number; processing: number }> {
  const buckets = Array.from({ length: 7 }, () => ({ earnings: 0, processing: 0 }));
  const now = new Date();

  for (const txn of transactions) {
    const dayDiff = Math.floor(
      (now.getTime() - txn.createdAt.getTime()) / (24 * 60 * 60 * 1000),
    );
    if (dayDiff < 0 || dayDiff > 6) continue;
    const index = 6 - dayDiff;
    const amount = decimalToNumber(txn.amount);
    if (txn.status === TransactionStatus.SUCCESS) {
      buckets[index].earnings += amount;
    } else if (txn.status === TransactionStatus.PENDING) {
      buckets[index].processing += amount;
    }
  }

  const max = Math.max(
    ...buckets.flatMap((b) => [b.earnings, b.processing]),
    1,
  );

  return buckets.map((b) => ({
    earnings: Math.round((b.earnings / max) * 100) || 4,
    processing: Math.round((b.processing / max) * 100) || 4,
  }));
}

export async function getAdminFinanceDashboard(query: AdminFinanceQuery) {
  const page = query.page ?? 1;
  const take = query.take ?? 20;

  const where: Prisma.TransactionWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.type) where.type = query.type;

  const [
    allTransactions,
    revenueAgg,
    activeHealers,
    pendingApplications,
    pendingBookings,
    missedSessions,
    recentProviders,
  ] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: transactionInclude,
      orderBy: { createdAt: "desc" },
      take: TRANSACTION_FETCH_CAP,
    }),
    prisma.transaction.aggregate({
      where: {
        status: TransactionStatus.SUCCESS,
        type: {
          in: [TransactionType.SESSION_PAYMENT, TransactionType.DEBIT],
        },
      },
      _sum: { amount: true },
    }),
    prisma.user.count({
      where: {
        role: { in: [Role.THERAPIST, Role.LISTENER] },
        OR: [{ therapistProfile: { isNot: null } }, { listenerProfile: { isNot: null } }],
      },
    }),
    prisma.professionalApplication.count({
      where: { status: ProfessionalApplicationStatus.PENDING },
    }),
    prisma.booking.count({
      where: { status: BookingStatus.PENDING },
    }),
    prisma.careSession.count({
      where: { status: CareSessionStatus.MISSED },
    }),
    prisma.user.findMany({
      where: {
        role: { in: [Role.THERAPIST, Role.LISTENER] },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      select: { id: true },
    }),
  ]);

  const referenceIds = [
    ...new Set(
      allTransactions
        .map((txn) => txn.referenceId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const bookings =
    referenceIds.length > 0
      ? await prisma.booking.findMany({
          where: { id: { in: referenceIds } },
          include: { provider: true, user: true },
        })
      : [];

  const bookingById = new Map(bookings.map((b) => [b.id, b]));

  const providerIds = new Set<string>();
  for (const txn of allTransactions) {
    const metaId = readMetadataProviderId(txn.metadata);
    if (metaId) providerIds.add(metaId);
    const booking = txn.referenceId ? bookingById.get(txn.referenceId) : undefined;
    if (booking?.providerId) providerIds.add(booking.providerId);
  }

  const providers =
    providerIds.size > 0
      ? await prisma.user.findMany({
          where: { id: { in: [...providerIds] } },
          select: { id: true, name: true },
        })
      : [];
  const providerById = new Map(providers.map((p) => [p.id, p]));

  const total = allTransactions.length;
  const skip = (page - 1) * take;
  const pageTransactions = allTransactions.slice(skip, skip + take);

  const items = pageTransactions.map((txn) => ({
    id: txn.id,
    displayId: formatTrxId(txn.id),
    walletId: txn.walletId,
    userId: txn.userId,
    type: txn.type,
    amount: txn.amount.toString(),
    status: txn.status,
    purpose: txn.purpose,
    referenceId: txn.referenceId,
    metadata: txn.metadata,
    createdAt: txn.createdAt.toISOString(),
    method: resolvePaymentMethod(txn),
    counterpartyLabel: resolveCounterpartyLabel(txn, bookingById, providerById),
    user: txn.user
      ? {
          id: txn.user.id,
          name: txn.user.name,
          email: txn.user.email,
          image: txn.user.image,
          role: txn.user.role,
          isVerified: txn.user.isVerified,
        }
      : undefined,
    counterparty: (() => {
      const booking = txn.referenceId ? bookingById.get(txn.referenceId) : undefined;
      const provider = booking?.provider;
      if (provider) {
        return {
          id: provider.id,
          name: provider.name,
          email: provider.email,
          image: provider.image,
          role: provider.role,
          isVerified: provider.isVerified,
        };
      }
      const metaId = readMetadataProviderId(txn.metadata);
      if (metaId) {
        const p = providerById.get(metaId);
        if (p) return { id: metaId, name: p.name, email: null, image: null, role: "THERAPIST" as const, isVerified: true };
      }
      return null;
    })(),
  }));

  const prevMonthStart = new Date();
  prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
  prevMonthStart.setDate(1);
  prevMonthStart.setHours(0, 0, 0, 0);
  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const [thisMonthRevenue, prevMonthRevenue] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        status: TransactionStatus.SUCCESS,
        type: { in: [TransactionType.SESSION_PAYMENT, TransactionType.DEBIT] },
        createdAt: { gte: thisMonthStart },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        status: TransactionStatus.SUCCESS,
        type: { in: [TransactionType.SESSION_PAYMENT, TransactionType.DEBIT] },
        createdAt: { gte: prevMonthStart, lt: thisMonthStart },
      },
      _sum: { amount: true },
    }),
  ]);

  const currentRev = decimalToNumber(thisMonthRevenue._sum.amount ?? 0);
  const prevRev = decimalToNumber(prevMonthRevenue._sum.amount ?? 0);
  const revenueDeltaPercent =
    prevRev > 0 ? Number((((currentRev - prevRev) / prevRev) * 100).toFixed(1)) : null;

  const pendingReports = pendingApplications + pendingBookings + missedSessions;

  const reports = [
    ...(pendingApplications > 0
      ? [
          {
            id: "applications",
            status: "PENDING" as const,
            title: "Provider Applications",
            description: `${pendingApplications} professional application${pendingApplications === 1 ? "" : "s"} awaiting credential review.`,
            occurredAt: new Date().toISOString(),
            href: "/admin/applications",
          },
        ]
      : []),
    ...(pendingBookings > 0
      ? [
          {
            id: "bookings",
            status: "PENDING" as const,
            title: "Pending Bookings",
            description: `${pendingBookings} booking request${pendingBookings === 1 ? "" : "s"} need approval before sessions can start.`,
            occurredAt: new Date().toISOString(),
            href: "/admin/sessions",
          },
        ]
      : []),
    ...(missedSessions > 0
      ? [
          {
            id: "missed-sessions",
            status: "PENDING" as const,
            title: "Missed Appointments",
            description: `${missedSessions} session${missedSessions === 1 ? "" : "s"} marked as no-show and may need follow-up.`,
            occurredAt: new Date().toISOString(),
            href: "/admin/sessions",
          },
        ]
      : []),
  ].slice(0, 4);

  return {
    items,
    total,
    page,
    pageSize: take,
    stats: {
      totalRevenue: decimalToNumber(revenueAgg._sum.amount ?? 0),
      revenueDeltaPercent,
      activeHealers,
      newHealersThisWeek: recentProviders.length,
      pendingReports,
    },
    chart: buildWeeklyChart(allTransactions),
    reports,
    expenditureSummary: {
      totalWalletSpent: decimalToNumber(
        (
          await prisma.wallet.aggregate({ _sum: { totalSpent: true } })
        )._sum.totalSpent ?? 0,
      ),
      totalWalletHeld: decimalToNumber(
        (await prisma.wallet.aggregate({ _sum: { heldBalance: true } }))._sum.heldBalance ?? 0,
      ),
    },
  };
}
