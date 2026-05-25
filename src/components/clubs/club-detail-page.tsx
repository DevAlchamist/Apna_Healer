"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClubJoinModal } from "@/components/clubs/club-join-modal";
import { EventCreateForm } from "@/components/events/event-create-form";
import { apiFetch, apiMutation } from "@/lib/api-client";
import { formatCurrency } from "@/lib/display";
import type { ApiClubDetail, ApiClubJoinRequest, ApiEventSummary } from "@/types/api";

type ClubDetailPageProps = {
  slug: string;
};

export function ClubDetailPage({ slug }: ClubDetailPageProps) {
  const queryClient = useQueryClient();
  const [joinOpen, setJoinOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const clubQuery = useQuery({
    queryKey: ["club", slug],
    queryFn: () => apiFetch<ApiClubDetail>(`/api/clubs/${slug}`),
  });

  const joinQueueQuery = useQuery({
    queryKey: ["club-join-requests", slug],
    queryFn: () => apiFetch<ApiClubJoinRequest[]>(`/api/clubs/${slug}/join-requests?status=PENDING`),
    enabled: clubQuery.data?.canManageJoinRequests === true,
  });

  const clubEventsQuery = useQuery({
    queryKey: ["club-events", slug],
    queryFn: () => apiFetch<ApiEventSummary[]>(`/api/clubs/${slug}/events`),
    enabled: Boolean(clubQuery.data),
  });

  const reviewMutation = useMutation({
    mutationFn: (input: { reqId: string; status: "APPROVED" | "REJECTED" }) =>
      apiMutation(`/api/clubs/${slug}/join-requests/${input.reqId}`, "PATCH", {
        status: input.status,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["club", slug] });
      void queryClient.invalidateQueries({ queryKey: ["club-join-requests", slug] });
    },
  });

  const club = clubQuery.data;

  if (clubQuery.isLoading) {
    return <div className="h-96 animate-pulse rounded-calm bg-accent/30" />;
  }

  if (!club) {
    return (
      <div className="rounded-calm border border-dashed border-accent px-8 py-16 text-center">
        <p className="font-display text-2xl font-semibold">Club not found</p>
        <Link href="/dashboard/clubs" className="mt-4 inline-block text-sm font-semibold text-text-secondary">
          ← Back to clubs
        </Link>
      </div>
    );
  }

  const copyInvite = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-8">
      <Link href="/dashboard/clubs" className="text-sm font-semibold text-text-secondary hover:underline">
        ← Clubs
      </Link>

      <section className="relative overflow-hidden rounded-calm border border-accent/70">
        {club.heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={club.heroImageUrl} alt="" className="h-[230px] w-full object-cover md:h-[280px]" />
        ) : (
          <div className="h-[230px] bg-primary/15 md:h-[280px]" />
        )}
        <div className="absolute inset-0 bg-linear-to-r from-black/65 via-black/35 to-black/25" />
        <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">{club.sphere}</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-white md:text-6xl">{club.title}</h1>
          <p className="mt-3 max-w-2xl text-sm text-white/85 md:text-base">{club.subtitle}</p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div className="flex gap-10">
              <div>
                <p className="text-3xl font-semibold text-primary">{club.memberCountLabel}</p>
                <p className="text-[10px] font-semibold uppercase text-white/70">Members</p>
              </div>
              <div>
                <p className="text-3xl font-semibold text-primary">₹{club.monthlyFee}</p>
                <p className="text-[10px] font-semibold uppercase text-white/70">Per month</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => void copyInvite()}
                className="rounded-full border border-white/40 bg-white/10 px-6 py-2 text-sm font-semibold text-white"
              >
                {copied ? "Link copied" : "Invite"}
              </button>
              {club.isMember ? (
                <span className="rounded-full bg-primary/90 px-6 py-2 text-sm font-semibold text-white">
                  Member
                </span>
              ) : club.hasPendingJoin ? (
                <span className="rounded-full bg-white/20 px-6 py-2 text-sm font-semibold text-white">
                  Request pending
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setJoinOpen(true)}
                  className="rounded-full bg-text-secondary px-6 py-2 text-sm font-semibold text-white"
                >
                  Join Club
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {club.purpose ? (
        <section className="rounded-calm bg-white p-6 shadow-soft">
          <h2 className="font-display text-2xl font-semibold text-text-secondary">Purpose</h2>
          <p className="mt-3 text-text-primary/70 leading-relaxed">{club.purpose}</p>
        </section>
      ) : null}

      <section className="rounded-calm bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold text-text-secondary">Club events</h2>
          <Link
            href="/dashboard/events"
            className="text-sm font-semibold text-text-secondary hover:underline"
          >
            All events
          </Link>
        </div>
        {club.isOwner || club.canManageJoinRequests ? (
          <div className="mt-4">
            <EventCreateForm
              apiPath={`/api/clubs/${slug}/events`}
              onCreated={() => {
                void queryClient.invalidateQueries({ queryKey: ["club-events", slug] });
              }}
            />
          </div>
        ) : null}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {clubEventsQuery.data?.length ? (
            clubEventsQuery.data.map((ev) => (
              <Link
                key={ev.id}
                href={`/dashboard/events/${ev.slug}`}
                className="rounded-gentle border border-accent/60 p-4 transition hover:border-text-secondary/40"
              >
                <p className="font-semibold text-text-primary">{ev.title}</p>
                <p className="mt-1 text-xs text-text-primary/55">
                  {ev.dateLabel} · {ev.seatsRemaining} seats ·{" "}
                  {ev.priceForMe === 0 ? "Free" : formatCurrency(ev.priceForMe)}
                </p>
              </Link>
            ))
          ) : (
            <p className="text-sm text-text-primary/55">No events scheduled yet.</p>
          )}
        </div>
      </section>

      {club.canManageJoinRequests && (joinQueueQuery.data?.length ?? 0) > 0 ? (
        <section className="rounded-calm border border-accent/70 bg-white p-6">
          <h2 className="font-display text-2xl font-semibold text-text-secondary">Join requests</h2>
          <div className="mt-4 space-y-4">
            {joinQueueQuery.data?.map((req) => (
              <article key={req.id} className="rounded-gentle border border-accent/60 p-4">
                <p className="text-sm font-semibold text-text-primary">
                  {req.user?.name ?? req.user?.email ?? "Member"}
                </p>
                <p className="mt-2 text-sm text-text-primary/65">{req.message}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={reviewMutation.isPending}
                    onClick={() => reviewMutation.mutate({ reqId: req.id, status: "APPROVED" })}
                    className="rounded-full bg-text-secondary px-4 py-1.5 text-xs font-semibold text-white"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={reviewMutation.isPending}
                    onClick={() => reviewMutation.mutate({ reqId: req.id, status: "REJECTED" })}
                    className="rounded-full border border-accent px-4 py-1.5 text-xs font-semibold"
                  >
                    Decline
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {club.reviews.length > 0 ? (
        <section className="rounded-calm bg-white p-6 shadow-soft">
          <h2 className="font-display text-2xl font-semibold text-text-secondary">Reflections</h2>
          <div className="mt-4 space-y-4">
            {club.reviews.map((r) => (
              <blockquote key={r.id} className="border-l-2 border-primary/40 pl-4">
                <p className="text-sm italic text-text-primary/75">&ldquo;{r.quote}&rdquo;</p>
                <footer className="mt-2 text-xs font-semibold text-text-primary/45">— {r.authorLabel}</footer>
              </blockquote>
            ))}
          </div>
        </section>
      ) : null}

      <ClubJoinModal club={club} open={joinOpen} onClose={() => setJoinOpen(false)} />
    </div>
  );
}
