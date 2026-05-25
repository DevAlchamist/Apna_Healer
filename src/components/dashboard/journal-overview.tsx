"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { JournalEntryCard } from "@/components/dashboard/journal-entry-card";
import { JournalSearch } from "@/components/dashboard/journal-search";
import { apiFetch } from "@/lib/api-client";
import type { ApiJournalListResponse, ApiJournalTodayPayload } from "@/types/api";

export function JournalOverview() {
  const [search, setSearch] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [allItems, setAllItems] = useState<ApiJournalListResponse["items"]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const todayQuery = useQuery({
    queryKey: ["journal-today"],
    queryFn: () => apiFetch<ApiJournalTodayPayload>("/api/journal/today"),
  });

  const listQuery = useQuery({
    queryKey: ["journal-list", debouncedQ, cursor],
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedQ) params.set("q", debouncedQ);
      if (cursor) params.set("cursor", cursor);
      params.set("take", "24");
      return apiFetch<ApiJournalListResponse>(`/api/journal?${params.toString()}`);
    },
  });

  const today = todayQuery.data;
  const total = listQuery.data?.meta.total ?? 0;
  const nextCursor = listQuery.data?.meta.nextCursor ?? null;

  useEffect(() => {
    if (!listQuery.data) return;
    if (!cursor) {
      setAllItems(listQuery.data.items);
    } else {
      setAllItems((prev) => {
        const ids = new Set(prev.map((e) => e.id));
        const merged = [...prev];
        for (const item of listQuery.data.items) {
          if (!ids.has(item.id)) merged.push(item);
        }
        return merged;
      });
    }
  }, [listQuery.data, cursor]);

  useEffect(() => {
    setCursor(null);
  }, [debouncedQ]);

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-5xl font-semibold text-text-primary md:text-6xl">
            Journal Overview
          </h1>
          <p className="mt-3 max-w-xl text-lg text-text-primary/65">
            Your reflections, gathered like leaves in a quiet garden.
          </p>
        </div>
        <Link
          href="/dashboard/journal/write"
          className={`rounded-full px-8 py-3 text-sm font-semibold text-white shadow-sm transition ${
            today?.streak.todayCompleted
              ? "bg-text-primary/75 hover:bg-text-primary/85"
              : "bg-text-secondary hover:bg-primary"
          }`}
        >
          {today?.streak.todayCompleted ? "Edit today's entry" : "Write today's reflection"}
        </Link>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 max-w-3xl">
          <JournalSearch
            value={search}
            onChange={setSearch}
            resultCount={debouncedQ ? total : undefined}
            isSearching={listQuery.isFetching && Boolean(debouncedQ)}
            totalInGarden={debouncedQ ? undefined : total}
          />
        </div>
        {today?.streak ? (
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            className="shrink-0 rounded-[1.25rem] border border-accent/60 bg-white/80 px-5 py-4 text-center lg:text-right"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-primary/40">
              Daily rhythm
            </p>
            <p className="mt-1 font-display text-3xl font-semibold text-text-secondary">
              {today.streak.currentStreak > 0
                ? `${today.streak.currentStreak}🔥`
                : "—"}
            </p>
            <p className="mt-0.5 text-xs text-text-primary/55">
              {today.streak.currentStreak > 0
                ? "day streak blooming"
                : "Plant today's reflection"}
            </p>
          </motion.div>
        ) : null}
      </div>

      {listQuery.isLoading ? (
        <div className="columns-1 gap-5 sm:columns-2 xl:columns-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="mb-5 h-56 animate-pulse break-inside-avoid rounded-calm bg-accent/40"
            />
          ))}
        </div>
      ) : allItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-calm border border-dashed border-accent/80 bg-[radial-gradient(circle_at_50%_0%,rgb(127_175_154/12%),transparent_55%)] px-8 py-16 text-center"
        >
          <p className="text-4xl" aria-hidden>
            {debouncedQ ? "🍃" : "🌱"}
          </p>
          <p className="mt-4 font-display text-2xl font-semibold text-text-primary">
            {debouncedQ ? "The path goes quiet here" : "Your garden awaits its first seed"}
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-text-primary/60">
            {debouncedQ
              ? `Nothing answered to "${debouncedQ}" yet. Try a whisper below, or wander with fewer words.`
              : "Write your first reflection and watch it take root among the others."}
          </p>
          {debouncedQ ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="mt-6 rounded-full border border-text-secondary/30 px-6 py-2.5 text-sm font-semibold text-text-secondary transition hover:bg-primary/10"
            >
              Clear and stroll the full garden
            </button>
          ) : (
            <Link
              href="/dashboard/journal/write"
              className="mt-6 inline-block rounded-full bg-text-secondary px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary"
            >
              Plant today's reflection
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="columns-1 gap-5 sm:columns-2 xl:columns-3">
          {allItems.map((entry) => (
            <div key={entry.id} className="mb-5">
              <JournalEntryCard entry={entry} />
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col items-center gap-3 pt-4">
        {nextCursor ? (
          <button
            type="button"
            onClick={() => setCursor(nextCursor)}
            className="rounded-full border border-text-secondary/40 px-10 py-3 text-sm font-semibold text-text-secondary transition hover:bg-accent/40"
          >
            Journey further back
          </button>
        ) : null}
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-primary/40">
          {total} {total === 1 ? "entry" : "entries"} in your garden
        </p>
      </div>
    </div>
  );
}
