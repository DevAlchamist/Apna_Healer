"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FadeIn } from "@/components/ui/fade-in";
import { useBookSessionModal } from "@/components/dashboard/book-session-modal";
import type { WellnessPackageDetail } from "@/data/packages";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, formatShortDate, getInitials, toSentenceCase } from "@/lib/display";
import type { ApiCareSession, ApiProvider, ApiUser, ProviderRoleValue } from "@/types/api";

function parsePrice(value: string) {
  return Number(value.replace(/[^0-9.]/g, ""));
}

function getPreferredRole(detailId: string): ProviderRoleValue {
  return detailId === "self-care-essentials" ? "LISTENER" : "THERAPIST";
}

function getJourneySteps(detail: WellnessPackageDetail) {
  if (detail.id === "deep-healing-journey") {
    return ["Stabilise and assess patterns", "Process with guided support", "Integrate with a future-care plan"];
  }

  if (detail.id === "self-care-essentials") {
    return ["Reset current pressure points", "Build a manageable weekly rhythm", "Leave with a maintenance plan"];
  }

  return ["Start with grounding basics", "Strengthen focus and regulation", "Lock in daily care habits"];
}

function ProviderAvatar({ provider }: { provider: ApiProvider }) {
  if (provider.image) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={provider.image}
          alt={provider.name ?? "Provider"}
          className="h-14 w-14 rounded-full object-cover"
        />
      </>
    );
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-text-secondary">
      {getInitials(provider.name)}
    </div>
  );
}

