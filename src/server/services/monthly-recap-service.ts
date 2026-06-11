import { CareSessionStatus, ClubMembershipStatus, ClubStatus, EventRegistrationStatus, JournalEntryStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/server/services/notification-service";
import {
  hasEmailBeenSent,
  recordEmailDelivery,
} from "@/server/services/email-delivery-log-service";

function priorMonthRange(reference = new Date()) {
  const start = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() - 1, 1));
  const end = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 1));
  const monthLabel = start.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const dedupeKey = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`;
  return { start, end, monthLabel, dedupeKey };
}

export async function processMonthlyRecaps(reference = new Date()) {
  const { start, end, monthLabel, dedupeKey } = priorMonthRange(reference);

  const [activeMembers, sessionUsers] = await Promise.all([
    prisma.clubMembership.findMany({
      where: { status: ClubMembershipStatus.ACTIVE },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.careSession.findMany({
      where: {
        status: CareSessionStatus.COMPLETED,
        startTime: { gte: start, lt: end },
      },
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);

  const userIds = [...new Set([...activeMembers.map((m) => m.userId), ...sessionUsers.map((s) => s.userId)])];

  let sent = 0;
  let skipped = 0;

  for (const userId of userIds) {
    const kind = "MONTHLY_RECAP";
    const userDedupeKey = `${userId}:${dedupeKey}`;
    if (await hasEmailBeenSent(kind, userDedupeKey)) {
      skipped += 1;
      continue;
    }

    const [sessions, journalCount, memberships, upcomingRegs] = await Promise.all([
      prisma.careSession.findMany({
        where: {
          userId,
          status: CareSessionStatus.COMPLETED,
          startTime: { gte: start, lt: end },
        },
        select: { duration: true },
      }),
      prisma.journalEntry.count({
        where: {
          userId,
          status: JournalEntryStatus.COMPLETED,
          createdAt: { gte: start, lt: end },
        },
      }),
      prisma.clubMembership.findMany({
        where: { userId, status: ClubMembershipStatus.ACTIVE },
        select: { clubId: true },
      }),
      prisma.eventRegistration.findMany({
        where: {
          userId,
          status: EventRegistrationStatus.CONFIRMED,
          event: { startsAt: { gte: reference } },
        },
        include: {
          event: { select: { title: true, slug: true, startsAt: true } },
        },
        take: 3,
        orderBy: { event: { startsAt: "asc" } },
      }),
    ]);

    const sessionCount = sessions.length;
    const sessionMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
    const memberClubIds = memberships.map((m) => m.clubId);

    const suggestedClubs = await prisma.club.findMany({
      where: {
        status: ClubStatus.ACTIVE,
        ...(memberClubIds.length ? { id: { notIn: memberClubIds } } : {}),
      },
      select: {
        title: true,
        slug: true,
        subtitle: true,
        heroImageUrl: true,
        _count: { select: { memberships: true } },
      },
      orderBy: { memberships: { _count: "desc" } },
      take: 2,
    });

    await createNotification({
      userId,
      type: "MONTHLY_RECAP",
      title: `Your ${monthLabel} wellness recap`,
      body: `You completed ${sessionCount} session${sessionCount === 1 ? "" : "s"} and wrote ${journalCount} journal entr${journalCount === 1 ? "y" : "ies"} last month.`,
      href: "/dashboard",
      metadata: {
        monthLabel,
        sessionCount,
        sessionMinutes,
        journalCount,
        upcomingEvents: upcomingRegs.map((reg) => ({
          title: reg.event.title,
          dateLabel: reg.event.startsAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          }),
          url: `/dashboard/events/${reg.event.slug}`,
        })),
        suggestedClubs: suggestedClubs.map((club) => ({
          title: club.title,
          description: club.subtitle ?? "A supportive community circle.",
          memberCount: club._count.memberships,
          url: `/clubs/${club.slug}`,
          imageUrl: club.heroImageUrl,
        })),
      },
    });

    await recordEmailDelivery({ userId, kind, dedupeKey: userDedupeKey });
    sent += 1;
  }

  return { sent, skipped, checked: userIds.length };
}
