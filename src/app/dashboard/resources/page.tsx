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

type ResourceActionCard =
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

export default function ResourcesPage() {
  const { open: openBookSession } = useBookSessionModal();

  const userQuery = useQuery({
    queryKey: ["user-me"],
    queryFn: () => apiFetch<ApiUser>("/api/users/me"),
  });

  const providerView = isProviderRole(userQuery.data?.role);
  const bookingScope = providerView ? "provider" : "requester";
  const sessionScope = providerView ? "provider" : "participant";

  const bookingsQuery = useQuery({
    queryKey: ["resources-bookings", bookingScope],
    queryFn: () => apiFetch<ApiBooking[]>(`/api/bookings?scope=${bookingScope}&take=12`),
    enabled: !!userQuery.data,
  });

  const sessionsQuery = useQuery({
    queryKey: ["resources-sessions", sessionScope],
    queryFn: () => apiFetch<ApiCareSession[]>(`/api/sessions?scope=${sessionScope}&take=12`),
    enabled: !!userQuery.data,
  });

  const providersQuery = useQuery({
    queryKey: ["resources-providers"],
    queryFn: () => apiFetch<ApiProvider[]>("/api/providers?take=12"),
  });

  const user = userQuery.data;
  const bookings = useMemo(() => bookingsQuery.data ?? [], [bookingsQuery.data]);
  const sessions = useMemo(() => sessionsQuery.data ?? [], [sessionsQuery.data]);
  const providers = useMemo(() => providersQuery.data ?? [], [providersQuery.data]);

  const nextUpcomingSession = useMemo(
    () =>
      [...sessions]
        .filter((session) => session.status === "UPCOMING")
        .sort(
          (left, right) =>
            new Date(left.startTime).getTime() - new Date(right.startTime).getTime(),
        )[0] ?? null,
    [sessions],
  );

  const nextPendingBooking = useMemo(
    () =>
      [...bookings]
        .filter((booking) => booking.status === "PENDING")
        .sort(
          (left, right) =>
            new Date(left.requestedDate).getTime() - new Date(right.requestedDate).getTime(),
        )[0] ?? null,
    [bookings],
  );

  const suggestedProviders = useMemo(
    () =>
      providers
        .filter((provider) => provider.id !== user?.id)
        .sort((left, right) => {
          const leftPriority = left.nextAvailabilityDate ? 1 : 0;
          const rightPriority = right.nextAvailabilityDate ? 1 : 0;
          return rightPriority - leftPriority;
        })
        .slice(0, 4),
    [providers, user?.id],
  );

  const stats = useMemo(
    () => [
      {
        label: providerView ? "Queue Size" : "Care Requests",
        value: String(bookings.length),
        meta: `${bookings.filter((booking) => booking.status === "PENDING").length} pending`,
      },
      {
        label: "Upcoming Sessions",
        value: String(sessions.filter((session) => session.status === "UPCOMING").length),
        meta: `${sessions.filter((session) => session.status === "COMPLETED").length} completed`,
      },
      {
        label: "Wallet Readiness",
        value: formatCurrency(user?.wallet?.availableBalance),
        meta: `${formatCurrency(user?.wallet?.heldBalance)} held`,
      },
      {
        label: providerView ? "Peer Directory" : "Providers Ready",
        value: String(providers.filter((provider) => !!provider.nextAvailabilityDate).length),
        meta: `${providers.length} verified providers loaded`,
      },
    ],
    [bookings, providerView, providers, sessions, user?.wallet?.availableBalance, user?.wallet?.heldBalance],
  );

  const actionCards = useMemo<ResourceActionCard[]>(
    () =>
      providerView
        ? [
            {
              kind: "link",
              title: "Review active consultations",
              detail: `${bookings.filter((booking) => booking.status === "PENDING").length} requests currently need provider attention.`,
              href: "/dashboard/consultations",
              cta: "Open consultations",
            },
            {
              kind: "link",
              title: "Track wallet and payouts",
              detail: `${formatCurrency(user?.wallet?.availableBalance)} is currently available in your wallet.`,
              href: "/dashboard/wallet",
              cta: "Open wallet",
            },
            {
              kind: "link",
              title: "Refresh your profile posture",
              detail: user?.isVerified
                ? "Your account is verified. Keep profile information clear and current."
                : "Your account still needs verification signals before it appears fully trusted.",
              href: "/dashboard/profile",
              cta: "Open profile",
            },
          ]
        : [
            {
              kind: "action",
              title: "Book your next support session",
              detail: `${providers.filter((provider) => !!provider.nextAvailabilityDate).length} verified providers currently expose open availability.`,
              action: () => openBookSession({ preferredRole: "THERAPIST" }),
              cta: "Open booking flow",
            },
            {
              kind: "link",
              title: "Check consultation progress",
              detail: `${bookings.length} requests and ${sessions.filter((session) => session.status === "UPCOMING").length} upcoming sessions are currently loaded.`,
              href: "/dashboard/consultations",
              cta: "Open consultations",
            },
            {
              kind: "link",
              title: "Keep your wallet ready",
              detail: `${formatCurrency(user?.wallet?.availableBalance)} remains available for new requests and session holds.`,
              href: "/dashboard/wallet",
              cta: "Open wallet",
            },
          ],
    [bookings, openBookSession, providerView, providers, sessions, user?.isVerified, user?.wallet?.availableBalance],
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
          Resources
        </motion.h1>
        <motion.p
          className="max-w-3xl text-lg leading-relaxed text-text-primary/75"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...morphTransition, delay: 0.1 }}
        >
          {providerView
            ? "Use this live hub to review your current workload, keep your account ready, and navigate the provider tools that matter next."
            : "Use this live hub to understand your current care position, discover recommended providers, and move directly into the next helpful action."}
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

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <motion.section
          className="rounded-calm border border-accent/80 bg-white p-6 shadow-soft"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...morphTransition, delay: 0.14 }}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-3xl font-semibold text-text-primary">
              Live Care Signals
            </h2>
            <span className="text-sm text-text-primary/45">
              {providerView ? "Provider mode" : "Member mode"}
            </span>
          </div>

          <div className="mt-5 space-y-4">
            <article className="rounded-gentle bg-background px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/40">
                Next Live Moment
              </p>
              <p className="mt-2 text-xl font-semibold text-text-primary">
                {nextUpcomingSession
                  ? `Upcoming session with ${
                      providerView
                        ? nextUpcomingSession.user?.name ?? "participant"
                        : nextUpcomingSession.provider?.name ?? "provider"
                    }`
                  : nextPendingBooking
                    ? "Pending booking still needs movement"
                    : "No immediate live items"}
              </p>
              <p className="mt-2 text-sm text-text-primary/60">
                {nextUpcomingSession
                  ? `${formatDateTime(nextUpcomingSession.startTime)} • ${nextUpcomingSession.duration} mins`
                  : nextPendingBooking
                    ? `${formatDateTime(nextPendingBooking.requestedDate)} • ${toSentenceCase(
                        nextPendingBooking.type,
                      )} consultation`
                    : "Use the actions below to create the next step in your care flow."}
              </p>
            </article>

            <article className="rounded-gentle bg-background px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/40">
                Account Posture
              </p>
              <p className="mt-2 text-xl font-semibold text-text-primary">
                {user?.isVerified ? "Verified and active" : "Verification still pending"}
              </p>
              <p className="mt-2 text-sm text-text-primary/60">
                Role: {toSentenceCase(user?.role ?? "USER")} • Applications:{" "}
                {user?.applications?.length ?? 0}
              </p>
            </article>

            <article className="rounded-gentle bg-background px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/40">
                Financial Readiness
              </p>
              <p className="mt-2 text-xl font-semibold text-text-primary">
                {formatCurrency(user?.wallet?.availableBalance)} available
              </p>
              <p className="mt-2 text-sm text-text-primary/60">
                {formatCurrency(user?.wallet?.heldBalance)} held across current booking reserves.
              </p>
            </article>
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
              Action Library
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
              {providerView ? "Peer Directory" : "Recommended Providers"}
            </h2>
            <p className="mt-1 text-sm text-text-primary/55">
              Live provider suggestions from the verified directory.
            </p>
          </div>
          <Link
            href="/dashboard/therapists"
            className="text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary"
          >
            View full directory
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {suggestedProviders.length > 0 ? (
            suggestedProviders.map((provider, index) => {
              const tags = [...provider.specializations, ...provider.languages].slice(0, 3);

              return (
                <motion.article
                  key={provider.id}
                  className="rounded-gentle bg-background px-4 py-4"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...morphTransition, delay: 0.26 + index * 0.04 }}
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
                      {provider.hourlyRate ? formatCurrency(provider.hourlyRate) : "On request"}
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
            <div className="rounded-gentle bg-background px-4 py-4 text-sm text-text-primary/58 md:col-span-2 xl:col-span-4">
              No verified providers are available in the current directory snapshot.
            </div>
          )}
        </div>
      </motion.section>
    </FadeIn>
  );
}
