import {
  ClubMembershipStatus,
  ClubStatus,
  ClubVisibility,
  Prisma,
  Role,
  WellnessEventStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import type { createClubSchema, updateClubSchema } from "@/lib/validators/club";
import {
  decimalToString,
  formatMemberCount,
  inferSphere,
  uniqueClubSlug,
  type ClubWithRelations,
  type OnboardingStepInput,
} from "@/server/services/club-utils";
import {
  formatEventDateLabel,
  formatEventTimeLabel,
} from "@/server/services/event-utils";
import type {
  ApiClubDetail,
  ApiClubMembershipSummary,
  ApiClubSummary,
  ApiPublicClubDetail,
  ApiPublicClubSummary,
} from "@/types/api";
import type { z } from "zod";

type CreateClubInput = z.infer<typeof createClubSchema>;
type UpdateClubInput = z.infer<typeof updateClubSchema>;

const clubInclude = {
  onboardingSteps: { orderBy: { sortOrder: "asc" as const } },
  reviews: { orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.ClubInclude;

function mapPublicSummary(club: ClubWithRelations): ApiPublicClubSummary {
  return {
    id: club.slug,
    title: club.title,
    subtitle: club.subtitle,
    heroImage: club.heroImageUrl ?? "",
    activeMembers: formatMemberCount(club.memberCount),
    weeklyEvents: "—",
    sphere: inferSphere(club.title),
  };
}

function mapSummary(
  club: ClubWithRelations,
  viewer?: { userId: string; isMember: boolean; hasPendingJoin: boolean },
): ApiClubSummary {
  return {
    id: club.id,
    slug: club.slug,
    title: club.title,
    subtitle: club.subtitle,
    heroImageUrl: club.heroImageUrl,
    monthlyFee: decimalToString(club.monthlyFee),
    memberCount: club.memberCount,
    memberCountLabel: formatMemberCount(club.memberCount),
    sphere: inferSphere(club.title),
    visibility: club.visibility,
    status: club.status,
    isMember: viewer?.isMember ?? false,
    hasPendingJoin: viewer?.hasPendingJoin ?? false,
    ownerUserId: club.ownerUserId,
  };
}

function mapDetail(
  club: ClubWithRelations,
  viewer?: {
    userId: string;
    isMember: boolean;
    hasPendingJoin: boolean;
    membership?: ApiClubMembershipSummary | null;
  },
): ApiClubDetail {
  const gallery = Array.isArray(club.galleryUrls)
    ? (club.galleryUrls as string[])
    : [];
  return {
    ...mapSummary(club, viewer),
    description: club.description,
    purpose: club.purpose,
    galleryUrls: gallery,
    onboardingSteps: club.onboardingSteps.map((s) => ({
      id: s.id,
      question: s.question,
      required: s.required,
      sortOrder: s.sortOrder,
    })),
    reviews: club.reviews.map((r) => ({
      id: r.id,
      authorLabel: r.authorLabel,
      quote: r.quote,
      rating: r.rating,
      sortOrder: r.sortOrder,
    })),
    membership: viewer?.membership ?? null,
    isOwner: club.ownerUserId === viewer?.userId,
    canManageJoinRequests:
      viewer?.userId != null &&
      (club.ownerUserId === viewer.userId),
  };
}

async function syncOnboardingSteps(
  clubId: string,
  steps: OnboardingStepInput[],
) {
  await prisma.clubOnboardingStep.deleteMany({ where: { clubId } });
  if (steps.length === 0) return;
  await prisma.clubOnboardingStep.createMany({
    data: steps.map((s, i) => ({
      clubId,
      question: s.question,
      required: s.required !== false,
      sortOrder: s.sortOrder ?? i,
    })),
  });
}

async function syncReviews(
  clubId: string,
  reviews: CreateClubInput["reviews"],
) {
  await prisma.clubReview.deleteMany({ where: { clubId } });
  if (!reviews?.length) return;
  await prisma.clubReview.createMany({
    data: reviews.map((r, i) => ({
      clubId,
      authorLabel: r.authorLabel,
      quote: r.quote,
      rating: r.rating ?? null,
      sortOrder: r.sortOrder ?? i,
    })),
  });
}

export async function getViewerClubState(userId: string, clubId: string) {
  const [membership, pendingJoin] = await Promise.all([
    prisma.clubMembership.findUnique({
      where: { clubId_userId: { clubId, userId } },
    }),
    prisma.clubJoinRequest.findFirst({
      where: { clubId, userId, status: "PENDING" },
    }),
  ]);
  const isMember =
    membership != null &&
    membership.status !== ClubMembershipStatus.LEFT;
  return {
    isMember,
    hasPendingJoin: pendingJoin != null,
    membership,
  };
}

export async function listPublicClubs(): Promise<ApiPublicClubSummary[]> {
  const clubs = await prisma.club.findMany({
    where: { status: ClubStatus.ACTIVE, visibility: ClubVisibility.PUBLIC },
    include: clubInclude,
    orderBy: { memberCount: "desc" },
  });
  return clubs.map(mapPublicSummary);
}

export async function getPublicClubBySlug(slug: string): Promise<ApiClubDetail | null> {
  const detail = await getPublicClubDetailBySlug(slug);
  return detail;
}

export async function getPublicClubDetailBySlug(
  slug: string,
): Promise<ApiPublicClubDetail | null> {
  const club = await prisma.club.findFirst({
    where: { slug, status: ClubStatus.ACTIVE, visibility: ClubVisibility.PUBLIC },
    include: clubInclude,
  });
  if (!club) return null;

  const now = new Date();
  const weekAhead = new Date(now);
  weekAhead.setDate(weekAhead.getDate() + 7);

  const [events, weeklyCount] = await Promise.all([
    prisma.wellnessEvent.findMany({
      where: { clubId: club.id, status: WellnessEventStatus.PUBLISHED, startsAt: { gte: now } },
      include: {
        organizedBy: { select: { name: true } },
        club: { select: { title: true } },
      },
      orderBy: { startsAt: "asc" },
      take: 6,
    }),
    prisma.wellnessEvent.count({
      where: {
        clubId: club.id,
        status: WellnessEventStatus.PUBLISHED,
        startsAt: { gte: now, lte: weekAhead },
      },
    }),
  ]);

  const base = mapDetail(club);

  return {
    ...base,
    weeklyEventsLabel: weeklyCount > 0 ? `${weeklyCount} this week` : "Circles forming soon",
    events: events.map((e) => ({
      slug: e.slug,
      title: e.title,
      description: e.subtitle ?? e.description?.slice(0, 140) ?? "",
      host: e.facilitatorName ?? e.organizedBy.name ?? club.title,
      tag: `${formatEventDateLabel(e.startsAt)} · ${formatEventTimeLabel(e.startsAt)}`,
      image:
        e.heroImageUrl ??
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e7b?w=800&q=80&auto=format&fit=crop",
      startsAt: e.startsAt.toISOString(),
      seatsRemaining: e.seatsRemaining,
      mode: e.mode === "VIRTUAL" ? "Virtual" : "In person",
    })),
  };
}

export async function listClubsForUser(
  userId: string,
  filters: { query?: string; take?: number; cursor?: string },
) {
  const take = filters.take ?? 24;
  const where: Prisma.ClubWhereInput = {
    status: ClubStatus.ACTIVE,
    OR: [
      { visibility: ClubVisibility.PUBLIC },
      {
        memberships: {
          some: { userId, status: { not: ClubMembershipStatus.LEFT } },
        },
      },
    ],
  };
  if (filters.query?.trim()) {
    const q = filters.query.trim();
    where.AND = [
      {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { subtitle: { contains: q, mode: "insensitive" } },
          { purpose: { contains: q, mode: "insensitive" } },
        ],
      },
    ];
  }

  const items = await prisma.club.findMany({
    where,
    include: clubInclude,
    orderBy: { memberCount: "desc" },
    take: take + 1,
    ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
  });

  const hasMore = items.length > take;
  const page = hasMore ? items.slice(0, take) : items;

  const enriched = await Promise.all(
    page.map(async (club) => {
      const state = await getViewerClubState(userId, club.id);
      return mapSummary(club, {
        userId,
        isMember: state.isMember,
        hasPendingJoin: state.hasPendingJoin,
      });
    }),
  );

  return {
    items: enriched,
    meta: {
      total: await prisma.club.count({ where }),
      take,
      nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
    },
  };
}

export async function getClubBySlugForUser(userId: string, slug: string) {
  const club = await prisma.club.findFirst({
    where: {
      slug,
      status: { in: [ClubStatus.ACTIVE, ClubStatus.DRAFT] },
    },
    include: clubInclude,
  });
  if (!club) {
    throw new ApiError(404, "Club was not found.", "CLUB_NOT_FOUND");
  }
  if (club.status !== ClubStatus.ACTIVE && club.ownerUserId !== userId) {
    throw new ApiError(404, "Club was not found.", "CLUB_NOT_FOUND");
  }
  const state = await getViewerClubState(userId, club.id);
  let membershipSummary: ApiClubMembershipSummary | null = null;
  if (state.membership && state.membership.status !== ClubMembershipStatus.LEFT) {
    membershipSummary = {
      id: state.membership.id,
      role: state.membership.role,
      status: state.membership.status,
      joinedAt: state.membership.joinedAt.toISOString(),
      nextBillingAt: state.membership.nextBillingAt?.toISOString() ?? null,
    };
  }
  return mapDetail(club, {
    userId,
    isMember: state.isMember,
    hasPendingJoin: state.hasPendingJoin,
    membership: membershipSummary,
  });
}

export async function getClubById(clubId: string) {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: clubInclude,
  });
  if (!club) {
    throw new ApiError(404, "Club was not found.", "CLUB_NOT_FOUND");
  }
  return club;
}

