"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ContentGridSkeleton } from "@/components/skeletons";
import { FadeIn } from "@/components/ui/fade-in";
import { useBookSessionModal } from "@/components/dashboard/book-session-modal";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/display";
import { wellnessPackages } from "@/data/packages";
import type { ApiBooking, ApiCareSession, ApiUser } from "@/types/api";

function parsePrice(value: string) {
  return Number(value.replace(/[^0-9.]/g, ""));
}

export default function PackagesPage() {
  const { open: openBookSession } = useBookSessionModal();

  const userQuery = useQuery({
    queryKey: ["user-me"],
    queryFn: () => apiFetch<ApiUser>("/api/users/me"),
  });
  const bookingScope = useMemo(() => {
    if (userQuery.data?.role === "THERAPIST" || userQuery.data?.role === "LISTENER") {
      return "provider";
    }

    return "requester";
  }, [userQuery.data?.role]);
  const sessionScope = useMemo(() => {
    if (userQuery.data?.role === "THERAPIST" || userQuery.data?.role === "LISTENER") {
      return "provider";
    }

    return "participant";
  }, [userQuery.data?.role]);
  const bookingsQuery = useQuery({
    queryKey: ["packages-bookings", bookingScope],
    enabled: Boolean(userQuery.data),
    queryFn: () => apiFetch<ApiBooking[]>(`/api/bookings?scope=${bookingScope}&take=12`),
  });
  const sessionsQuery = useQuery({
    queryKey: ["packages-sessions", sessionScope],
    enabled: Boolean(userQuery.data),
    queryFn: () => apiFetch<ApiCareSession[]>(`/api/sessions?scope=${sessionScope}&take=12`),
  });

  const user = userQuery.data;
  const bookings = useMemo(() => bookingsQuery.data ?? [], [bookingsQuery.data]);
  const sessions = useMemo(() => sessionsQuery.data ?? [], [sessionsQuery.data]);
  const availableBalance = Number(user?.wallet?.availableBalance ?? 0);
  const completedSessions = sessions.filter((session) => session.status === "COMPLETED").length;
  const pendingBookings = bookings.filter((booking) => booking.status === "PENDING").length;

  const packageCards = useMemo(
    () =>
      wellnessPackages.map((entry) => {
        const price = parsePrice(entry.currentPrice);
        const shortfall = Math.max(price - availableBalance, 0);
        const affordability =
          availableBalance >= price
            ? "Wallet ready"
            : `Need ${formatCurrency(shortfall)} more`;

        return {
          ...entry,
          price,
          affordability,
          recommended:
            (entry.id === "mindfulness-starter-pack" && completedSessions === 0) ||
            (entry.id === "self-care-essentials" && pendingBookings > 0) ||
            (entry.id === "deep-healing-journey" && completedSessions >= 2),
        };
      }),
    [availableBalance, completedSessions, pendingBookings],
  );

  const queryError =
    userQuery.error?.message ?? bookingsQuery.error?.message ?? sessionsQuery.error?.message;

  const isPageLoading =
    userQuery.isLoading || bookingsQuery.isLoading || sessionsQuery.isLoading;

  if (isPageLoading) {
    return (
      <FadeIn className="space-y-12 pb-10 md:space-y-14 md:pb-12">
        <ContentGridSkeleton count={6} columns={3} />
      </FadeIn>
    );
  }

  return (
    <FadeIn className="space-y-12 pb-10 md:space-y-14 md:pb-12">
      <section className="space-y-4 md:space-y-5">
        <h1 className="font-display text-4xl font-semibold text-text-primary sm:text-5xl">
          Wellness Packages
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-text-primary/70 md:text-lg">
          Curated therapeutic journeys designed to foster long-term growth and emotional stability.
          The catalog now reflects your live wallet readiness and recent care activity.
        </p>

        {queryError ? (
          <p className="text-sm font-medium text-[#cf4f45]">{queryError}</p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-gentle bg-white px-5 py-4 shadow-soft">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/40">
              Available Wallet
            </p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">
              {formatCurrency(user?.wallet?.availableBalance)}
            </p>
          </article>
          <article className="rounded-gentle bg-white px-5 py-4 shadow-soft">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/40">
              Completed Sessions
            </p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">{completedSessions}</p>
          </article>
          <article className="rounded-gentle bg-white px-5 py-4 shadow-soft">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/40">
              Pending Care Requests
            </p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">{pendingBookings}</p>
          </article>
        </div>
      </section>

      <section className="grid gap-6 md:gap-7 lg:grid-cols-3">
        {packageCards.map((entry) => (
          <article
            key={entry.id}
            className="group overflow-hidden rounded-calm border border-accent/70 bg-white shadow-soft transition-[border-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-1 hover:border-primary/25 hover:shadow-soft-hover"
          >
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entry.image}
                alt={entry.title}
                className="h-44 w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.04] md:h-48"
              />
              {entry.badge ? (
                <span className="absolute right-3 top-3 rounded-full bg-primary/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                  {entry.badge}
                </span>
              ) : null}
              {entry.recommended ? (
                <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-primary/70">
                  Recommended
                </span>
              ) : null}
            </div>

            <div className="space-y-4 p-5 md:space-y-5 md:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-primary/45">
                {entry.sessions}
              </p>
              <h2 className="font-display text-[2rem] font-semibold leading-tight text-text-primary">
                {entry.title}
              </h2>
              <p className="text-sm leading-relaxed text-text-primary/68">{entry.description}</p>

              <div className="rounded-gentle bg-background px-4 py-3 text-sm text-text-primary/62">
                {entry.affordability}
              </div>

              <div className="flex items-end justify-between gap-3 pt-3">
                <div>
                  {entry.originalPrice ? (
                    <p className="text-xs font-semibold text-text-primary/40 line-through">
                      {entry.originalPrice}
                    </p>
                  ) : null}
                  <p className="font-display text-4xl font-semibold text-text-primary">
                    {entry.currentPrice}
                  </p>
                </div>

                <Link
                  href={`/dashboard/packages/${entry.id}`}
                  className="rounded-full bg-[#e8ded2] px-5 py-2.5 text-sm font-semibold text-text-primary transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-[#dfd3c5]"
                >
                  {entry.ctaLabel}
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-calm bg-primary/10 p-6 transition-[box-shadow,transform] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-soft md:p-8 lg:p-10">
        <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center md:gap-8">
          <div>
            <h3 className="font-display text-3xl font-semibold text-text-secondary md:text-4xl">
              Need a custom plan?
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-primary/70 md:text-base">
              Use the live booking flow to connect with a provider and turn one of these bundles
              into a care path tailored to your current needs.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openBookSession({ preferredRole: "THERAPIST" })}
            className="rounded-full bg-text-secondary px-7 py-3 text-sm font-semibold text-white shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-soft-hover"
          >
            Consult with us
          </button>
        </div>
      </section>
    </FadeIn>
  );
}
