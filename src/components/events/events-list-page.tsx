"use client";

import { FadeIn, hoverLiftTransition, morphTransition } from "@/components/ui/fade-in";
import { featuredEvents } from "@/data/events";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/display";
import type { ApiEventListResponse } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

const eventFilters = ["All Events", "Anxiety", "Grief", "Mindfulness", "Sound Bath", "Trauma Healing"] as const;

type EventsListPageProps = {
  basePath: string;
};

export function EventsListPage({ basePath }: EventsListPageProps) {
  const [activeFilter, setActiveFilter] = useState<(typeof eventFilters)[number]>("All Events");

  const eventsQuery = useQuery({
    queryKey: ["events", activeFilter],
    queryFn: () =>
      apiFetch<ApiEventListResponse>(
        `/api/events?q=${encodeURIComponent(activeFilter === "All Events" ? "" : activeFilter)}`,
      ),
  });

  const items =
    eventsQuery.data?.items ??
    featuredEvents.map((e) => ({
      slug: e.id,
      title: e.title,
      host: e.host,
      excerpt: e.description,
      heroImageUrl: e.image,
      dateLabel: e.tag.split("·")[0]?.trim() ?? "",
      timeLabel: "",
      priceForMe: 0,
      seatsRemaining: 12,
      isRegistered: false,
    }));

  return (
    <FadeIn className="space-y-7 pb-4">
      <section className="space-y-5">
        <div>
          <h1 className="font-display text-4xl font-semibold text-text-primary md:text-5xl">
            Gatherings
          </h1>
          <p className="mt-1 text-sm text-text-primary/60">
            Discover collective healing experiences.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {eventFilters.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-text-secondary text-white"
                    : "bg-accent/50 text-text-primary/70 hover:bg-accent"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </section>

      {eventsQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-calm bg-accent/30" />
          ))}
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-3">
          {items.map((event, index) => (
            <motion.article
              key={event.slug}
              className="group overflow-hidden rounded-calm border border-accent/75 bg-white shadow-soft"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...morphTransition, delay: index * 0.04 }}
              whileHover={{ y: -4, transition: hoverLiftTransition }}
            >
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    event.heroImageUrl ??
                    "https://images.unsplash.com/photo-1514149358658-38dedeafd5f3?w=900&q=80"
                  }
                  alt={event.title}
                  className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-primary/65">
                  {event.dateLabel}
                </span>
                {event.isRegistered ? (
                  <span className="absolute right-3 top-3 rounded-full bg-text-secondary px-2 py-1 text-[10px] font-semibold text-white">
                    Registered
                  </span>
                ) : null}
              </div>

              <div className="space-y-3 px-4 pb-4 pt-3">
                <p className="text-[11px] text-text-primary/55">with {event.host}</p>
                <h2 className="text-2xl font-semibold leading-tight text-text-primary">
                  {event.title}
                </h2>
                <p className="text-sm leading-relaxed text-text-primary/62">{event.excerpt}</p>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs font-semibold text-text-secondary">
                    {event.priceForMe === 0 ? "Free" : formatCurrency(event.priceForMe)}
                  </p>
                  <Link
                    href={`${basePath}/${event.slug}`}
                    className="rounded-full bg-[#f2e8db] px-4 py-1.5 text-xs font-semibold text-text-primary/75 transition-colors hover:bg-[#e8dccd]"
                  >
                    Explore Event
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </section>
      )}
    </FadeIn>
  );
}
