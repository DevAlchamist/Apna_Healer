"use client";

import Link from "next/link";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { JournalEntryView } from "@/components/dashboard/journal-entry-view";
import { apiFetch } from "@/lib/api-client";
import type { ApiJournalEntry } from "@/types/api";

type JournalEntryViewPageProps = {
  params: Promise<{ id: string }>;
};

export function JournalEntryViewPage({ params }: JournalEntryViewPageProps) {
  const { id } = use(params);

  const entryQuery = useQuery({
    queryKey: ["journal-entry", id],
    queryFn: () => apiFetch<ApiJournalEntry>(`/api/journal/${id}`),
  });

  if (entryQuery.isLoading) {
    return (
      <div className="min-h-[70vh] animate-pulse rounded-calm bg-[#f9f8f4]">
        <div className="mx-auto max-w-3xl space-y-8 px-8 py-12">
          <div className="h-4 w-32 rounded bg-accent/50" />
          <div className="mx-auto h-8 w-48 rounded bg-accent/40" />
          <div className="h-64 rounded-[28px] bg-accent/30" />
        </div>
      </div>
    );
  }

  if (entryQuery.isError || !entryQuery.data) {
    return (
      <div className="rounded-calm border border-accent/60 bg-white px-8 py-16 text-center">
        <p className="font-display text-2xl font-semibold text-text-primary">
          Reflection not found
        </p>
        <Link
          href="/dashboard/journal"
          className="mt-4 inline-block text-sm font-semibold text-text-secondary hover:underline"
        >
          ← Back to garden
        </Link>
      </div>
    );
  }

  return <JournalEntryView entry={entryQuery.data} />;
}
