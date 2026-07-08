"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FadeIn } from "@/components/ui/fade-in";
import { useBookSessionModal } from "@/components/dashboard/book-session-modal";
import { apiFetch, apiMutation } from "@/lib/api-client";
import { formatCurrency, formatShortDate, getInitials, toSentenceCase } from "@/lib/display";
import type { ApiCareSession, ApiProvider, ApiUser, ProviderRoleValue } from "@/types/api";

type PackageAllocation = {
  role: string;
  sessionCount: number;
};

type DbPackage = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  coverImage: string;
  galleryImages: string[];
  bannerImage?: string | null;
  price: string;
  discount: number;
  category: string;
  displayOrder: number;
  isFeatured: boolean;
  publicationStatus: string;
  isVisible: boolean;
  durationValue: number;
  durationUnit: string;
  startDate?: string | null;
  endDate?: string | null;
  maxPurchases?: number | null;
  purchaseCount: number;
  sections: any;
  facilitatorNote?: string | null;
  allocations: PackageAllocation[];
};

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

export function PackageDetailsClient({ packageId }: { packageId: string }) {
  const queryClient = useQueryClient();
  const { open: openBookSession } = useBookSessionModal();

  const userQuery = useQuery({
    queryKey: ["user-me"],
    queryFn: () => apiFetch<ApiUser>("/api/users/me"),
  });

  const packageQuery = useQuery({
    queryKey: ["package-details", packageId],
    queryFn: () => apiFetch<DbPackage>(`/api/packages/${packageId}`),
    enabled: Boolean(packageId)
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

  const pkg = packageQuery.data;

  const therapistSessions = useMemo(() => {
    if (!pkg) return 0;
    return pkg.allocations.find(a => a.role === "THERAPIST")?.sessionCount ?? 0;
  }, [pkg]);

  const listenerSessions = useMemo(() => {
    if (!pkg) return 0;
    return pkg.allocations.find(a => a.role === "LISTENER")?.sessionCount ?? 0;
  }, [pkg]);

  const preferredRole = useMemo<ProviderRoleValue>(() => {
    if (listenerSessions > therapistSessions) {
      return "LISTENER";
    }
    return "THERAPIST";
  }, [therapistSessions, listenerSessions]);

  const providersQuery = useQuery({
    queryKey: ["package-detail-providers", preferredRole],
    enabled: Boolean(pkg),
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

  const purchaseCalculations = useMemo(() => {
    if (!pkg) return { price: 0, originalPrice: 0, discount: 0, shortfall: 0, remaining: 0 };
    const originalPrice = Number(pkg.price);
    const discount = Number(pkg.discount);
    const price = originalPrice - originalPrice * (discount / 100);
    const shortfall = Math.max(price - availableBalance, 0);
    const remaining = availableBalance - price;

    return { price, originalPrice, discount, shortfall, remaining };
  }, [pkg, availableBalance]);

  const purchaseMutation = useMutation({
    mutationFn: () => apiMutation(`/api/packages/${packageId}/purchase`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-me"] });
      alert("Wellness package purchased successfully! You can now book care sessions.");
    },
    onError: (err: any) => {
      alert(err.message || "Purchase failed.");
    }
  });

  const primaryActionLabel = useMemo(() => {
    if (purchaseMutation.isPending) return "Processing...";
    if (availableBalance < purchaseCalculations.price) return "Top up wallet";
    return "Purchase Package";
  }, [availableBalance, purchaseCalculations.price, purchaseMutation.isPending]);

  const primaryAction = () => {
    if (availableBalance < purchaseCalculations.price) {
      alert(`You need ${formatCurrency(purchaseCalculations.shortfall)} more in your wallet. Go to your wallet to deposit.`);
      return;
    }
    if (confirm(`Confirm purchase of "${pkg?.title}" for ${formatCurrency(purchaseCalculations.price)}?`)) {
      purchaseMutation.mutate();
    }
  };

  const handleBookNext = () => {
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
  };

  const queryError =
    userQuery.error?.message ??
    packageQuery.error?.message ??
    sessionsQuery.error?.message ??
    providersQuery.error?.message;

  if (packageQuery.isLoading || userQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2f745f] border-t-transparent" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="py-16 text-center text-neutral-400">
        <p className="text-sm font-semibold">Package not found.</p>
      </div>
    );
  }

  const sectionsList = Array.isArray(pkg.sections) ? pkg.sections : [];
  const totalSessions = pkg.allocations.reduce((sum, a) => sum + a.sessionCount, 0);

  return (
    <FadeIn className="space-y-8 pb-10 md:space-y-10 md:pb-12 text-left">
      {/* Header section */}
      <section className="rounded-calm bg-white p-6 shadow-soft md:p-8 lg:p-10">
        <div className="grid gap-7 lg:grid-cols-[1fr_340px] lg:items-center lg:gap-10">
          <div>
            <span className="inline-flex rounded-full bg-primary/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
              {pkg.category}
            </span>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[0.92] text-text-primary sm:text-6xl md:text-7xl">
              {pkg.title}
            </h1>
            <p className="mt-5 max-w-xl text-[1.05rem] leading-relaxed text-text-primary/70">
              {pkg.subtitle}
            </p>

            <div className="mt-8 grid gap-5 border-t border-accent/60 pt-6 sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-primary/40">
                  Duration
                </p>
                <p className="mt-1 text-xl font-semibold text-text-primary capitalize">
                  {pkg.durationValue} {pkg.durationUnit.toLowerCase()}(s)
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-primary/40">
                  Sessions
                </p>
                <p className="mt-1 text-xl font-semibold text-text-primary">
                  {totalSessions} Session{totalSessions === 1 ? "" : "s"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-primary/40">
                  Allocations
                </p>
                <p className="mt-1 text-[11px] font-bold text-text-primary">
                  {therapistSessions} Therapist / {listenerSessions} Listener
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
              src={pkg.coverImage}
              alt={pkg.title}
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

      {/* Main Details and Sidebar */}
      <section className="grid gap-6 lg:gap-7 xl:grid-cols-[1fr_320px]">
        
        {/* Left side details */}
        <div className="space-y-6 lg:space-y-7">
          
          {/* Teaser Description */}
          <article className="rounded-calm bg-white p-6 shadow-soft transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-soft-hover md:p-7">
            <h2 className="font-display text-4xl font-semibold text-text-primary">Overview</h2>
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-text-primary/72 md:text-base">
              <p>{pkg.description}</p>
            </div>
          </article>

          {/* Dynamic Content Sections */}
          {sectionsList.map((section: any) => (
            <article
              key={section.id}
              className="rounded-calm bg-white p-6 shadow-soft transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-soft-hover md:p-7"
            >
              <h2 className="font-display text-4xl font-semibold text-text-primary">{section.title}</h2>
              {section.text ? (
                <div className="mt-5 space-y-4 text-sm leading-relaxed text-text-primary/72 md:text-base">
                  <p>{section.text}</p>
                </div>
              ) : section.content ? (
                <div className="mt-5 grid gap-4 md:grid-cols-2 md:gap-5">
                  {section.content.map((item: string) => (
                    <div key={item} className="rounded-gentle bg-background p-4 text-left">
                      <p className="text-lg font-semibold text-text-primary">{item}</p>
                      <p className="mt-2 text-sm text-text-primary/65">
                        Structured support designed to keep your care consistent and practical.
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          ))}

          {/* Facilitator Notes */}
          {pkg.facilitatorNote ? (
            <article className="rounded-calm bg-white p-6 shadow-soft transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-soft-hover md:p-7">
              <h2 className="font-display text-4xl font-semibold text-text-primary">Facilitator Note</h2>
              <p className="mt-5 text-sm leading-relaxed text-text-primary/68">{pkg.facilitatorNote}</p>
            </article>
          ) : null}
        </div>

        {/* Right side checkout sidebar */}
        <div className="space-y-5 lg:space-y-6">
          <aside className="rounded-calm bg-text-secondary p-6 text-white shadow-soft transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-soft-hover md:p-7">
            <h3 className="font-display text-4xl font-semibold">Start this journey</h3>
            <p className="mt-2 text-sm text-white/85">
              Confirm your wallet readiness to purchase and initiate this structured mental health care bundle.
            </p>

            <div className="mt-6 space-y-3 border-t border-white/20 pt-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span>Original Price</span>
                <span className="font-semibold line-through opacity-70">
                  {formatCurrency(purchaseCalculations.originalPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Bundle Deal Price</span>
                <span className="font-semibold text-lg text-primary/95">
                  {formatCurrency(purchaseCalculations.price)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Current Wallet Balance</span>
                <span className="font-semibold text-primary/80">
                  {formatCurrency(availableBalance)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Readiness</span>
                <span className={`font-semibold ${availableBalance >= purchaseCalculations.price ? "text-green-300" : "text-amber-300"}`}>
                  {availableBalance >= purchaseCalculations.price
                    ? "Wallet ready"
                    : `Need ${formatCurrency(purchaseCalculations.shortfall)} more`}
                </span>
              </div>
            </div>

            <div className="mt-5 border-t border-white/20 pt-4">
              <p className="text-sm text-white/85">Projected balance after path purchase</p>
              <p className="font-display text-5xl font-semibold text-primary/90">
                {formatCurrency(purchaseCalculations.remaining)}
              </p>
            </div>

            <button
              type="button"
              onClick={primaryAction}
              disabled={purchaseMutation.isPending}
              className="mt-6 w-full rounded-full bg-[#2f7b64] px-6 py-3 text-base font-semibold text-white transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-[#286b57]"
            >
              {primaryActionLabel}
            </button>

            <button
              type="button"
              onClick={handleBookNext}
              className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors duration-300 hover:bg-white/10"
            >
              Browse all providers
            </button>
          </aside>

          {/* Suggested Match Profile */}
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
                  href={matchedProvider.role === "THERAPIST" ? "/dashboard/therapists" : "/dashboard"}
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
