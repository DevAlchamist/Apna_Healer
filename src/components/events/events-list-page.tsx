"use client";

import { FadeIn, hoverLiftTransition, morphTransition } from "@/components/ui/fade-in";
import { featuredEvents } from "@/data/events";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

const dateChips = [
  { day: "14", month: "OCT", weekDay: "Today" },
  { day: "15", month: "OCT", weekDay: "Tue" },
  { day: "16", month: "OCT", weekDay: "Wed" },
  { day: "17", month: "OCT", weekDay: "Thu" },
  { day: "18", month: "OCT", weekDay: "Fri" },
  { day: "19", month: "OCT", weekDay: "Sat" },
  { day: "20", month: "OCT", weekDay: "Sun" },
];

const eventFilters = ["All Events", "Anxiety", "Grief", "Mindfulness", "Sound Bath", "Trauma Healing"] as const;

const trendingNow = [
  {
    title: "Virtual Forest Walk",
    subtitle: "A high-definition sensory journey through the...",
    badge: "HOT",
    image: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=500&q=80&auto=format&fit=crop",
  },
  {
    title: "Tea & Breath Circle",
    subtitle: "Exploring Zen philosophy through the ritual of tea.",
    badge: "EXCLUSIVE",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&q=80&auto=format&fit=crop",
  },
  {
    title: "Moon Phase Ritual",
    subtitle: "Align your intentions with the lunar cycle.",
    badge: "NEW",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&q=80&auto=format&fit=crop",
  },
];

type EventsListPageProps = {
  basePath: string;
};

export function EventsListPage({ basePath }: EventsListPageProps) {
  const [activeDate, setActiveDate] = useState("14");
  const [activeFilter, setActiveFilter] = useState<(typeof eventFilters)[number]>("All Events");

  return (
    <FadeIn className="space-y-7 pb-4">
      <section className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-semibold text-text-primary md:text-5xl">Gatherings</h1>
            <p className="mt-1 text-sm text-text-primary/60">Discover collective healing experiences.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/50 text-text-primary/60 transition-colors hover:bg-accent"
            >
              ‹
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/50 text-text-primary/60 transition-colors hover:bg-accent"
            >
              ›
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {dateChips.map((chip) => {
            const isActive = activeDate === chip.day;
            return (
              <motion.button
                key={chip.day}
                type="button"
                onClick={() => setActiveDate(chip.day)}
                className={`rounded-gentle border px-3 py-2 text-center transition-colors ${
                  isActive
                    ? "border-text-secondary bg-text-secondary text-white"
                    : "border-accent/80 bg-[#f6f6f6] text-text-primary/65 hover:bg-accent/45"
                }`}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={hoverLiftTransition}
              >
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em]">{chip.month}</p>
                <p className="text-lg font-semibold leading-tight">{chip.day}</p>
                <p className="text-[11px] font-medium">{chip.weekDay}</p>
              </motion.button>
            );
          })}
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
                  isActive ? "bg-text-secondary text-white" : "bg-accent/50 text-text-primary/70 hover:bg-accent"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_250px]">
        <div className="grid gap-4 md:grid-cols-3">
          {featuredEvents.map((event, index) => (
            <motion.article
              key={event.title}
              className="group overflow-hidden rounded-calm border border-accent/75 bg-white shadow-soft"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...morphTransition, delay: index * 0.04 }}
              whileHover={{ y: -4, transition: hoverLiftTransition }}
            >
              <div className="relative">
                <img
                  src={event.image}
                  alt={event.title}
                  className="h-40 w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.04]"
                />
                <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-primary/65">
                  {event.tag}
                </span>
                <button
                  type="button"
                  aria-label="Save event"
                  className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-xs text-text-primary/55"
                >
                  ♡
                </button>
              </div>

              <div className="space-y-3 px-4 pb-4 pt-3">
                <p className="text-[11px] text-text-primary/55">with {event.host}</p>
                <h2 className="text-2xl font-semibold leading-tight text-text-primary">{event.title}</h2>
                <p className="text-sm leading-relaxed text-text-primary/62">{event.description}</p>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-text-primary/55">+{event.likes}</p>
                  <Link
                    href={`${basePath}/${event.id}`}
                    className="rounded-full bg-[#f2e8db] px-4 py-1.5 text-xs font-semibold text-text-primary/75 transition-colors hover:bg-[#e8dccd]"
                  >
                    Explore Event
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <aside className="rounded-calm bg-[#f5f3ef] p-4">
          <h3 className="text-xl font-semibold text-text-primary">Trending Now</h3>

          <div className="mt-4 space-y-3">
            {trendingNow.map((item) => (
              <article key={item.title} className="flex items-start gap-3 rounded-gentle bg-white/70 p-2.5">
                <img src={item.image} alt={item.title} className="h-14 w-14 rounded-soft object-cover" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">{item.badge}</p>
                  <p className="text-sm font-semibold leading-snug text-text-primary">{item.title}</p>
                  <p className="text-[11px] text-text-primary/55">{item.subtitle}</p>
                </div>
              </article>
            ))}
          </div>

          <button
            type="button"
            className="mt-4 w-full rounded-full bg-[#e9e1d6] px-4 py-2 text-xs font-semibold text-text-primary/75 transition-colors hover:bg-[#ded3c4]"
          >
            View Community Board
          </button>
        </aside>
      </section>
    </FadeIn>
  );
}
