import { prisma } from "@/lib/prisma";

/** YYYY-MM-DD in Asia/Kolkata (same calendar day for all Indian users). */
export function calendarDateKeyAsiaKolkata(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  if (!y || !m || !d) {
    return date.toISOString().slice(0, 10);
  }
  return `${y}-${m}-${d}`;
}

function stableIndexFromKey(key: string, modulo: number): number {
  if (modulo <= 0) return 0;
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % modulo;
}

export type DailyQuotePayload = {
  id: string;
  text: string;
  author: string | null;
  dateKey: string;
};

const FALLBACK_QUOTE: DailyQuotePayload = {
  id: "fallback",
  text: "Small steps each day add up to a gentler path. You do not have to finish everything today.",
  author: null,
  dateKey: "",
};

/**
 * Picks one active quote for the given calendar day (deterministic for all users).
 */
export async function getDailyQuoteForCalendarDay(
  dateKey: string,
): Promise<DailyQuotePayload> {
  const quotes = await prisma.dailyQuote.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { id: true, text: true, author: true },
  });

  if (quotes.length === 0) {
    return { ...FALLBACK_QUOTE, dateKey };
  }

  const idx = stableIndexFromKey(dateKey, quotes.length);
  const row = quotes[idx]!;
  return {
    id: row.id,
    text: row.text,
    author: row.author,
    dateKey,
  };
}
