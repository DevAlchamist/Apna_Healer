"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
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

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  const activePurchase = useMemo(() => {
    const purchases = userQuery.data?.packagePurchases ?? [];
    return (
      purchases.find(
        (p: any) => p.packageId === packageId && p.status === "ACTIVE"
      ) ?? null
    );
  }, [userQuery.data?.packagePurchases, packageId]);

  const totalAllocated = useMemo(() => {
    if (!activePurchase) return 0;
    return activePurchase.allocations.reduce((sum, a) => sum + a.allocatedSessions, 0);
  }, [activePurchase]);

  const totalRemaining = useMemo(() => {
    if (!activePurchase) return 0;
    return activePurchase.allocations.reduce((sum, a) => sum + a.remainingSessions, 0);
  }, [activePurchase]);

  const totalUsed = useMemo(() => {
    return totalAllocated - totalRemaining;
  }, [totalAllocated, totalRemaining]);

  const progressPercent = useMemo(() => {
    if (totalAllocated === 0) return 0;
    return (totalUsed / totalAllocated) * 100;
  }, [totalUsed, totalAllocated]);

  const purchaseMutation = useMutation({
    mutationFn: () => apiMutation(`/api/packages/${packageId}/purchase`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-me"] });
    },
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
    setIsCheckoutModalOpen(true);
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
          {activePurchase ? (
            <aside className="rounded-calm bg-[#2D5A4C] p-6 text-white shadow-soft transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-soft-hover md:p-7">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl font-semibold">Active Care Path</h3>
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold text-white border border-white/30 tracking-wider">
                  ACTIVE
                </span>
              </div>
              <p className="mt-2 text-xs text-white/80">
                You have successfully initiated this wellness journey. Redeem your allocations to book slots.
              </p>

              <div className="mt-6 space-y-4 border-t border-white/20 pt-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-white/90">
                    <span>Overall Progress</span>
                    <span>{totalUsed} / {totalAllocated} Sessions Completed</span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/20">
                    <div
                      className="absolute top-0 bottom-0 left-0 bg-green-400 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 text-xs">
                  <p className="font-semibold text-white/80">Allocation Status</p>
                  {activePurchase.allocations.map((alloc: any) => (
                    <div key={alloc.id} className="flex justify-between rounded-xl bg-white/5 p-2.5 border border-white/5">
                      <span className="capitalize font-medium text-white/90">{alloc.role.toLowerCase()} support</span>
                      <span className="font-bold">{alloc.remainingSessions} remaining of {alloc.allocatedSessions}</span>
                    </div>
                  ))}
                </div>

                {activePurchase.expiryDate ? (
                  <div className="text-[10px] text-white/60 pt-1">
                    Expires on {formatShortDate(activePurchase.expiryDate)}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={handleBookNext}
                className="mt-6 w-full rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#2D5A4C] transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-neutral-100"
              >
                Book Package Session
              </button>
            </aside>
          ) : (
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
          )}

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

      {/* Checkout / Purchase Modal */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0d2f2a]/45 px-4 py-6 backdrop-blur-[6px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-[28px] border border-accent/80 bg-[#fdfbf7] p-6 shadow-[0_24px_64px_-16px_rgba(13,47,42,0.35)] md:p-8 text-left"
            >
              {purchaseMutation.isSuccess ? (
                <div className="text-center space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-2xl">
                    🎉
                  </div>
                  <h3 className="font-display text-2xl font-bold text-text-primary">
                    Purchase Successful!
                  </h3>
                  <p className="text-sm leading-relaxed text-text-primary/70">
                    Your wellness package <strong>{pkg.title}</strong> has been successfully activated. You can now use your session allocations to book appointments with therapists or listeners.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCheckoutModalOpen(false);
                      purchaseMutation.reset();
                    }}
                    className="mt-4 w-full rounded-full bg-[#2D5A4C] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#204439]"
                  >
                    Go to Care Path
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <h3 className="font-display text-2xl font-bold text-text-primary">
                    Review Wellness Package
                  </h3>
                  <p className="text-xs text-text-primary/60 leading-relaxed">
                    Confirm your package selection and checkout using your current Apna Healer wallet balance.
                  </p>

                  <div className="rounded-2xl border border-accent/60 bg-white p-4 space-y-3 text-xs">
                    <div className="flex justify-between">
                      <span className="font-semibold text-text-primary">Package Name</span>
                      <span className="text-text-primary/80 font-medium">{pkg.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-text-primary">Duration</span>
                      <span className="capitalize">{pkg.durationValue} {pkg.durationUnit.toLowerCase()}(s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-text-primary">Allocations</span>
                      <span>{totalSessions} Session{totalSessions === 1 ? "" : "s"}</span>
                    </div>
                    {purchaseCalculations.discount > 0 && (
                      <div className="flex justify-between text-neutral-400 line-through">
                        <span>Original Price</span>
                        <span>{formatCurrency(purchaseCalculations.originalPrice)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm text-text-secondary border-t border-accent/40 pt-2.5">
                      <span>Total Amount</span>
                      <span>{formatCurrency(purchaseCalculations.price)}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-neutral-100/60 p-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-text-primary/65">Wallet Balance</span>
                      <span className="font-semibold">{formatCurrency(availableBalance)}</span>
                    </div>
                    <div className="flex justify-between border-t border-accent/40 pt-2 font-semibold">
                      <span>Balance after purchase</span>
                      <span className={purchaseCalculations.remaining >= 0 ? "text-[#2D5A4C]" : "text-theme-status-error"}>
                        {formatCurrency(purchaseCalculations.remaining)}
                      </span>
                    </div>
                  </div>

                  {purchaseMutation.isError && (
                    <p className="text-xs font-semibold text-theme-status-error bg-red-50 border border-red-200/50 rounded-xl p-3">
                      {(purchaseMutation.error as any)?.message || "Purchase transaction failed."}
                    </p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      disabled={purchaseMutation.isPending}
                      onClick={() => setIsCheckoutModalOpen(false)}
                      className="flex-1 rounded-full border border-accent/80 bg-white px-5 py-3 text-xs font-semibold text-text-primary transition hover:bg-neutral-100 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={purchaseMutation.isPending || availableBalance < purchaseCalculations.price}
                      onClick={() => purchaseMutation.mutate()}
                      className="flex-1 rounded-full bg-[#2D5A4C] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#204439] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {purchaseMutation.isPending ? (
                        <>
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Processing...
                        </>
                      ) : (
                        "Pay & Activate"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </FadeIn>
  );
}
