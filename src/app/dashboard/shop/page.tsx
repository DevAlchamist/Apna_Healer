"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useBookSessionModal } from "@/components/dashboard/book-session-modal";
import { ContentGridSkeleton } from "@/components/skeletons";
import { FadeIn, hoverLiftTransition, morphTransition } from "@/components/ui/fade-in";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, formatDateTime, formatShortDate, toSentenceCase } from "@/lib/display";
import type { ApiBooking, ApiCareSession, ApiProvider, ApiUser } from "@/types/api";
import { wellnessPackages } from "@/data/packages";

function isProviderRole(role?: ApiUser["role"]) {
  return role === "THERAPIST" || role === "LISTENER";
}

function getInitials(name?: string | null) {
  const source = name?.trim() || "AH";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type ShopActionCard =
  | {
      kind: "link";
      title: string;
      detail: string;
      href: string;
      cta: string;
    }
  | {
      kind: "action";
      title: string;
      detail: string;
      action: () => void;
      cta: string;
    };

export default function ShopPage() {
  const { open: openBookSession } = useBookSessionModal();

  const userQuery = useQuery({
    queryKey: ["user-me"],
    queryFn: () => apiFetch<ApiUser>("/api/users/me"),
  });

  const providerView = isProviderRole(userQuery.data?.role);
  const bookingScope = providerView ? "provider" : "requester";
  const sessionScope = providerView ? "provider" : "participant";

  const bookingsQuery = useQuery({
    queryKey: ["shop-bookings", bookingScope],
    queryFn: () => apiFetch<ApiBooking[]>(`/api/bookings?scope=${bookingScope}&take=12`),
    enabled: !!userQuery.data,
  });

  const sessionsQuery = useQuery({
    queryKey: ["shop-sessions", sessionScope],
    queryFn: () => apiFetch<ApiCareSession[]>(`/api/sessions?scope=${sessionScope}&take=12`),
    enabled: !!userQuery.data,
  });

  const providersQuery = useQuery({
    queryKey: ["shop-providers"],
    queryFn: () => apiFetch<ApiProvider[]>("/api/providers?take=12"),
  });

  const user = userQuery.data;
  const bookings = useMemo(() => bookingsQuery.data ?? [], [bookingsQuery.data]);
  const sessions = useMemo(() => sessionsQuery.data ?? [], [sessionsQuery.data]);
  const providers = useMemo(() => providersQuery.data ?? [], [providersQuery.data]);

  const upcomingSessionsCount = sessions.filter((session) => session.status === "UPCOMING").length;
  const completedSessionsCount = sessions.filter((session) => session.status === "COMPLETED").length;
  const pendingBookingsCount = bookings.filter((booking) => booking.status === "PENDING").length;

  const featuredPackage = useMemo(() => {
    if (completedSessionsCount >= 2) {
      return wellnessPackages.find((entry) => entry.id === "deep-healing-journey") ?? wellnessPackages[0];
    }

    if (pendingBookingsCount > 0 || upcomingSessionsCount > 0) {
      return (
        wellnessPackages.find((entry) => entry.id === "self-care-essentials") ??
        wellnessPackages[0]
      );
    }

    return (
      wellnessPackages.find((entry) => entry.id === "mindfulness-starter-pack") ??
      wellnessPackages[0]
    );
  }, [completedSessionsCount, pendingBookingsCount, upcomingSessionsCount]);

  const suggestedProviders = useMemo(
    () =>
      providers
        .filter((provider) => provider.id !== user?.id)
        .sort((left, right) => {
          const leftPriority = left.nextAvailabilityDate ? 1 : 0;
          const rightPriority = right.nextAvailabilityDate ? 1 : 0;
          return rightPriority - leftPriority;
        })
        .slice(0, 3),
    [providers, user?.id],
  );

  const stats = useMemo(
    () => [
      {
        label: "Wallet Ready",
        value: formatCurrency(user?.wallet?.availableBalance),
        meta: `${formatCurrency(user?.wallet?.heldBalance)} held`,
      },
      {
        label: providerView ? "Active Queue" : "Active Care Items",
        value: String(bookings.length + sessions.length),
        meta: `${pendingBookingsCount} pending requests`,
      },
      {
        label: "Upcoming Sessions",
        value: String(upcomingSessionsCount),
        meta: `${completedSessionsCount} completed`,
      },
      {
        label: "Live Provider Directory",
        value: String(providers.filter((provider) => !!provider.nextAvailabilityDate).length),
        meta: `${providers.length} verified providers loaded`,
      },
    ],
    [
      bookings.length,
      completedSessionsCount,
      pendingBookingsCount,
      providerView,
      providers,
      sessions.length,
      upcomingSessionsCount,
      user?.wallet?.availableBalance,
      user?.wallet?.heldBalance,
    ],
  );

  const actionCards = useMemo<ShopActionCard[]>(
    () =>
      providerView
        ? [
            {
              kind: "link",
              title: "Open provider consultations",
              detail: `${pendingBookingsCount} pending requests currently need provider movement.`,
              href: "/dashboard/consultations",
              cta: "Go to consultations",
            },
            {
              kind: "link",
              title: "Review wallet posture",
              detail: `${formatCurrency(user?.wallet?.availableBalance)} remains available for payouts and platform movement.`,
              href: "/dashboard/wallet",
              cta: "Open wallet",
            },
            {
              kind: "link",
              title: "Share curated bundles with members",
              detail: "Use the package catalog as a lightweight recommendation layer while deeper commerce is still evolving.",
              href: "/dashboard/packages",
              cta: "Open package catalog",
            },
          ]
        : [
            {
              kind: "action",
              title: "Book a live provider now",
              detail: `${providers.filter((provider) => !!provider.nextAvailabilityDate).length} verified providers currently expose open availability.`,
              action: () => openBookSession({ preferredRole: "THERAPIST" }),
              cta: "Launch booking flow",
            },
            {
              kind: "link",
              title: "Explore care bundles",
              detail: "Review the existing package catalog and decide which journey matches your current state.",
              href: "/dashboard/packages",
              cta: "Open packages",
            },
            {
              kind: "link",
              title: "Top up before your next step",
              detail: `${formatCurrency(user?.wallet?.availableBalance)} is currently available for session holds and wallet-backed actions.`,
              href: "/dashboard/wallet",
              cta: "Open wallet",
            },
          ],
    [
      openBookSession,
      pendingBookingsCount,
      providerView,
      providers,
      user?.wallet?.availableBalance,
    ],
  );

  const queryError =
    userQuery.error?.message ??
    bookingsQuery.error?.message ??
    sessionsQuery.error?.message ??
    providersQuery.error?.message;

  const isPageLoading =
    userQuery.isLoading ||
    bookingsQuery.isLoading ||
    sessionsQuery.isLoading ||
    providersQuery.isLoading;

  if (isPageLoading) {
    return (
      <FadeIn className="space-y-8 md:space-y-10">
        <ContentGridSkeleton count={6} columns={3} />
      </FadeIn>
    );
  }

  return (
    <FadeIn className="space-y-8 md:space-y-10">
      <motion.header
        className="space-y-4"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={morphTransition}
      >
        <motion.h1
          className="font-display text-4xl font-semibold text-text-secondary md:text-5xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...morphTransition, delay: 0.04 }}
        >
          Shop
        </motion.h1>
        <motion.p
          className="max-w-3xl text-lg leading-relaxed text-text-primary/75"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...morphTransition, delay: 0.1 }}
        >
          {providerView
            ? "Use the marketplace as a live overview of member-facing bundles, wallet posture, and provider discovery signals you can act on right away."
            : "Use the marketplace to understand your wallet readiness, discover live providers, and browse curated care bundles that fit your current journey."}
        </motion.p>
      </motion.header>

      {queryError ? (
        <div className="rounded-calm bg-white px-6 py-5 text-sm font-medium text-theme-status-error shadow-soft">
          {queryError}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((card, index) => (
          <motion.article
            key={card.label}
            className="rounded-calm border border-accent/70 bg-white p-5 shadow-soft"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...morphTransition, delay: 0.05 + index * 0.05 }}
            whileHover={{ y: -4, transition: hoverLiftTransition }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/40">
              {card.label}
            </p>
            <p className="mt-3 font-display text-4xl font-semibold text-text-primary">
              {card.value}
            </p>
            <p className="mt-2 text-sm text-text-primary/58">{card.meta}</p>
          </motion.article>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_1fr]">
        <motion.section
          className="rounded-calm border border-accent/80 bg-white p-6 shadow-soft"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...morphTransition, delay: 0.14 }}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-3xl font-semibold text-text-primary">
              Marketplace Actions
            </h2>
            <span className="text-sm text-text-primary/45">{actionCards.length} actions</span>
          </div>

          <div className="mt-5 space-y-4">
            {actionCards.map((card) =>
              card.kind === "link" ? (
                <Link
                  key={card.title}
                  href={card.href}
                  className="block rounded-gentle bg-background px-4 py-4 transition-[transform,background-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:bg-accent/35 hover:shadow-sm"
                >
                  <p className="text-xl font-semibold text-text-primary">{card.title}</p>
                  <p className="mt-2 text-sm text-text-primary/60">{card.detail}</p>
                  <p className="mt-4 text-sm font-semibold text-text-secondary">{card.cta}</p>
                </Link>
              ) : (
                <button
                  key={card.title}
                  type="button"
                  onClick={card.action}
                  className="block w-full rounded-gentle bg-background px-4 py-4 text-left transition-[transform,background-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:bg-accent/35 hover:shadow-sm"
                >
                  <p className="text-xl font-semibold text-text-primary">{card.title}</p>
                  <p className="mt-2 text-sm text-text-primary/60">{card.detail}</p>
                  <p className="mt-4 text-sm font-semibold text-text-secondary">{card.cta}</p>
                </button>
              ),
            )}
          </div>
        </motion.section>

        <motion.section
          className="rounded-calm border border-accent/80 bg-white p-6 shadow-soft"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...morphTransition, delay: 0.18 }}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-3xl font-semibold text-text-primary">
              Featured Bundle
            </h2>
            <span className="text-sm text-text-primary/45">Suggested from live signals</span>
          </div>

          <article className="mt-5 rounded-gentle bg-background px-5 py-5">
            {featuredPackage.badge ? (
              <span className="rounded-full bg-primary/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
                {featuredPackage.badge}
              </span>
            ) : null}
            <h3 className="mt-3 font-display text-4xl font-semibold text-text-primary">
              {featuredPackage.title}
            </h3>
            <p className="mt-2 text-sm text-text-primary/60">{featuredPackage.description}</p>

            <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/40">
                  Bundle Price
                </p>
                <p className="mt-1 font-display text-4xl font-semibold text-text-primary">
                  {featuredPackage.currentPrice}
                </p>
                <p className="mt-1 text-sm text-text-primary/50">{featuredPackage.sessions}</p>
              </div>

              <div className="text-right text-sm text-text-primary/58">
                <p>
                  Wallet available: {formatCurrency(user?.wallet?.availableBalance)}
                </p>
                <p className="mt-1">
                  Latest care signal:{" "}
                  {sessions[0]
                    ? formatDateTime(sessions[0].startTime)
                    : bookings[0]
                      ? formatDateTime(bookings[0].requestedDate)
                      : "No live activity yet"}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/dashboard/packages/${featuredPackage.id}`}
                className="rounded-full bg-text-secondary px-5 py-3 text-sm font-semibold text-white"
              >
                View bundle
              </Link>
              <Link
                href="/dashboard/packages"
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-text-primary/75"
              >
                Browse all bundles
              </Link>
            </div>
          </article>
        </motion.section>
      </div>

      <motion.section
        className="rounded-calm border border-accent/80 bg-white p-6 shadow-soft"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...morphTransition, delay: 0.22 }}
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl font-semibold text-text-primary">
              Bundle Collection
            </h2>
            <p className="mt-1 text-sm text-text-primary/55">
              Curated bundle catalog layered on top of your current live care state.
            </p>
          </div>
          <Link
            href="/dashboard/packages"
            className="text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary"
          >
            Open package catalog
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {wellnessPackages.map((entry, index) => (
            <motion.article
              key={entry.id}
              className="rounded-gentle bg-background px-5 py-5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...morphTransition, delay: 0.26 + index * 0.04 }}
              whileHover={{ y: -4, transition: hoverLiftTransition }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/40">
                    {entry.sessions}
                  </p>
                  <h3 className="mt-2 font-display text-3xl font-semibold text-text-primary">
                    {entry.title}
                  </h3>
                </div>
                {entry.badge ? (
                  <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-primary/60">
                    {entry.badge}
                  </span>
                ) : null}
              </div>

              <p className="mt-4 text-sm text-text-primary/62">{entry.description}</p>

              <div className="mt-5 flex items-end justify-between gap-3">
                <div>
                  {entry.originalPrice ? (
                    <p className="text-xs font-semibold text-text-primary/35 line-through">
                      {entry.originalPrice}
                    </p>
                  ) : null}
                  <p className="font-display text-4xl font-semibold text-text-primary">
                    {entry.currentPrice}
                  </p>
                </div>

                <Link
                  href={`/dashboard/packages/${entry.id}`}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-text-primary/75"
                >
                  {entry.ctaLabel}
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <motion.section
        className="rounded-calm border border-accent/80 bg-white p-6 shadow-soft"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...morphTransition, delay: 0.26 }}
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl font-semibold text-text-primary">
              {providerView ? "Peer Spotlight" : "Live Provider Spotlight"}
            </h2>
            <p className="mt-1 text-sm text-text-primary/55">
              Verified provider recommendations sourced from the live directory.
            </p>
          </div>
          <Link
            href="/dashboard/therapists"
            className="text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary"
          >
            View all providers
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {suggestedProviders.length > 0 ? (
            suggestedProviders.map((provider, index) => {
              const tags = [...provider.specializations, ...provider.languages].slice(0, 3);

              return (
                <motion.article
                  key={provider.id}
                  className="rounded-gentle bg-background px-5 py-5"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...morphTransition, delay: 0.3 + index * 0.04 }}
                  whileHover={{ y: -4, transition: hoverLiftTransition }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-text-secondary">
                      {getInitials(provider.name)}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-text-primary">
                        {provider.name ?? "Verified provider"}
                      </p>
                      <p className="text-sm text-text-primary/55">
                        {toSentenceCase(provider.role)}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 line-clamp-3 text-sm text-text-primary/62">
                    {provider.bio ?? "Profile details are being completed."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {tags.length > 0 ? (
                      tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-primary/60"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-primary/60">
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3 text-sm text-text-primary/58">
                    <span>
                      {provider.nextAvailabilityDate
                        ? `Next: ${formatShortDate(provider.nextAvailabilityDate)}`
                        : "Availability soon"}
                    </span>
                    <span>
                      {provider.hourlyRate ? provider.hourlyRate : "On request"}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={`/dashboard/therapist/${provider.id}`}
                      className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-text-primary/75"
                    >
                      View profile
                    </Link>
                    {!providerView ? (
                      <button
                        type="button"
                        onClick={() =>
                          openBookSession({
                            providerId: provider.id,
                            name: provider.name ?? "Verified provider",
                            specialty: toSentenceCase(provider.role),
                            imageSrc: provider.image,
                            preferredRole: provider.role,
                          })
                        }
                        className="rounded-full bg-text-secondary px-4 py-2 text-sm font-semibold text-white"
                      >
                        Book
                      </button>
                    ) : null}
                  </div>
                </motion.article>
              );
            })
          ) : (
            <div className="rounded-gentle bg-background px-5 py-5 text-sm text-text-primary/58 md:col-span-2 xl:col-span-3">
              No verified providers are available in the current directory snapshot.
            </div>
          )}
        </div>
      </motion.section>
    </FadeIn>
  );
}
