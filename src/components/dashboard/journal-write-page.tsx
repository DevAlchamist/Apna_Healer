"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { JournalEditor } from "@/components/dashboard/journal-editor";
import { JournalEntryCard } from "@/components/dashboard/journal-entry-card";
import { apiFetch } from "@/lib/api-client";
import type { ApiJournalListResponse, ApiJournalTodayPayload, ApiUser } from "@/types/api";

export function JournalWritePage() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");

  const userQuery = useQuery({
    queryKey: ["user-me"],
    queryFn: () => apiFetch<ApiUser>("/api/users/me"),
  });

  const dayQuery = useQuery({
    queryKey: ["journal-today", dateParam ?? "today"],
    queryFn: () => {
      const url = dateParam
        ? `/api/journal/today?date=${encodeURIComponent(dateParam)}`
        : "/api/journal/today";
      return apiFetch<ApiJournalTodayPayload>(url);
    },
  });

  const recentQuery = useQuery({
    queryKey: ["journal-recent"],
    queryFn: () => apiFetch<ApiJournalListResponse>("/api/journal?take=3"),
  });

  const isLoading = dayQuery.isLoading;
  const entry = dayQuery.data?.entry;
  const streak = dayQuery.data?.streak;
  const journalDateKey = dayQuery.data?.journalDateKey ?? dateParam ?? undefined;

  return (
    <div className="space-y-10 md:space-y-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-4 md:space-y-5">
          <Link
            href="/dashboard/journal"
            className="text-sm font-semibold text-text-secondary hover:underline"
          >
            ← Journal overview
          </Link>
          <h1 className="font-display text-5xl font-semibold text-text-primary md:text-6xl">
            How are you feeling, {userQuery.data?.name?.split(" ")[0] ?? "friend"}?
          </h1>
          <p className="max-w-xl text-lg text-text-primary/70">
            Take a moment to breathe. This space is yours, without judgment or distraction.
          </p>
        </div>
      </header>

      <section className="grid gap-8 xl:grid-cols-[220px_1fr] xl:gap-10">
        <aside className="space-y-6 pt-2 xl:pr-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-primary/45">
            Past reflections
          </p>
          {recentQuery.isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-gentle bg-accent/40" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {(recentQuery.data?.items ?? []).map((item) => (
                <Link
                  key={item.id}
                  href={`/dashboard/journal/${item.id}`}
                  className="block rounded-gentle border border-accent/50 bg-white/80 p-3 transition hover:border-primary/40"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-primary/45">
                    {item.journalDateKey}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-text-primary line-clamp-1">
                    {item.title ?? "Reflection"}
                  </p>
                </Link>
              ))}
            </div>
          )}
          <Link
            href="/dashboard/journal"
            className="inline-block pt-2 text-sm font-semibold uppercase tracking-wide text-text-secondary hover:underline"
          >
            View all →
          </Link>
        </aside>

        <div>
          {isLoading ? (
            <div className="h-[520px] animate-pulse rounded-calm bg-accent/30" />
          ) : (
            <JournalEditor
              journalDateKey={journalDateKey}
              userName={userQuery.data?.name}
              initialEntry={entry ?? null}
              initialStreak={streak}
            />
          )}
        </div>
      </section>

      {(recentQuery.data?.items.length ?? 0) > 0 ? (
        <section className="hidden border-t border-accent/60 pt-10 lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-primary/45">
            From your garden
          </p>
          <div className="mt-6 columns-1 gap-5 sm:columns-2">
            {(recentQuery.data?.items ?? []).map((item) => (
              <div key={item.id} className="mb-5">
                <JournalEntryCard entry={item} />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
