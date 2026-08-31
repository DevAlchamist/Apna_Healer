import { CareSessionStatus, Role, EventStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { featuredEvents, eventDetails, type EventDetail, type EventSummary } from "@/data/events";
import { listPublicClubs } from "@/server/services/club-service";
import {
  getPublicEventBySlug,
  listPublicEvents,
} from "@/server/services/event-service";
import type { ApiEventDetail, ApiPublicEventSummary } from "@/types/api";
import { eventLandingDisplay } from "@/lib/event-landing-display";
import { clubDetails, type ClubDetail } from "@/data/clubs";
import { landingFaq, landingTestimonials } from "@/data/landing-content";
import { listProviders } from "@/server/services/provider-service";
import type { ApiProvider } from "@/types/api";

export type PublicClubSummary = {
  id: string;
  title: string;
  subtitle: string;
  heroImage: string;
  activeMembers: string;
  weeklyEvents: string;
  sphere: string;
};

export type PublicStats = {
  totalMembers: number;
  verifiedTherapists: number;
  verifiedListeners: number;
  completedSessions: number;
  activeTodayLabel: string;
};

const EVENT_FILTER_MAP: Record<
  string,
  (event: { title: string; category: string }) => boolean
> = {
  "all paths": () => true,
  "deep breath": (e) =>
    /breath|breathwork/i.test(e.title) || /breath/i.test(e.category),
  "active flow": (e) => /movement|flow|yoga/i.test(e.title + e.category),
  "mental clarity": (e) => /workshop|resilience|mindful/i.test(e.title + e.category),
  "night rituals": (e) => /sound|sunset|night|immersion/i.test(e.title + e.category),
  "silent retreats": (e) => /retreat|stillness|grief/i.test(e.title + e.category),
};

function categoryForEventId(id: string): string {
  return eventDetails.find((e) => e.id === id)?.category ?? "Gathering";
}

function enrichEventSummary(event: EventSummary): EventSummary & { category: string } {
  return { ...event, category: categoryForEventId(event.id) };
}

export async function getPublicStats(): Promise<PublicStats> {
  const [totalMembers, verifiedTherapists, verifiedListeners, completedSessions] =
    await Promise.all([
      prisma.user.count({ where: { role: { in: [Role.USER, Role.THERAPIST, Role.LISTENER] } } }),
      prisma.user.count({ where: { role: Role.THERAPIST, isVerified: true } }),
      prisma.user.count({ where: { role: Role.LISTENER, isVerified: true } }),
      prisma.careSession.count({ where: { status: CareSessionStatus.COMPLETED } }),
    ]);

  const activeToday = verifiedTherapists + verifiedListeners;
  const activeTodayLabel =
    activeToday >= 1000 ? `${(activeToday / 1000).toFixed(1)}k` : String(activeToday);

  return {
    totalMembers,
    verifiedTherapists,
    verifiedListeners,
    completedSessions,
    activeTodayLabel,
  };
}

type CacheEntry<T> = { data: T; expiresAt: number };
const publicProvidersCache = new Map<string, CacheEntry<ApiProvider[]>>();
const PUBLIC_PROVIDERS_CACHE_TTL_MS = 30_000; // 30 seconds

export function invalidatePublicProvidersCache() {
  publicProvidersCache.clear();
}

export async function getPublicProviders(filters: {
  role?: "THERAPIST" | "LISTENER";
  take?: number;
  query?: string;
}): Promise<ApiProvider[]> {
  const cacheKey = JSON.stringify({
    role: filters.role ?? "ALL",
    take: filters.take ?? 6,
    query: (filters.query ?? "").trim().toLowerCase(),
  });

  const now = Date.now();
  const cached = publicProvidersCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const providers = await listProviders({
    role: filters.role,
    take: filters.take ?? 6,
    query: filters.query,
  });

  publicProvidersCache.set(cacheKey, {
    data: providers,
    expiresAt: now + PUBLIC_PROVIDERS_CACHE_TTL_MS,
  });

  return providers;
}

export async function getPublicEvents(filters: {
  take?: number;
  filter?: string;
  category?: string;
  status?: "PUBLISHED" | "COMPLETED";
}): Promise<Array<EventSummary & { category: string }>> {
  const take = filters.take ?? 12;
  const statusValue =
    filters.status === "COMPLETED" ? EventStatus.COMPLETED : EventStatus.PUBLISHED;
  const fromDb = await listPublicEvents(take * 2, statusValue);
  if (fromDb.length > 0) {
    const filterKey = (filters.filter ?? filters.category ?? "all paths").toLowerCase();
    const predicate = EVENT_FILTER_MAP[filterKey] ?? EVENT_FILTER_MAP["all paths"];
    return fromDb
      .filter((e) => predicate({ title: e.title, category: e.category }))
      .slice(0, take)
      .map(apiPublicToLegacySummary);
  }

  let events = featuredEvents.map(enrichEventSummary);
  const filterKey = (filters.filter ?? filters.category ?? "all paths").toLowerCase();
  const predicate = EVENT_FILTER_MAP[filterKey] ?? EVENT_FILTER_MAP["all paths"];
  events = events.filter(predicate);
  return events.slice(0, take);
}

function apiPublicToLegacySummary(e: ApiPublicEventSummary): EventSummary & { category: string } {
  return {
    id: e.id,
    title: e.title,
    host: e.host,
    description: e.description,
    image: e.image,
    tag: e.tag,
    likes: e.likes,
    category: e.category,
  };
}

function apiDetailToLegacy(event: ApiEventDetail): EventDetail {
  const landing = eventLandingDisplay(event);
  return {
    id: event.slug,
    category: event.category,
    dateLabel: event.dateLabel,
    timeLabel: event.timeLabel,
    venue: event.venue ?? "TBA",
    title: event.title,
    heroImage: event.heroImageUrl ?? "",
    about: landing.about,
    journeyPoints: landing.journeyPoints,
    audienceText: landing.audienceText,
    price: event.basePrice === "0" ? "Free" : `₹${event.basePrice}`,
    seatsLeft: `${event.seatsRemaining} seats left`,
    facilitatorName: landing.facilitatorName,
    facilitatorRole: landing.facilitatorRole,
    facilitatorImage: landing.facilitatorImage,
    facilitatorBio: landing.facilitatorBio,
    testimonialQuote: landing.testimonialQuote,
    testimonialAuthor: landing.testimonialAuthor,
    reflections: [],
    completedImages: event.completedImages ?? [],
    completedVideos: event.completedVideos ?? [],
    status: event.status,
  };
}

export async function getPublicEventById(id: string): Promise<EventDetail | null> {
  const fromDb = await getPublicEventBySlug(id);
  if (fromDb) return apiDetailToLegacy(fromDb);
  return eventDetails.find((e) => e.id === id) ?? null;
}

function clubSphere(club: ClubDetail): string {
  const title = club.title.toLowerCase();
  if (/grief|grace/i.test(title)) return "Grief Support";
  if (/breath/i.test(title)) return "Mindful Movement";
  if (/quiet|anxiety/i.test(title)) return "Anxiety Support";
  if (/stillness|walk/i.test(title)) return "Nature & Stillness";
  return "Community Circle";
}

export async function getPublicClubSummaries(filters: {
  take?: number;
  featured?: boolean;
}): Promise<PublicClubSummary[]> {
  const fromDb = await listPublicClubs();
  if (fromDb.length > 0) {
    let clubs = fromDb.map((c) => ({
      id: c.id,
      title: c.title,
      subtitle: c.subtitle,
      heroImage: c.heroImage,
      activeMembers: c.activeMembers,
      weeklyEvents: c.weeklyEvents,
      sphere: c.sphere,
    }));
    if (filters.featured) clubs = clubs.slice(0, 3);
    return clubs.slice(0, filters.take ?? 12);
  }

  let clubs = clubDetails.map((club) => ({
    id: club.id,
    title: club.title,
    subtitle: club.subtitle,
    heroImage: club.heroImage,
    activeMembers: club.activeMembers,
    weeklyEvents: club.weeklyEvents,
    sphere: clubSphere(club),
  }));
  if (filters.featured) clubs = clubs.slice(0, 3);
  return clubs.slice(0, filters.take ?? 12);
}

export async function getPublicClubById(id: string): Promise<ClubDetail | null> {
  const { getPublicClubBySlug } = await import("@/server/services/club-service");
  const fromDb = await getPublicClubBySlug(id);
  if (fromDb) {
    return {
      id: fromDb.slug,
      title: fromDb.title,
      subtitle: fromDb.subtitle,
      heroImage: fromDb.heroImageUrl ?? "",
      activeMembers: fromDb.memberCountLabel,
      weeklyEvents: "—",
      upcomingCircles: [],
      residentHealers: [],
      reflections: fromDb.reviews.map((r) => ({
        by: r.authorLabel,
        ago: "",
        quote: r.quote,
        likes: 0,
        replies: 0,
      })),
    };
  }
  return clubDetails.find((c) => c.id === id) ?? null;
}

export function getPublicFaq() {
  return landingFaq;
}

export function getPublicTestimonials() {
  return landingTestimonials;
}

export async function getPublicHomeBundle() {
  const [stats, featuredTherapists, listeners, upcomingEvents] = await Promise.all([
    getPublicStats(),
    getPublicProviders({ role: "THERAPIST", take: 6 }),
    getPublicProviders({ role: "LISTENER", take: 12 }),
    getPublicEvents({ take: 4 }),
  ]);

  return {
    stats,
    featuredTherapists,
    listeners,
    upcomingEvents,
    testimonials: getPublicTestimonials(),
    faq: getPublicFaq(),
  };
}

export async function submitContactInquiry(input: {
  name: string;
  email: string;
  message: string;
}) {
  return prisma.contactInquiry.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      message: input.message,
    },
  });
}
