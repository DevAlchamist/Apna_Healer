"use client";

import Link from "next/link";
import type { ApiJournalEntry } from "@/types/api";

function formatCardDate(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  const month = date.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();
  return `${month} ${day}, ${year}`;
}

type JournalEntryCardProps = {
  entry: ApiJournalEntry;
};

export function JournalEntryCard({ entry }: JournalEntryCardProps) {
  const href = `/dashboard/journal/${entry.id}`;
  const dateLabel = formatCardDate(entry.journalDateKey);

  if (entry.cardVariant === "IMAGE" && entry.coverImageUrl) {
    return (
      <Link
        href={href}
        className="group block break-inside-avoid overflow-hidden rounded-calm border border-accent/60 bg-white shadow-soft transition hover:shadow-soft-hover"
      >
        <div className="relative h-48 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={entry.coverImageUrl}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        </div>
        <div className="space-y-2 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-text-primary/45">
            {dateLabel}
          </p>
          <h3 className="font-display text-2xl font-semibold text-text-primary">
            {entry.title ?? "Untitled reflection"}
          </h3>
          {entry.excerpt ? (
            <p className="line-clamp-3 text-sm leading-relaxed text-text-primary/65">
              {entry.excerpt}
            </p>
          ) : null}
        </div>
      </Link>
    );
  }

  if (entry.cardVariant === "QUOTE") {
    return (
      <Link
        href={href}
        className="group block break-inside-avoid rounded-calm border border-accent/50 bg-[#f0efec] p-6 shadow-soft transition hover:shadow-soft-hover"
      >
        <div className="flex items-start justify-between gap-3">
          <span className="font-display text-5xl leading-none text-text-primary/20">&ldquo;</span>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-text-primary/45">
            {dateLabel}
          </p>
        </div>
        <p className="mt-4 font-display text-xl italic leading-relaxed text-text-primary/80">
          {entry.excerpt || entry.title}
        </p>
        {entry.tags.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {entry.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </Link>
    );
  }

  if (entry.cardVariant === "LIST") {
    return (
      <Link
        href={href}
        className="group block break-inside-avoid rounded-calm border border-accent/60 bg-white p-6 shadow-soft transition hover:shadow-soft-hover"
      >
        <p className="text-[11px] font-semibold uppercase tracking-widest text-text-primary/45">
          {dateLabel}
        </p>
        <h3 className="mt-2 font-display text-3xl font-semibold text-text-primary">
          {entry.title ?? "Reflection list"}
        </h3>
        <p className="mt-3 line-clamp-6 text-sm leading-relaxed text-text-primary/70 whitespace-pre-line">
          {entry.excerpt.replace(/•/g, "\n•")}
        </p>
      </Link>
    );
  }

  if (entry.cardVariant === "DARK") {
    return (
      <Link
        href={href}
        className="group block break-inside-avoid rounded-calm bg-[#2b3331] p-6 text-white shadow-soft transition hover:shadow-soft-hover"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
          Midnight reflection
        </p>
        <h3 className="mt-3 font-display text-3xl font-semibold leading-tight">
          {entry.title ?? "Night notes"}
        </h3>
        <p className="mt-4 line-clamp-4 text-sm italic leading-relaxed text-white/75">
          {entry.excerpt}
        </p>
        <p className="mt-4 text-[11px] uppercase tracking-widest text-white/40">{dateLabel}</p>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group block break-inside-avoid rounded-calm border border-accent/60 bg-white p-6 shadow-soft transition hover:shadow-soft-hover"
    >
      <span className="inline-block h-1 w-10 rounded-full bg-primary/70" />
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-text-primary/45">
        {dateLabel}
      </p>
      <h3 className="mt-2 font-display text-3xl font-semibold text-text-primary">
        {entry.title ?? "Reflection"}
      </h3>
      <p className="mt-3 line-clamp-5 text-sm leading-relaxed text-text-primary/70">
        {entry.excerpt}
      </p>
      <span className="mt-5 inline-block text-sm font-semibold text-text-secondary transition group-hover:underline">
        Read full reflection →
      </span>
    </Link>
  );
}
