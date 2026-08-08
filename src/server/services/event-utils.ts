import type { Event } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/client";

export function slugifyEventTitle(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "event";
}

export async function uniqueEventSlug(
  title: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  let slug = slugifyEventTitle(title);
  let n = 0;
  while (await exists(slug)) {
    n += 1;
    slug = `${slugifyEventTitle(title)}-${n}`;
  }
  return slug;
}

export function decimalToNumber(value: Decimal | number | string | null | undefined): number {
  if (value == null) return 0;
  if (value instanceof Decimal) return Number(value.toString());
  return Number(value);
}

export function formatEventDateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).toUpperCase();
}

export function formatEventTimeLabel(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

export type PriceableEvent = Pick<
  Event,
  "clubId" | "basePrice" | "memberPrice" | "guestPrice" | "membersPay" | "nonMembersPay"
>;

export function resolveRegistrationPrice(
  event: PriceableEvent,
  isActiveClubMember: boolean,
): number {
  const base = decimalToNumber(event.basePrice);
  if (base === 0 && !event.memberPrice && !event.guestPrice) {
    if (isActiveClubMember && !event.membersPay) return 0;
    if (!isActiveClubMember && !event.nonMembersPay) return 0;
  }

  if (isActiveClubMember) {
    if (!event.membersPay) return 0;
    if (event.memberPrice != null) return decimalToNumber(event.memberPrice);
    return base;
  }

  if (!event.nonMembersPay) return 0;
  if (event.guestPrice != null) return decimalToNumber(event.guestPrice);
  return base;
}