export function PackageDetailsClient({ detail }: { detail: WellnessPackageDetail }) {
  const { open: openBookSession } = useBookSessionModal();
  const preferredRole = getPreferredRole(detail.id);
  const journeySteps = useMemo(() => getJourneySteps(detail), [detail]);

  const userQuery = useQuery({
    queryKey: ["user-me"],
    queryFn: () => apiFetch<ApiUser>("/api/users/me"),
  });

  const userScope = useMemo(() => {
    if (userQuery.data?.role === "THERAPIST" || userQuery.data?.role === "LISTENER") {
      return "provider";
    }

    return "participant";
  }, [userQuery.data?.role]);

  const sessionsQuery = useQuery({
    queryKey: ["package-detail-sessions", userScope],
    enabled: Boolean(userQuery.data),
    queryFn: () => apiFetch<ApiCareSession[]>(`/api/sessions?scope=${userScope}&take=12`),
  });

  const providersQuery = useQuery({
    queryKey: ["package-detail-providers", preferredRole],
    queryFn: () => apiFetch<ApiProvider[]>(`/api/providers?role=${preferredRole}&take=6`),
  });

  const sessions = useMemo(() => sessionsQuery.data ?? [], [sessionsQuery.data]);
  const providers = useMemo(() => providersQuery.data ?? [], [providersQuery.data]);
  const completedSessions = sessions.filter((session) => session.status === "COMPLETED").length;
  const activeSessions = sessions.filter(
    (session) => session.status === "UPCOMING" || session.status === "ONGOING",
  ).length;

  const matchedProvider = useMemo(() => {
    return [...providers].sort((left, right) => {
      const leftScore = Number(Boolean(left.isVerified)) * 1000 + left.sessionCount;
      const rightScore = Number(Boolean(right.isVerified)) * 1000 + right.sessionCount;
      return rightScore - leftScore;
    })[0] ?? null;
  }, [providers]);

  const availableBalance = Number(userQuery.data?.wallet?.availableBalance ?? 0);
  const packagePrice = parsePrice(detail.currentPrice);
  const shortfall = Math.max(packagePrice - availableBalance, 0);
  const remaining = availableBalance - packagePrice;
  const primaryActionLabel = matchedProvider?.name
    ? `Book with ${matchedProvider.name.split(" ")[0]}`
    : preferredRole === "THERAPIST"
      ? "Book a therapist"
      : "Book a listener";

  const primaryAction = () =>
    openBookSession(
      matchedProvider
        ? {
            providerId: matchedProvider.id,
            name: matchedProvider.name ?? "Verified provider",
            specialty: matchedProvider.specializations[0] ?? toSentenceCase(matchedProvider.role),
            imageSrc: matchedProvider.image,
            preferredRole: matchedProvider.role,
          }
        : { preferredRole },
    );

  const queryError =
    userQuery.error?.message ?? sessionsQuery.error?.message ?? providersQuery.error?.message;

  return (
    <FadeIn className="space-y-8 pb-10 md:space-y-10 md:pb-12">
      <section className="rounded-calm bg-white p-6 shadow-soft md:p-8 lg:p-10">
        <div className="grid gap-7 lg:grid-cols-[1fr_340px] lg:items-center lg:gap-10">
          <div>
            <span className="inline-flex rounded-full bg-primary/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
              {detail.category}
            </span>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[0.92] text-text-primary sm:text-6xl md:text-7xl">
              {detail.title}
            </h1>
            <p className="mt-5 max-w-xl text-[1.05rem] leading-relaxed text-text-primary/70">
              {detail.subtitle}
            </p>

            <div className="mt-8 grid gap-5 border-t border-accent/60 pt-6 sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-primary/40">
                  Duration
                </p>
                <p className="mt-1 text-xl font-semibold text-text-primary">{detail.duration}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-primary/40">
                  Sessions
                </p>
                <p className="mt-1 text-xl font-semibold text-text-primary">{detail.sessions}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-primary/40">
                  Live Care Status
                </p>
                <p className="mt-1 text-xl font-semibold text-text-primary">
                  {activeSessions > 0 ? "Active care underway" : completedSessions > 0 ? "Ready for the next step" : "Great starting point"}
                </p>
              </div>
            </div>

            {queryError ? (
              <p className="mt-5 text-sm font-medium text-theme-status-error">{queryError}</p>
            ) : null}
          </div>

          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={detail.heroImage}
              alt={detail.title}
              className="h-[340px] w-full rounded-calm object-cover shadow-soft transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02]"
            />
            <div className="absolute -bottom-4 left-4 rounded-gentle bg-white px-4 py-3 shadow-soft">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-secondary/80">
                Best Matched With
              </p>
              <p className="mt-1 text-sm font-semibold text-text-primary">
                {toSentenceCase(preferredRole)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:gap-7 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6 lg:space-y-7">
          <article className="rounded-calm bg-white p-6 shadow-soft transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-soft-hover md:p-7">
            <h2 className="font-display text-4xl font-semibold text-text-primary">Overview</h2>
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-text-primary/72 md:text-base">
              {detail.summary.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>

          <article className="rounded-calm bg-white p-6 shadow-soft transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-soft-hover md:p-7">
            <h2 className="font-display text-4xl font-semibold text-text-primary">What&apos;s Included</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2 md:gap-5">
              {detail.includes.map((item) => (
                <div key={item} className="rounded-gentle bg-background p-4">
                  <p className="text-lg font-semibold text-text-primary">{item}</p>
                  <p className="mt-2 text-sm text-text-primary/65">
                    Structured support designed to keep your care consistent and practical.
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-calm bg-white p-6 shadow-soft transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-soft-hover md:p-7">
            <h2 className="font-display text-4xl font-semibold text-text-primary">How this path unfolds</h2>
            <div className="mt-5 space-y-5">
              {journeySteps.map((step) => (
                <div key={step} className="flex gap-3">
                  <span className="mt-1.5 h-3 w-3 rounded-full bg-primary/55" aria-hidden />
                  <div>
                    <p className="text-xl font-semibold text-text-primary">{step}</p>
                    <p className="text-sm text-text-primary/65">
                      Sessions are booked individually through the live care flow, while this bundle
                      acts as your roadmap.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-calm bg-white p-6 shadow-soft transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-soft-hover md:p-7">
            <h2 className="font-display text-4xl font-semibold text-text-primary">Best for</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              {detail.idealFor.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-text-secondary"
                >
                  {item}
                </span>
              ))}
            </div>
          </article>
        </div>

        <div className="space-y-5 lg:space-y-6">
          <aside className="rounded-calm bg-text-secondary p-6 text-white shadow-soft transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-soft-hover md:p-7">
            <h3 className="font-display text-4xl font-semibold">Start this journey</h3>
            <p className="mt-2 text-sm text-white/85">
              Bundle checkout is not live yet. Use this page as a guided care plan, then book your
              next session with a matching provider.
            </p>

            <div className="mt-6 space-y-3 border-t border-white/20 pt-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span>Guide Price</span>
                <span className="font-semibold">{detail.originalPrice ?? detail.currentPrice}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Current Wallet Balance</span>
                <span className="font-semibold text-primary/80">
                  {formatCurrency(userQuery.data?.wallet?.availableBalance)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Readiness</span>
                <span className="font-semibold">
                  {availableBalance >= packagePrice
                    ? "Wallet ready"
                    : `Need ${formatCurrency(shortfall)} more`}
                </span>
              </div>
            </div>

            <div className="mt-5 border-t border-white/20 pt-4">
              <p className="text-sm text-white/85">Projected balance after full path</p>
              <p className="font-display text-5xl font-semibold text-primary/90">
                {formatCurrency(remaining)}
              </p>
            </div>

            <button
              type="button"
              onClick={primaryAction}
              className="mt-6 w-full rounded-full bg-[#2f7b64] px-6 py-3 text-base font-semibold text-white transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-[#286b57]"
            >
              {primaryActionLabel}
            </button>

            <Link
              href="/dashboard/therapists"
              className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors duration-300 hover:bg-white/10"
            >
              Browse all providers
            </Link>
          </aside>

          <article className="rounded-calm bg-white p-5 shadow-soft transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-soft-hover md:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary/70">
              Facilitator Note
            </p>
            <p className="mt-3 text-sm leading-relaxed text-text-primary/68">{detail.facilitatorNote}</p>
          </article>

          <article className="rounded-calm bg-white p-5 shadow-soft transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-soft-hover md:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary/70">
              Suggested Match
            </p>
            {matchedProvider ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <ProviderAvatar provider={matchedProvider} />
                  <div>
                    <p className="text-lg font-semibold text-text-primary">
                      {matchedProvider.name ?? "Verified provider"}
                    </p>
                    <p className="text-sm text-text-primary/60">
                      {toSentenceCase(matchedProvider.role)}
                      {matchedProvider.specializations[0]
                        ? ` · ${matchedProvider.specializations[0]}`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-text-primary/70">
                  <p>Delivered sessions: {matchedProvider.sessionCount}</p>
                  <p>
                    Next availability: {formatShortDate(matchedProvider.nextAvailabilityDate)}
                  </p>
                  <p>
                    Rate:{" "}
                    {matchedProvider.hourlyRate
                      ? formatCurrency(matchedProvider.hourlyRate)
                      : "Configured during booking"}
                  </p>
                </div>
                <Link
                  href={`/dashboard/therapist/${matchedProvider.id}`}
                  className="inline-flex rounded-full bg-[#e8ded2] px-5 py-2.5 text-sm font-semibold text-text-primary transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-[#dfd3c5]"
                >
                  View profile
                </Link>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-text-primary/68">
                Matching providers will appear here once the provider directory finishes loading.
              </p>
            )}
          </article>
        </div>
      </section>
    </FadeIn>
  );
}
