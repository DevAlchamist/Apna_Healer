const DEFAULT_TIMEZONE = "Asia/Kolkata";

/** YYYY-MM-DD in the given IANA timezone. */
export function calendarDateKeyForTimezone(
  timezone: string | null | undefined,
  date = new Date(),
): string {
  const tz = timezone?.trim() || DEFAULT_TIMEZONE;
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const d = parts.find((p) => p.type === "day")?.value;
    if (y && m && d) return `${y}-${m}-${d}`;
  } catch {
    // fall through
  }
  return date.toISOString().slice(0, 10);
}

/** UTC midnight for a calendar date key (stored as @db.Date). */
export function journalDateFromKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

export function parseJournalDateKey(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  return value.trim();
}
