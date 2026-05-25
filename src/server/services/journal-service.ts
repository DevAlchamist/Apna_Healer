import {
  JournalEntryStatus,
  NotificationType,
  Role,
  type JournalEntry,
  type Prisma,
} from "@prisma/client";
import { inferCardVariant } from "@/lib/journal-card-variant";
import { prisma } from "@/lib/prisma";
import {
  calendarDateKeyForTimezone,
  journalDateFromKey,
  parseJournalDateKey,
} from "@/lib/journal-date";
import type {
  ApiJournalEntry,
  ApiJournalStreak,
  ApiJournalTodayPayload,
} from "@/types/api";

const DEFAULT_TAKE = 24;

function stripHtmlToPlain(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractCoverImageUrl(html: string): string | null {
  const match = /<img[^>]+src=["']([^"']+)["']/i.exec(html);
  return match?.[1]?.trim() ?? null;
}

function mapEntry(entry: JournalEntry): ApiJournalEntry {
  return {
    id: entry.id,
    journalDateKey: entry.journalDate.toISOString().slice(0, 10),
    title: entry.title,
    contentHtml: entry.contentHtml,
    excerpt: (entry.contentPlain ?? "").slice(0, 220),
    mood: entry.mood,
    tags: entry.tags,
    coverImageUrl: entry.coverImageUrl,
    cardVariant: entry.cardVariant,
    status: entry.status,
    completedAt: entry.completedAt?.toISOString() ?? null,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

async function getUserTimezone(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  return user?.timezone ?? "Asia/Kolkata";
}

export async function computeStreak(userId: string, timezone: string): Promise<ApiJournalStreak> {
  const completed = await prisma.journalEntry.findMany({
    where: { userId, status: JournalEntryStatus.COMPLETED },
    select: { journalDate: true },
    orderBy: { journalDate: "desc" },
    take: 400,
  });

  const dateKeys = new Set(
    completed.map((e) => e.journalDate.toISOString().slice(0, 10)),
  );

  const todayKey = calendarDateKeyForTimezone(timezone);
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayKey = calendarDateKeyForTimezone(timezone, yesterday);

  let anchor = dateKeys.has(todayKey)
    ? todayKey
    : dateKeys.has(yesterdayKey)
      ? yesterdayKey
      : null;

  let currentStreak = 0;
  if (anchor) {
    const cursor = new Date(`${anchor}T00:00:00.000Z`);
    while (true) {
      const key = cursor.toISOString().slice(0, 10);
      if (!dateKeys.has(key)) break;
      currentStreak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
  }

  let longestStreak = 0;
  let run = 0;
  const sorted = [...dateKeys].sort();
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      run = 1;
      continue;
    }
    const prev = new Date(`${sorted[i - 1]}T00:00:00.000Z`);
    const curr = new Date(`${sorted[i]}T00:00:00.000Z`);
    prev.setUTCDate(prev.getUTCDate() + 1);
    if (prev.toISOString().slice(0, 10) === sorted[i]) {
      run += 1;
    } else {
      longestStreak = Math.max(longestStreak, run);
      run = 1;
    }
  }
  longestStreak = Math.max(longestStreak, run);

  const todayCompleted = dateKeys.has(todayKey);

  return {
    currentStreak,
    longestStreak,
    todayCompleted,
    todayDateKey: todayKey,
  };
}

export async function getJournalTodayPayload(
  userId: string,
  dateKeyOverride?: string,
): Promise<ApiJournalTodayPayload> {
  const timezone = await getUserTimezone(userId);
  const todayKey =
    parseJournalDateKey(dateKeyOverride) ?? calendarDateKeyForTimezone(timezone);
  const journalDate = journalDateFromKey(todayKey);

  let entry = await prisma.journalEntry.findUnique({
    where: {
      userId_journalDate: { userId, journalDate },
    },
  });

  const streak = await computeStreak(userId, timezone);

  return {
    entry: entry ? mapEntry(entry) : null,
    streak,
    journalDateKey: todayKey,
  };
}

export async function getJournalEntryById(userId: string, id: string) {
  const entry = await prisma.journalEntry.findFirst({
    where: { id, userId },
  });
  if (!entry) return null;
  return mapEntry(entry);
}

export async function getJournalEntryForDateKey(userId: string, dateKey: string) {
  const parsed = parseJournalDateKey(dateKey);
  if (!parsed) return null;
  const entry = await prisma.journalEntry.findUnique({
    where: {
      userId_journalDate: {
        userId,
        journalDate: journalDateFromKey(parsed),
      },
    },
  });
  return entry ? mapEntry(entry) : null;
}

export async function autosaveJournalEntry(
  userId: string,
  input: {
    title?: string | null;
    contentHtml: string;
    mood?: string | null;
    coverImageUrl?: string | null;
    journalDateKey?: string;
  },
) {
  const timezone = await getUserTimezone(userId);
  const dateKey =
    parseJournalDateKey(input.journalDateKey) ?? calendarDateKeyForTimezone(timezone);
  const journalDate = journalDateFromKey(dateKey);
  const contentPlain = stripHtmlToPlain(input.contentHtml);
  const cover =
    input.coverImageUrl?.trim() || extractCoverImageUrl(input.contentHtml) || null;
  const cardVariant = inferCardVariant(input.contentHtml, cover);

  const existing = await prisma.journalEntry.findUnique({
    where: { userId_journalDate: { userId, journalDate } },
    select: { status: true },
  });

  const entry = await prisma.journalEntry.upsert({
    where: {
      userId_journalDate: { userId, journalDate },
    },
    create: {
      userId,
      journalDate,
      title: input.title?.trim() || null,
      contentHtml: input.contentHtml,
      contentPlain,
      mood: input.mood?.trim() || null,
      coverImageUrl: cover,
      cardVariant,
      status: JournalEntryStatus.DRAFT,
    },
    update: {
      title: input.title?.trim() || null,
      contentHtml: input.contentHtml,
      contentPlain,
      mood: input.mood?.trim() || null,
      coverImageUrl: cover,
      cardVariant,
      ...(existing?.status === JournalEntryStatus.COMPLETED
        ? {}
        : { status: JournalEntryStatus.DRAFT, completedAt: null }),
    },
  });

  return mapEntry(entry);
}

export async function completeJournalEntry(
  userId: string,
  input: {
    title?: string | null;
    contentHtml: string;
    mood?: string | null;
    coverImageUrl?: string | null;
    journalDateKey?: string;
  },
) {
  const timezone = await getUserTimezone(userId);
  const dateKey =
    parseJournalDateKey(input.journalDateKey) ?? calendarDateKeyForTimezone(timezone);
  const journalDate = journalDateFromKey(dateKey);
  const contentPlain = stripHtmlToPlain(input.contentHtml);

  if (!contentPlain) {
    throw new Error("Journal entry cannot be empty.");
  }

  const existing = await prisma.journalEntry.findUnique({
    where: { userId_journalDate: { userId, journalDate } },
  });
  const wasAlreadyCompleted = existing?.status === JournalEntryStatus.COMPLETED;

  const cover =
    input.coverImageUrl?.trim() || extractCoverImageUrl(input.contentHtml) || null;
  const cardVariant = inferCardVariant(input.contentHtml, cover);
  const now = new Date();

  const entry = await prisma.journalEntry.upsert({
    where: { userId_journalDate: { userId, journalDate } },
    create: {
      userId,
      journalDate,
      title: input.title?.trim() || null,
      contentHtml: input.contentHtml,
      contentPlain,
      mood: input.mood?.trim() || null,
      coverImageUrl: cover,
      cardVariant,
      status: JournalEntryStatus.COMPLETED,
      completedAt: now,
    },
    update: {
      title: input.title?.trim() || null,
      contentHtml: input.contentHtml,
      contentPlain,
      mood: input.mood?.trim() || null,
      coverImageUrl: cover,
      cardVariant,
      status: JournalEntryStatus.COMPLETED,
      completedAt: existing?.completedAt ?? now,
    },
  });

  const streak = await computeStreak(userId, timezone);

  return {
    entry: mapEntry(entry),
    streak,
    isNewCompletion: !wasAlreadyCompleted,
  };
}

export async function listJournalEntries(
  userId: string,
  filters: { query?: string; take?: number; cursor?: string },
) {
  const take = filters.take ?? DEFAULT_TAKE;
  const where: Prisma.JournalEntryWhereInput = {
    userId,
    status: JournalEntryStatus.COMPLETED,
  };

  if (filters.query?.trim()) {
    const q = filters.query.trim();
    const words = q.split(/\s+/).filter(Boolean);
    const or: Prisma.JournalEntryWhereInput[] = [
      { title: { contains: q, mode: "insensitive" } },
      { contentPlain: { contains: q, mode: "insensitive" } },
      { mood: { contains: q, mode: "insensitive" } },
    ];
    for (const word of words) {
      or.push({ tags: { has: word } });
    }
    where.OR = or;
  }

  const items = await prisma.journalEntry.findMany({
    where,
    orderBy: { journalDate: "desc" },
    take: take + 1,
    ...(filters.cursor
      ? {
          cursor: { id: filters.cursor },
          skip: 1,
        }
      : {}),
  });

  const hasMore = items.length > take;
  const page = hasMore ? items.slice(0, take) : items;
  const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null;

  const total = await prisma.journalEntry.count({
    where: { userId, status: JournalEntryStatus.COMPLETED },
  });

  return {
    items: page.map(mapEntry),
    meta: {
      total,
      take,
      cursor: filters.cursor ?? null,
      nextCursor,
    },
  };
}

/** Users who have not completed today's journal in their timezone. */
export async function listUsersNeedingJournalReminder() {
  const members = await prisma.user.findMany({
    where: { role: { in: [Role.USER, Role.THERAPIST, Role.LISTENER] } },
    select: { id: true, timezone: true },
  });

  const needing: Array<{ userId: string; dateKey: string }> = [];

  for (const member of members) {
    const tz = member.timezone ?? "Asia/Kolkata";
    const dateKey = calendarDateKeyForTimezone(tz);
    const journalDate = journalDateFromKey(dateKey);

    const completed = await prisma.journalEntry.findFirst({
      where: {
        userId: member.id,
        journalDate,
        status: JournalEntryStatus.COMPLETED,
      },
      select: { id: true },
    });

    if (!completed) {
      needing.push({ userId: member.id, dateKey });
    }
  }

  return needing;
}

export async function hasJournalReminderForDate(userId: string, dateKey: string) {
  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      type: NotificationType.JOURNAL_REMINDER,
      metadata: {
        path: ["journalDateKey"],
        equals: dateKey,
      },
    },
    select: { id: true },
  });
  return Boolean(existing);
}
