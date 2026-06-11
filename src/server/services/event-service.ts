import {
  ClubMembershipRole,
  ClubMembershipStatus,
  ClubStatus,
  Prisma,
  Role,
  WellnessEventStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import { APNA_HEALER_FACILITATOR } from "@/lib/event-facilitator";
import type { createEventSchema, updateEventSchema } from "@/lib/validators/event";
import {
  decimalToNumber,
  formatEventDateLabel,
  formatEventTimeLabel,
  resolveRegistrationPrice,
  uniqueEventSlug,
} from "@/server/services/event-utils";
import type {
  ApiEventDetail,
  ApiEventFacilitatorOption,
  ApiEventRegistration,
  ApiEventSummary,
  ApiPublicEventSummary,
} from "@/types/api";
import type { z } from "zod";

type CreateEventInput = z.infer<typeof createEventSchema>;
type UpdateEventInput = z.infer<typeof updateEventSchema>;

const eventInclude = {
  club: { select: { id: true, slug: true, title: true, ownerUserId: true } },
  organizedBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.WellnessEventInclude;

export async function isActiveClubMember(userId: string, clubId: string | null) {
  if (!clubId) return false;
  const m = await prisma.clubMembership.findUnique({
    where: { clubId_userId: { clubId, userId } },
  });
  return m?.status === ClubMembershipStatus.ACTIVE;
}

export async function assertCanManageEvent(
  event: { clubId: string | null; club?: { ownerUserId: string | null } | null },
  actorId: string,
  actorRole: Role,
) {
  if (actorRole === Role.ADMIN) return;
  if (!event.clubId) {
    throw new ApiError(403, "Only admins can manage platform events.", "FORBIDDEN");
  }
  if (event.club?.ownerUserId === actorId) return;
  const mod = await prisma.clubMembership.findFirst({
    where: {
      clubId: event.clubId,
      userId: actorId,
      role: { in: [ClubMembershipRole.OWNER, ClubMembershipRole.MODERATOR] },
      status: ClubMembershipStatus.ACTIVE,
    },
  });
  if (!mod) {
    throw new ApiError(403, "You cannot manage this event.", "FORBIDDEN");
  }
}

function mapSummary(
  event: Prisma.WellnessEventGetPayload<{ include: typeof eventInclude }>,
  viewer?: {
    userId: string;
    isRegistered: boolean;
    priceForMe: number;
    canManage: boolean;
  },
): ApiEventSummary {
  const host =
    event.facilitatorName ??
    event.organizedBy.name ??
    event.club?.title ??
    "Apna Healer";
  return {
    id: event.id,
    slug: event.slug,
    clubId: event.clubId,
    clubSlug: event.club?.slug ?? null,
    clubTitle: event.club?.title ?? null,
    title: event.title,
    subtitle: event.subtitle,
    host,
    excerpt: event.description?.slice(0, 220) ?? event.subtitle ?? "",
    heroImageUrl: event.heroImageUrl,
    category: event.category ?? "Gathering",
    startsAt: event.startsAt.toISOString(),
    dateLabel: formatEventDateLabel(event.startsAt),
    timeLabel: formatEventTimeLabel(event.startsAt),
    venue: event.venue,
    mode: event.mode,
    capacity: event.capacity,
    seatsRemaining: event.seatsRemaining,
    basePrice: decimalToNumber(event.basePrice).toString(),
    priceForMe: viewer?.priceForMe ?? decimalToNumber(event.basePrice),
    membersPay: event.membersPay,
    nonMembersPay: event.nonMembersPay,
    status: event.status,
    isRegistered: viewer?.isRegistered ?? false,
    canManage: viewer?.canManage ?? false,
  };
}

function mapDetail(
  event: Prisma.WellnessEventGetPayload<{ include: typeof eventInclude }>,
  viewer?: {
    userId: string;
    isRegistered: boolean;
    priceForMe: number;
    canManage: boolean;
    myRegistration?: ApiEventRegistration | null;
  },
): ApiEventDetail {
  return {
    ...mapSummary(event, viewer),
    description: event.description,
    endsAt: event.endsAt?.toISOString() ?? null,
    memberPrice: event.memberPrice != null ? decimalToNumber(event.memberPrice).toString() : null,
    guestPrice: event.guestPrice != null ? decimalToNumber(event.guestPrice).toString() : null,
    facilitatorName: event.facilitatorName,
    facilitatorRole: event.facilitatorRole,
    facilitatorImage: event.facilitatorImage,
    facilitatorBio: event.facilitatorBio,
    journeyPoints: event.journeyPoints ?? [],
    audienceText: event.audienceText,
    testimonialQuote: event.testimonialQuote,
    testimonialAuthor: event.testimonialAuthor,
    organizedByUserId: event.organizedByUserId,
    myRegistration: viewer?.myRegistration ?? null,
  };
}

export async function getEventBySlug(slug: string) {
  const event = await prisma.wellnessEvent.findUnique({
    where: { slug },
    include: eventInclude,
  });
  if (!event) {
    throw new ApiError(404, "Event was not found.", "EVENT_NOT_FOUND");
  }
  return event;
}

export async function getEventById(id: string) {
  const event = await prisma.wellnessEvent.findUnique({
    where: { id },
    include: eventInclude,
  });
  if (!event) {
    throw new ApiError(404, "Event was not found.", "EVENT_NOT_FOUND");
  }
  return event;
}

async function viewerContext(userId: string, actorRole: Role, event: Awaited<ReturnType<typeof getEventBySlug>>) {
  const isMember = await isActiveClubMember(userId, event.clubId);
  const priceForMe = resolveRegistrationPrice(event, isMember);
  const reg = await prisma.eventRegistration.findUnique({
    where: { eventId_userId: { eventId: event.id, userId } },
  });
  const isRegistered = reg?.status === "CONFIRMED";
  let canManage = actorRole === Role.ADMIN;
  if (!canManage && event.clubId) {
    try {
      await assertCanManageEvent(event, userId, actorRole);
      canManage = true;
    } catch {
      canManage = false;
    }
  }
  return {
    userId,
    isRegistered,
    priceForMe,
    canManage,
    myRegistration: reg
      ? {
          id: reg.id,
          status: reg.status,
          amountCharged: decimalToNumber(reg.amountCharged).toString(),
          createdAt: reg.createdAt.toISOString(),
        }
      : null,
  };
}

export async function listPublicEvents(take = 12): Promise<ApiPublicEventSummary[]> {
  const events = await prisma.wellnessEvent.findMany({
    where: { status: WellnessEventStatus.PUBLISHED },
    include: eventInclude,
    orderBy: { startsAt: "asc" },
    take,
  });
  return events.map((e) => ({
    id: e.slug,
    title: e.title,
    host: e.facilitatorName ?? e.organizedBy.name ?? e.club?.title ?? "Apna Healer",
    description: e.subtitle ?? e.description?.slice(0, 160) ?? "",
    image: e.heroImageUrl ?? "",
    tag: formatEventDateLabel(e.startsAt),
    likes: 0,
    category: e.category ?? "Gathering",
  }));
}

export async function getPublicEventBySlug(slug: string) {
  const event = await prisma.wellnessEvent.findFirst({
    where: { slug, status: WellnessEventStatus.PUBLISHED },
    include: eventInclude,
  });
  if (!event) return null;
  return mapDetail(event, {
    userId: "",
    isRegistered: false,
    priceForMe: decimalToNumber(event.basePrice),
    canManage: false,
  });
}

export async function listEventsForUser(
  userId: string,
  actorRole: Role,
  filters: { query?: string; clubId?: string; take?: number; cursor?: string },
) {
  const take = filters.take ?? 24;
  const where: Prisma.WellnessEventWhereInput = {
    status: WellnessEventStatus.PUBLISHED,
  };
  if (filters.clubId) where.clubId = filters.clubId;
  if (filters.query?.trim()) {
    const q = filters.query.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { subtitle: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
    ];
  }

  const items = await prisma.wellnessEvent.findMany({
    where,
    include: eventInclude,
    orderBy: { startsAt: "asc" },
    take: take + 1,
    ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
  });

  const hasMore = items.length > take;
  const page = hasMore ? items.slice(0, take) : items;

  const enriched = await Promise.all(
    page.map(async (event) => {
      const ctx = await viewerContext(userId, actorRole, event);
      return mapSummary(event, ctx);
    }),
  );

  return {
    items: enriched,
    meta: {
      total: await prisma.wellnessEvent.count({ where }),
      take,
      nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
    },
  };
}

export async function getEventDetailForUser(slug: string, userId: string, actorRole: Role) {
  const event = await getEventBySlug(slug);
  if (event.status !== WellnessEventStatus.PUBLISHED && actorRole !== Role.ADMIN) {
    const ctx = await viewerContext(userId, actorRole, event);
    if (!ctx.canManage) {
      throw new ApiError(404, "Event was not found.", "EVENT_NOT_FOUND");
    }
  }
  const ctx = await viewerContext(userId, actorRole, event);
  return mapDetail(event, ctx);
}

export async function listEventsForClub(clubId: string) {
  const events = await prisma.wellnessEvent.findMany({
    where: { clubId },
    include: eventInclude,
    orderBy: { startsAt: "desc" },
  });
  return events.map((e) =>
    mapSummary(e, {
      userId: "",
      isRegistered: false,
      priceForMe: 0,
      canManage: false,
    }),
  );
}

export async function listEventsAdmin(filters?: { status?: WellnessEventStatus }) {
  const events = await prisma.wellnessEvent.findMany({
    where: filters?.status ? { status: filters.status } : {},
    include: eventInclude,
    orderBy: { startsAt: "desc" },
    take: 100,
  });
  return events.map((e) =>
    mapDetail(e, {
      userId: "",
      isRegistered: false,
      priceForMe: 0,
      canManage: true,
    }),
  );
}

export async function createEvent(
  actorId: string,
  actorRole: Role,
  input: CreateEventInput,
) {
  if (input.clubId && actorRole !== Role.ADMIN) {
    await assertCanManageEvent({ clubId: input.clubId, club: await prisma.club.findUnique({ where: { id: input.clubId } }) }, actorId, actorRole);
  }

  const slug = await uniqueEventSlug(input.title, async (s) => {
    const row = await prisma.wellnessEvent.findUnique({ where: { slug: s } });
    return row != null;
  });

  const status = input.status ?? WellnessEventStatus.PUBLISHED;

  const event = await prisma.wellnessEvent.create({
    data: {
      slug,
      clubId: input.clubId ?? null,
      createdByUserId: actorId,
      organizedByUserId: input.organizedByUserId ?? actorId,
      title: input.title,
      subtitle: input.subtitle ?? null,
      description: input.description ?? null,
      category: input.category ?? null,
      heroImageUrl: input.heroImageUrl ?? null,
      startsAt: input.startsAt,
      endsAt: input.endsAt ?? null,
      venue: input.venue ?? null,
      mode: input.mode ?? "IN_PERSON",
      capacity: input.capacity,
      seatsRemaining: input.capacity,
      basePrice: input.basePrice ?? 0,
      memberPrice: input.memberPrice ?? null,
      guestPrice: input.guestPrice ?? null,
      membersPay: input.membersPay ?? true,
      nonMembersPay: input.nonMembersPay ?? true,
      status,
      facilitatorName: input.facilitatorName ?? null,
      facilitatorRole: input.facilitatorRole ?? null,
      facilitatorImage: input.facilitatorImage ?? null,
      facilitatorBio: input.facilitatorBio ?? null,
      journeyPoints: input.journeyPoints ?? [],
      audienceText: input.audienceText ?? null,
      testimonialQuote: input.testimonialQuote ?? null,
      testimonialAuthor: input.testimonialAuthor ?? null,
    },
    include: eventInclude,
  });

  return mapDetail(event, {
    userId: actorId,
    isRegistered: false,
    priceForMe: 0,
    canManage: true,
  });
}

export async function updateEvent(
  eventId: string,
  actorId: string,
  actorRole: Role,
  input: UpdateEventInput,
) {
  const existing = await getEventById(eventId);
  await assertCanManageEvent(existing, actorId, actorRole);

  if (input.capacity != null && input.capacity < existing.capacity - existing.seatsRemaining) {
    throw new ApiError(400, "Capacity cannot be less than already registered seats.", "INVALID_CAPACITY");
  }

  const seatsDelta =
    input.capacity != null ? input.capacity - existing.capacity : 0;

  await prisma.wellnessEvent.update({
    where: { id: eventId },
    data: {
      ...(input.title != null ? { title: input.title } : {}),
      ...(input.subtitle !== undefined ? { subtitle: input.subtitle } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.heroImageUrl !== undefined ? { heroImageUrl: input.heroImageUrl } : {}),
      ...(input.startsAt != null ? { startsAt: input.startsAt } : {}),
      ...(input.endsAt !== undefined ? { endsAt: input.endsAt } : {}),
      ...(input.venue !== undefined ? { venue: input.venue } : {}),
      ...(input.mode != null ? { mode: input.mode } : {}),
      ...(input.capacity != null
        ? { capacity: input.capacity, seatsRemaining: { increment: seatsDelta } }
        : {}),
      ...(input.basePrice != null ? { basePrice: input.basePrice } : {}),
      ...(input.memberPrice !== undefined ? { memberPrice: input.memberPrice } : {}),
      ...(input.guestPrice !== undefined ? { guestPrice: input.guestPrice } : {}),
      ...(input.membersPay != null ? { membersPay: input.membersPay } : {}),
      ...(input.nonMembersPay != null ? { nonMembersPay: input.nonMembersPay } : {}),
      ...(input.status != null ? { status: input.status } : {}),
      ...(input.facilitatorName !== undefined ? { facilitatorName: input.facilitatorName } : {}),
      ...(input.facilitatorRole !== undefined ? { facilitatorRole: input.facilitatorRole } : {}),
      ...(input.facilitatorImage !== undefined ? { facilitatorImage: input.facilitatorImage } : {}),
      ...(input.facilitatorBio !== undefined ? { facilitatorBio: input.facilitatorBio } : {}),
      ...(input.journeyPoints !== undefined ? { journeyPoints: input.journeyPoints } : {}),
      ...(input.audienceText !== undefined ? { audienceText: input.audienceText } : {}),
      ...(input.testimonialQuote !== undefined ? { testimonialQuote: input.testimonialQuote } : {}),
      ...(input.testimonialAuthor !== undefined ? { testimonialAuthor: input.testimonialAuthor } : {}),
    },
  });

  return getEventById(eventId).then((e) =>
    mapDetail(e, {
      userId: actorId,
      isRegistered: false,
      priceForMe: 0,
      canManage: true,
    }),
  );
}

export async function listEventFacilitatorOptions(): Promise<ApiEventFacilitatorOption[]> {
  const clubs = await prisma.club.findMany({
    where: {
      ownerUserId: { not: null },
      status: { in: [ClubStatus.ACTIVE, ClubStatus.DRAFT] },
    },
    select: {
      title: true,
      ownerUserId: true,
      owner: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { title: "asc" },
  });

  const byOwner = new Map<
    string,
    { name: string; role: string; imageUrl: string | null; clubTitles: string[] }
  >();

  for (const club of clubs) {
    if (!club.ownerUserId || !club.owner) continue;
    const displayName = club.owner.name?.trim() || club.owner.email;
    const existing = byOwner.get(club.ownerUserId);
    if (existing) {
      existing.clubTitles.push(club.title);
      continue;
    }
    byOwner.set(club.ownerUserId, {
      name: displayName,
      role: "Club owner",
      imageUrl: club.owner.image,
      clubTitles: [club.title],
    });
  }

  const ownerOptions: ApiEventFacilitatorOption[] = Array.from(byOwner.entries())
    .map(([userId, row]) => {
      const clubsLabel =
        row.clubTitles.length === 1
          ? row.clubTitles[0]
          : `${row.clubTitles.slice(0, 2).join(", ")}${row.clubTitles.length > 2 ? "…" : ""}`;
      return {
        id: `owner:${userId}`,
        type: "club-owner" as const,
        label: `${row.name} (${clubsLabel})`,
        name: row.name,
        role: row.role,
        imageUrl: row.imageUrl,
        clubTitles: row.clubTitles,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  return [
    {
      id: APNA_HEALER_FACILITATOR.id,
      type: "apna-healer",
      label: APNA_HEALER_FACILITATOR.name,
      name: APNA_HEALER_FACILITATOR.name,
      role: APNA_HEALER_FACILITATOR.role,
      imageUrl: APNA_HEALER_FACILITATOR.imageUrl,
      clubTitles: [],
    },
    ...ownerOptions,
  ];
}

export { mapDetail, mapSummary, resolveRegistrationPrice };
