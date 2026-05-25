"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProviderProfileSkeleton } from "@/components/skeletons";
import { FadeIn } from "@/components/ui/fade-in";
import { useBookSessionModal } from "@/components/dashboard/book-session-modal";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, formatShortDate, toSentenceCase } from "@/lib/display";
import type { ApiProvider } from "@/types/api";

export default function TherapistDetailsPage() {
  const params = useParams<{ id: string }>();
  const { open: openBookSession } = useBookSessionModal();

  const providerQuery = useQuery({
    queryKey: ["provider-detail", params.id],
    queryFn: () => apiFetch<ApiProvider>(`/api/providers/${params.id}`),
    enabled: !!params.id,
  });

  const provider = providerQuery.data;
  const tags = useMemo(
    () => [...(provider?.specializations ?? []), ...(provider?.languages ?? [])],
    [provider?.languages, provider?.specializations],
  );
  const availability = useMemo(() => provider?.availability ?? [], [provider?.availability]);

  const canBook = !!provider?.hourlyRate && Number(provider.hourlyRate) > 0;

  const handleBookSession = () => {
    if (!provider) return;
    openBookSession({
      providerId: provider.id,
      name: provider.name ?? "Verified therapist",
      specialty:
        provider.specializations[0] ?? provider.languages[0] ?? toSentenceCase(provider.role),
      imageSrc: provider.image,
      preferredRole: "THERAPIST",
    });
  };

  return (
    <FadeIn className="space-y-10 pb-6 md:space-y-12">
      <div>
        <Link
          href="/dashboard/therapists"
          className="text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary"
        >
          ← Back to directory
        </Link>
      </div>

      {providerQuery.isLoading ? (
        <ProviderProfileSkeleton />
      ) : providerQuery.error || !provider ? (
        <div className="rounded-calm bg-white px-6 py-5 text-sm font-medium text-[#cf4f45] shadow-soft">
          {providerQuery.error?.message ?? "Provider not found."}
        </div>
      ) : (
        <section className="grid gap-8 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,430px)] xl:gap-10">
          <article className="space-y-8">
            <div className="relative overflow-hidden rounded-calm">
              {provider.image ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={provider.image}
                    alt={provider.name ?? "Provider"}
                    className="h-[300px] w-full object-cover md:h-[380px]"
                  />
                </>
              ) : (
                <div className="flex h-[300px] items-center justify-center bg-[#e8f4ee] text-6xl font-semibold text-text-secondary md:h-[380px]">
                  {provider.name?.slice(0, 1) ?? "A"}
                </div>
              )}

              <div className="absolute bottom-5 left-1/2 flex w-[min(90%,420px)] -translate-x-1/2 items-center justify-between rounded-gentle bg-white px-4 py-3 shadow-soft">
                <div className="px-2 text-center">
                  <p className="font-display text-2xl font-semibold text-text-secondary">
                    {provider.sessionCount}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-primary/45">
                    Sessions
                  </p>
                </div>
                <div className="h-9 w-px bg-accent/80" />
                <div className="px-2 text-center">
                  <p className="font-display text-2xl font-semibold text-text-secondary">
                    {availability.length}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-primary/45">
                    Open Days
                  </p>
                </div>
                <div className="h-9 w-px bg-accent/80" />
                <div className="px-2 text-center">
                  <p className="font-display text-2xl font-semibold text-text-secondary">
                    {provider.nextAvailabilityDate
                      ? formatShortDate(provider.nextAvailabilityDate)
                      : "Soon"}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-primary/45">
                    Next Slot
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="font-display text-5xl font-semibold text-text-primary">
                {provider.name ?? "Verified provider"}
              </h1>
              <p className="text-lg text-text-secondary">{toSentenceCase(provider.role)}</p>
            </div>

            <div className="space-y-3 pt-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-primary/45">
                About
              </p>
              <p className="max-w-3xl text-[1.08rem] leading-relaxed text-text-primary/72">
                {provider.bio ?? "This provider is finishing their profile details."}
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-primary/45">
                Areas of Focus
              </p>
              <div className="flex flex-wrap gap-2.5">
                {tags.length > 0 ? (
                  tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#f2ede6] px-3 py-1.5 text-xs font-semibold text-text-primary/65"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full bg-[#f2ede6] px-3 py-1.5 text-xs font-semibold text-text-primary/65">
                    Verified provider
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-primary/45">
                Upcoming Availability
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {availability.length > 0 ? (
                  availability.slice(0, 6).map((entry) => (
                    <article
                      key={entry.id}
                      className="rounded-calm border border-accent/70 bg-white p-5 shadow-soft"
                    >
                      <p className="text-lg font-semibold text-text-primary">
                        {formatShortDate(entry.date)}
                      </p>
                      <p className="mt-1 text-sm text-text-primary/58">{entry.timezone}</p>
                      <p className="mt-4 text-sm text-text-primary/68">
                        {entry.slots.filter((slot) => !slot.isBooked).length} open time slots
                      </p>
                    </article>
                  ))
                ) : (
                  <div className="rounded-calm border border-accent/70 bg-white p-5 text-sm text-text-primary/58 shadow-soft">
                    Availability has not been published yet.
                  </div>
                )}
              </div>
            </div>
          </article>

          <div className="space-y-6">
            <aside className="h-fit rounded-calm border border-accent/70 bg-white p-6 shadow-soft md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-3xl font-semibold text-text-primary">
                    Book a Session
                  </h2>
                  <p className="mt-2 text-sm text-text-primary/55">
                    Choose your time, complete a short intake, and pay securely in one flow.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wider text-text-primary/45">Per Session</p>
                  <p className="font-display text-3xl font-semibold text-text-secondary">
                    {provider.hourlyRate ? formatCurrency(provider.hourlyRate) : "Not set"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleBookSession}
                disabled={!canBook}
                className="mt-8 w-full rounded-full bg-text-secondary px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-shadow duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[0_10px_28px_-8px_rgb(47_93_80/45%)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Book Session
              </button>

              {!canBook ? (
                <p className="mt-3 text-xs text-text-primary/50">
                  Booking opens once this therapist sets a session rate and weekly hours.
                </p>
              ) : (
                <p className="mt-3 text-center text-xs text-text-primary/45">
                  You will pick a slot in the next step.
                </p>
              )}
            </aside>

            <div className="space-y-3.5 rounded-calm border border-accent/70 bg-white p-6 shadow-soft md:p-7">
              <div className="rounded-gentle bg-primary/10 p-3 text-sm text-text-primary/75">
                <p className="font-semibold text-text-secondary">Secure Payment</p>
                <p>Your session is confirmed immediately after payment.</p>
              </div>
              <div className="rounded-gentle bg-background p-3 text-sm text-text-primary/62">
                Wallet holds apply until the session completes or is cancelled per policy.
              </div>
            </div>
          </div>
        </section>
      )}
    </FadeIn>
  );
}
