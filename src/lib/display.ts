const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
});

const shortDateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

export function formatCurrency(value: number | string | null | undefined) {
  return currencyFormatter.format(Number(value ?? 0));
}

export function formatShortDate(value: string | Date | null | undefined) {
  if (!value) {
    return "Not available";
  }

  return shortDateFormatter.format(new Date(value));
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) {
    return "Not available";
  }

  return dateTimeFormatter.format(new Date(value));
}

/** Short relative label for "Sent 2h ago" style UI. */
export function formatSentAgo(iso: string | Date): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "Sent recently";
  const diffMs = Date.now() - t;
  if (diffMs < 0) return "Sent recently";
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Sent just now";
  if (mins < 60) return `Sent ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Sent ${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `Sent ${days}d ago`;
}

/** Full calendar + clock with seconds (e.g. session modal). */
const sessionScheduledDateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});

export function formatSessionScheduledDateTime(value: string | Date | null | undefined) {
  if (!value) {
    return "Not available";
  }

  return sessionScheduledDateTimeFormatter.format(new Date(value));
}

/**
 * Human-readable positive duration: "2 days 3 hr 15 min 8 sec" (omits zero units except seconds).
 */
export function formatDurationDayHourMinSec(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) {
    return "0 sec";
  }

  let totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  totalSec -= days * 86400;
  const hours = Math.floor(totalSec / 3600);
  totalSec -= hours * 3600;
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec - minutes * 60;

  const parts: string[] = [];
  if (days > 0) {
    parts.push(`${days} day${days === 1 ? "" : "s"}`);
  }
  if (hours > 0) {
    parts.push(`${hours} hr`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} min`);
  }
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds} sec`);
  }
  return parts.join(" ");
}

/** Label for nav/profile when `User.name` is missing (uses email local-part, then "Member"). */
export function displayAccountLabel(
  name: string | null | undefined,
  email: string | null | undefined,
): string {
  const trimmedName = name?.trim();
  if (trimmedName) return trimmedName;
  const local = email?.trim().split("@")[0]?.trim();
  if (local) return local;
  return "Member";
}

/** Name of the other party in a care session (client vs provider) for the signed-in viewer. */
export function sessionCounterpartyLabel(
  session: {
    userId: string;
    user?: { name?: string | null; email?: string | null } | null;
    provider?: { name?: string | null } | null;
  },
  viewerUserId?: string | null,
): string {
  if (!viewerUserId) {
    return session.provider?.name ?? "Care provider";
  }
  if (session.userId === viewerUserId) {
    return session.provider?.name ?? "Care provider";
  }
  return session.user?.name ?? session.user?.email ?? "Member";
}

/** Join opens 15 minutes before start through scheduled end (UPCOMING), or any time until end when ONGOING. */
const CARE_SESSION_JOIN_LEAD_MS = 15 * 60 * 1000;

export function isCareSessionJoinWindowOpen(
  session: {
    startTime: string | Date;
    duration: number;
    status: string;
    meetingLink?: string | null;
  },
  now = new Date(),
): boolean {
  const link = session.meetingLink?.trim();
  if (!link) return false;

  const startMs = new Date(session.startTime).getTime();
  if (!Number.isFinite(startMs)) return false;

  const endMs = startMs + session.duration * 60 * 1000;
  const t = now.getTime();

  if (session.status === "ONGOING") {
    return t < endMs;
  }
  if (session.status === "UPCOMING") {
    return t >= startMs - CARE_SESSION_JOIN_LEAD_MS && t < endMs;
  }
  return false;
}

export function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "AH";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function toSentenceCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function applicationDataPrimaryLine(data: unknown): string {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return "";
  }

  const record = data as Record<string, unknown>;
  for (const key of ["bio", "summary", "whyHelp", "whyJoin"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}
