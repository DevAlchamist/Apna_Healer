import { createEvent, type EventAttributes } from "ics";
import type { EmailAttachment } from "@/server/emails/types";

export function buildSessionCalendarAttachment(input: {
  sessionId: string;
  title: string;
  description?: string;
  startTime: Date;
  durationMinutes: number;
  meetingLink?: string | null;
}): EmailAttachment | undefined {
  const start = input.startTime;
  const event: EventAttributes = {
    uid: `apna-healer-session-${input.sessionId}@apnahealer.com`,
    title: input.title,
    description: [input.description, input.meetingLink ? `Join: ${input.meetingLink}` : ""]
      .filter(Boolean)
      .join("\n\n"),
    start: [
      start.getUTCFullYear(),
      start.getUTCMonth() + 1,
      start.getUTCDate(),
      start.getUTCHours(),
      start.getUTCMinutes(),
    ],
    duration: { minutes: input.durationMinutes },
    url: input.meetingLink ?? undefined,
    status: "CONFIRMED",
    productId: "apna-healer/ics",
  };

  const { error, value } = createEvent(event);
  if (error || !value) {
    console.error("[calendar] Failed to build ICS:", error);
    return undefined;
  }

  return {
    filename: "session.ics",
    content: Buffer.from(value).toString("base64"),
    contentType: "text/calendar; charset=utf-8",
  };
}

export function buildGoogleCalendarUrl(input: {
  title: string;
  startTime: Date;
  durationMinutes: number;
  description?: string;
  meetingLink?: string | null;
}): string {
  const start = input.startTime;
  const end = new Date(start.getTime() + input.durationMinutes * 60_000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: [input.description, input.meetingLink ? `Join: ${input.meetingLink}` : ""]
      .filter(Boolean)
      .join("\n\n"),
  });
  if (input.meetingLink) {
    params.set("location", input.meetingLink);
  }
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
