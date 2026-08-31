"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClubCreateRequestForm } from "@/components/clubs/club-create-request-form";
import { apiFetch } from "@/lib/api-client";
import type { ApiClubListResponse, ApiClubSummary } from "@/types/api";

export function ClubsOverviewPage() {
  const [showCreate, setShowCreate] = useState(false);

  const discoverQuery = useQuery({
    queryKey: ["clubs"],
    queryFn: () => apiFetch<ApiClubListResponse>("/api/clubs?take=10"),
  });

  const myQuery = useQuery({
    queryKey: ["clubs-my"],
    queryFn: () =>
      apiFetch<{ items: Array<ApiClubSummary & { membership: { status: string } }> }>(
        "/api/clubs/my",
      ),
  });

  const items = discoverQuery.data?.items ?? [];
  const myClubs = myQuery.data?.items ?? [];

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl font-semibold text-text-primary md:text-6xl">
            Clubs
          </h1>
          <p className="mt-3 max-w-xl text-lg text-text-primary/65">
            Discover circles, join with intention, and grow together.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-full bg-text-secondary px-8 py-3 text-sm font-semibold text-white shadow-sm"
        >
          {showCreate ? "Close form" : "Start a Club"}
        </button>
      </header>

      {showCreate ? (
        <ClubCreateRequestForm onSuccess={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />
      ) : null}

      {myClubs.length > 0 ? (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-text-primary/45">
            My clubs
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myClubs.map((club) => (
              <Link
                key={club.id}
                href={`/dashboard/clubs/${club.slug}`}
                className="overflow-hidden rounded-calm border border-primary/30 bg-white shadow-soft transition hover:shadow-soft-hover"
              >
                {club.heroImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={club.heroImageUrl} alt="" className="h-32 w-full object-cover" />
                ) : (
                  <div className="h-32 bg-primary/15" />
                )}
                <div className="p-4">
                  <p className="text-[10px] font-semibold uppercase text-text-primary/45">{club.sphere}</p>
                  <h3 className="font-display text-xl font-semibold text-text-primary">{club.title}</h3>
                  <p className="mt-1 text-xs text-text-primary/55">{club.membership.status}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-text-primary/45">
          Discover
        </h2>
        {discoverQuery.isLoading ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-calm bg-accent/40" />
            ))}
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((club) => (
              <Link
                key={club.id}
                href={`/dashboard/clubs/${club.slug}`}
                className="overflow-hidden rounded-calm border border-accent/60 bg-white shadow-soft transition hover:border-primary/30"
              >
                {club.heroImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={club.heroImageUrl} alt="" className="h-36 w-full object-cover" />
                ) : (
                  <div className="h-36 bg-accent/30" />
                )}
                <div className="p-4">
                  <p className="text-[10px] font-semibold uppercase text-text-primary/45">{club.sphere}</p>
                  <h3 className="font-display text-xl font-semibold text-text-primary">{club.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-text-primary/60">{club.subtitle}</p>
                  <p className="mt-2 text-xs font-semibold text-text-secondary">
                    ₹{club.monthlyFee}/mo · {club.memberCountLabel} members
                  </p>
                  {club.isMember ? (
                    <span className="mt-2 inline-block text-[10px] font-semibold uppercase text-primary">
                      Joined
                    </span>
                  ) : club.hasPendingJoin ? (
                    <span className="mt-2 inline-block text-[10px] font-semibold uppercase text-text-primary/45">
                      Pending
                    </span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
