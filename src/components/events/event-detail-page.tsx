"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FadeIn } from "@/components/ui/fade-in";
import { EventRegisterModal } from "@/components/events/event-register-modal";
import { EventRegistrationsTable } from "@/components/events/event-registrations-table";
import { apiFetch, apiMutation } from "@/lib/api-client";
import { formatCurrency } from "@/lib/display";
import type {
  ApiEventDetail,
  ApiEventRegistrationRow,
} from "@/types/api";

type EventDetailPageProps = {
  slug: string;
  basePath?: string;
  registrationsApiPath?: string;
};

export function EventDetailPage({
  slug,
  basePath = "/dashboard/events",
  registrationsApiPath,
}: EventDetailPageProps) {
  const queryClient = useQueryClient();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [showRoster, setShowRoster] = useState(false);

  const eventQuery = useQuery({
    queryKey: ["event", slug],
    queryFn: () => apiFetch<ApiEventDetail>(`/api/events/${slug}`),
  });

  const rosterPath =
    registrationsApiPath ??
    (eventQuery.data?.canManage
      ? eventQuery.data.clubSlug
        ? `/api/clubs/${eventQuery.data.clubSlug}/events/${eventQuery.data.id}/registrations`
        : `/api/admin/events/${eventQuery.data.id}/registrations`
      : null);

  const rosterQuery = useQuery({
    queryKey: ["event-registrations", slug, rosterPath],
    queryFn: () => apiFetch<ApiEventRegistrationRow[]>(rosterPath!),
    enabled: Boolean(showRoster && rosterPath),
  });

  const cancelMutation = useMutation({
    mutationFn: (targetUserId?: string) =>
      apiMutation(`/api/events/${slug}/cancel-registration`, "POST", {
        ...(targetUserId ? { userId: targetUserId } : {}),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["event", slug] });
      void queryClient.invalidateQueries({ queryKey: ["event-registrations", slug] });
    },
  });

  const event = eventQuery.data;

  if (eventQuery.isLoading) {
    return <div className="h-96 animate-pulse rounded-calm bg-accent/30" />;
  }

  if (!event) {
    return (
      <div className="rounded-calm border border-dashed border-accent px-8 py-16 text-center">
        <p className="font-display text-2xl font-semibold">Event not found</p>
        <Link href={basePath} className="mt-4 inline-block text-sm font-semibold text-text-secondary">
          ← Back to events
        </Link>
      </div>
    );
  }

  const paragraphs = event.description
    ? event.description.split(/\n\n+/).filter(Boolean)
    : [event.subtitle ?? event.excerpt].filter(Boolean);

  return (
    <FadeIn className="space-y-8 pb-6">
      <Link href={basePath} className="text-sm font-semibold text-text-secondary">
        ← All events
      </Link>

      <section className="relative overflow-hidden rounded-calm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            event.heroImageUrl ??
            "https://images.unsplash.com/photo-1514149358658-38dedeafd5f3?w=1200&q=80"
          }
          alt={event.title}
          className="h-[260px] w-full object-cover md:h-[360px]"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/25 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white md:p-8">
          {event.clubTitle ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
              {event.clubTitle}
            </p>
          ) : null}
          <span className="mt-2 inline-flex rounded-full bg-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]">
            {event.category}
          </span>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold leading-tight md:text-5xl">
            {event.title}
          </h1>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/90">
            <p>{event.dateLabel}</p>
            <p>{event.timeLabel}</p>
            {event.venue ? <p>{event.venue}</p> : null}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_280px]">
        <article className="rounded-calm bg-white p-6 shadow-soft md:p-7">
          <h2 className="font-display text-3xl font-semibold text-text-primary">About</h2>
          <div className="mt-4 space-y-4 text-[1.02rem] leading-relaxed text-text-primary/74">
            {paragraphs.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>
          {event.facilitatorName ? (
            <div className="mt-8 flex gap-4 border-t border-accent/60 pt-6">
              {event.facilitatorImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={event.facilitatorImage}
                  alt={event.facilitatorName}
                  className="h-24 w-24 rounded-gentle object-cover"
                />
              ) : null}
              <div>
                <h3 className="text-xl font-semibold text-text-secondary">
                  {event.facilitatorName}
                </h3>
                {event.facilitatorRole ? (
                  <p className="text-sm text-text-primary/65">{event.facilitatorRole}</p>
                ) : null}
                {event.facilitatorBio ? (
                  <p className="mt-2 text-sm leading-relaxed text-text-primary/72">
                    {event.facilitatorBio}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </article>

        <aside className="h-fit rounded-calm bg-white p-5 shadow-soft md:p-6">
          <p className="text-sm text-text-primary/65">Your price</p>
          <p className="font-display text-4xl font-semibold text-text-primary">
            {event.priceForMe === 0 ? "Free" : formatCurrency(event.priceForMe)}
          </p>
          <p className="text-xs text-text-primary/45">
            {event.seatsRemaining} of {event.capacity} seats left
          </p>

          {event.isRegistered ? (
            <>
              <p className="mt-4 rounded-gentle bg-primary/10 px-3 py-2 text-sm font-semibold text-text-secondary">
                You are registered
              </p>
              <button
                type="button"
                onClick={() => cancelMutation.mutate(undefined)}
                disabled={cancelMutation.isPending}
                className="mt-3 w-full rounded-full border border-accent/80 px-5 py-3 text-sm font-semibold text-text-primary/75"
              >
                Cancel registration
              </button>
            </>
          ) : event.seatsRemaining > 0 ? (
            <button
              type="button"
              onClick={() => setRegisterOpen(true)}
              className="mt-6 w-full rounded-full bg-text-secondary px-5 py-3 text-base font-semibold text-white"
            >
              Register
            </button>
          ) : (
            <p className="mt-4 text-sm font-semibold text-[#cf4f45]">Event is full</p>
          )}

          {event.canManage ? (
            <button
              type="button"
              onClick={() => setShowRoster((v) => !v)}
              className="mt-3 w-full rounded-full border border-accent/80 px-5 py-2.5 text-sm font-semibold"
            >
              {showRoster ? "Hide" : "View"} registrations
            </button>
          ) : null}
        </aside>
      </section>

      {showRoster && rosterPath ? (
        <section className="space-y-3">
          <h2 className="font-display text-2xl font-semibold">Registrations</h2>
          <EventRegistrationsTable
            rows={rosterQuery.data ?? []}
            onCancel={(userId) => cancelMutation.mutate(userId)}
            cancellingUserId={
              cancelMutation.isPending ? (cancelMutation.variables ?? null) : null
            }
          />
        </section>
      ) : null}

      <EventRegisterModal
        event={event}
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSuccess={() => {
          void queryClient.invalidateQueries({ queryKey: ["event", slug] });
        }}
      />
    </FadeIn>
  );
}