export async function listClubsAdmin(filters: { status?: ClubStatus; take?: number }) {
  const take = filters.take ?? 100;
  const clubs = await prisma.club.findMany({
    where: filters.status ? { status: filters.status } : {},
    include: {
      ...clubInclude,
      _count: { select: { events: true } },
    },
    orderBy: { updatedAt: "desc" },
    take,
  });
  return clubs.map((c) => ({
    ...mapDetail(c),
    eventCount: c._count.events,
  }));
}

export async function createClub(
  actorId: string,
  input: CreateClubInput,
  options?: { asAdmin?: boolean },
) {
  const slug = await uniqueClubSlug(input.title, async (s) => {
    const existing = await prisma.club.findUnique({ where: { slug: s } });
    return existing != null;
  });

  const club = await prisma.$transaction(async (tx) => {
    const created = await tx.club.create({
      data: {
        slug,
        title: input.title,
        subtitle: input.subtitle,
        description: input.description ?? null,
        purpose: input.purpose ?? null,
        heroImageUrl: input.heroImageUrl ?? null,
        galleryUrls: input.galleryUrls ?? [],
        monthlyFee: input.monthlyFee,
        status: options?.asAdmin ? ClubStatus.ACTIVE : ClubStatus.DRAFT,
        visibility: input.visibility ?? ClubVisibility.PUBLIC,
        createdByUserId: actorId,
        ownerUserId: input.ownerUserId ?? (options?.asAdmin ? null : actorId),
      },
    });

    if (input.onboardingSteps?.length) {
      await tx.clubOnboardingStep.createMany({
        data: input.onboardingSteps.map((s, i) => ({
          clubId: created.id,
          question: s.question,
          required: s.required !== false,
          sortOrder: s.sortOrder ?? i,
        })),
      });
    }

    if (input.reviews?.length) {
      await tx.clubReview.createMany({
        data: input.reviews.map((r, i) => ({
          clubId: created.id,
          authorLabel: r.authorLabel,
          quote: r.quote,
          rating: r.rating ?? null,
          sortOrder: r.sortOrder ?? i,
        })),
      });
    }

    return created;
  });

  return prisma.club.findUniqueOrThrow({
    where: { id: club.id },
    include: clubInclude,
  });
}

export async function updateClub(clubId: string, input: UpdateClubInput) {
  const existing = await getClubById(clubId);

  if (input.slug && input.slug !== existing.slug) {
    const taken = await prisma.club.findUnique({ where: { slug: input.slug } });
    if (taken && taken.id !== clubId) {
      throw new ApiError(409, "Slug is already in use.", "SLUG_TAKEN");
    }
  }

  await prisma.club.update({
    where: { id: clubId },
    data: {
      ...(input.title != null ? { title: input.title } : {}),
      ...(input.subtitle != null ? { subtitle: input.subtitle } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.purpose !== undefined ? { purpose: input.purpose } : {}),
      ...(input.heroImageUrl !== undefined ? { heroImageUrl: input.heroImageUrl } : {}),
      ...(input.galleryUrls != null ? { galleryUrls: input.galleryUrls } : {}),
      ...(input.monthlyFee != null ? { monthlyFee: input.monthlyFee } : {}),
      ...(input.visibility != null ? { visibility: input.visibility } : {}),
      ...(input.status != null ? { status: input.status } : {}),
      ...(input.slug != null ? { slug: input.slug } : {}),
      ...(input.ownerUserId !== undefined ? { ownerUserId: input.ownerUserId } : {}),
    },
  });

  if (input.onboardingSteps) {
    await syncOnboardingSteps(clubId, input.onboardingSteps);
  }
  if (input.reviews) {
    await syncReviews(clubId, input.reviews);
  }

  return getClubById(clubId);
}

export async function assertCanManageClub(
  clubId: string,
  actorId: string,
  actorRole: Role,
) {
  if (actorRole === Role.ADMIN) return getClubById(clubId);
  const club = await getClubById(clubId);
  if (club.ownerUserId !== actorId) {
    throw new ApiError(403, "You cannot manage this club.", "FORBIDDEN");
  }
  return club;
}

export async function incrementMemberCount(clubId: string, delta: number) {
  await prisma.club.update({
    where: { id: clubId },
    data: { memberCount: { increment: delta } },
  });
}

export { mapDetail, mapPublicSummary, mapSummary };
