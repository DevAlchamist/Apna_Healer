"use client";

import { easeCalm, FadeIn, hoverLiftTransition, morphTransition } from "@/components/ui/fade-in";
import { motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";

type DiscoverFilter = "all" | "mindfulness" | "grief" | "anxiety";

const discoverCommunities = [
  {
    id: "breathwork-basics",
    title: "Breathwork Basics",
    souls: 842,
    description: "Guided breathing patterns to calm the nervous system and restore balance, one inhale at a time.",
    category: "Mindfulness" as const,
    tag: "MINDFULNESS",
    image:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80&auto=format&fit=crop",
  },
  {
    id: "quiet-minds-circle",
    title: "Quiet Minds Circle",
    souls: 1204,
    description: "A gentle space for anxious thoughts—share tools, grounding exercises, and steady company.",
    category: "Anxiety" as const,
    tag: "ANXIETY",
    image:
      "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=600&q=80&auto=format&fit=crop",
  },
  {
    id: "walks-in-stillness",
    title: "Walks in Stillness",
    souls: 391,
    description: "Nature-inspired reflections and seasonal rituals to reconnect with the world outside your window.",
    category: "Mindfulness" as const,
    tag: "NATURE",
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80&auto=format&fit=crop",
  },
  {
    id: "ink-and-insight",
    title: "Ink & Insight",
    souls: 560,
    description: "Creative journaling and expressive arts—process feelings through color, line, and story.",
    category: "Mindfulness" as const,
    tag: "CREATIVE",
    image:
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80&auto=format&fit=crop",
  },
  {
    id: "holding-space",
    title: "Holding Space",
    souls: 678,
    description: "For anyone carrying grief—share memories, anniversaries, and the uneven path of healing.",
    category: "Grief" as const,
    tag: "GRIEF",
    image:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80&auto=format&fit=crop",
  },
];

const filters: { id: DiscoverFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "mindfulness", label: "Mindfulness" },
  { id: "grief", label: "Grief" },
  { id: "anxiety", label: "Anxiety" },
];

function GriefIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="10" cy="9" r="3.5" />
      <path d="M6 21v-1a4 4 0 0 1 8 0v1" strokeLinecap="round" />
      <circle cx="17.5" cy="10.5" r="2.25" stroke="currentColor" opacity="0.75" />
      <path d="M17.5 9v3M16.1 10.5h2.8" strokeLinecap="round" opacity="0.75" />
    </svg>
  );
}

export default function ClubsPage() {
  const [filter, setFilter] = useState<DiscoverFilter>("all");

  const filteredDiscover = useMemo(() => {
    if (filter === "all") return discoverCommunities;
    return discoverCommunities.filter((c) => c.category.toLowerCase() === filter);
  }, [filter]);

  return (
    <FadeIn className="space-y-14 pb-6 md:space-y-16 md:pb-8">
      <motion.header
        className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={morphTransition}
      >
        <motion.div
          className="max-w-2xl space-y-4 md:space-y-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...morphTransition, delay: 0.05 }}
        >
          <h1 className="font-display text-4xl font-semibold tracking-tight text-text-primary md:text-5xl">
            Find your tribe
          </h1>
          <p className="text-base leading-relaxed text-text-primary/70 md:text-lg">
            Connect with souls on similar journeys. Moderated spaces for healing together. Experience the warmth of
            shared silence and collective resilience.
          </p>
        </motion.div>
        <motion.button
          type="button"
          className="shrink-0 self-start rounded-full border border-text-primary/20 bg-white px-6 py-3 text-sm font-semibold text-text-primary shadow-sm transition-colors duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-text-primary/40 hover:bg-accent/35 lg:mt-1"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...morphTransition, delay: 0.12 }}
          whileHover={{ scale: 1.03, y: -2, transition: hoverLiftTransition }}
          whileTap={{ scale: 0.98 }}
        >
          Start a Club
        </motion.button>
      </motion.header>

      <section className="space-y-6 md:space-y-7">
        <h2 className="font-display text-2xl font-semibold text-text-primary">My Clubs</h2>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-8">
          <motion.article
            className="group relative overflow-hidden rounded-calm border border-primary/20 bg-linear-to-br from-primary/20 via-primary/10 to-white p-6 shadow-soft transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-primary/35 hover:shadow-soft-hover md:p-9"
            whileHover={{ y: -6, transition: hoverLiftTransition }}
          >
            <span className="inline-flex rounded-full bg-primary/35 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
              Active now
            </span>
            <div className="relative z-10 mt-5 max-w-[min(100%,420px)] pr-0 md:pr-36">
              <h3 className="font-display text-2xl font-semibold text-text-secondary">Morning Meditators</h3>
              <p className="mt-3 text-sm leading-relaxed text-text-primary/75 md:text-base">
                Daily sunrise sessions focusing on mindful breathing and gratitude. Join the live circle in 15 mins.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-5">
                <div className="flex -space-x-2.5">
                  {["from-[#c4a882]", "from-[#8fa89a]", "from-[#9b8aa8]"].map((gradient, i) => (
                    <span
                      key={i}
                      className={`inline-flex h-9 w-9 rounded-full border-2 border-white bg-linear-to-br ${gradient} to-text-primary/20 ring-1 ring-text-primary/10`}
                      aria-hidden
                    />
                  ))}
                  <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border-2 border-white bg-white px-2 text-xs font-semibold text-text-secondary ring-1 ring-text-primary/10">
                    +42
                  </span>
                </div>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={hoverLiftTransition}>
                  <Link
                    href="/dashboard/clubs/morning-meditators"
                    className="inline-flex rounded-full bg-text-secondary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[0_10px_28px_-8px_rgb(47_93_80/45%)]"
                  >
                    Enter Circle
                  </Link>
                </motion.div>
              </div>
            </div>
            <div className="pointer-events-none absolute -bottom-6 -right-8 h-44 w-44 rounded-full border-[5px] border-white/90 shadow-[0_12px_40px_-12px_rgb(47_93_80/35%)] transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-105 md:-right-4 md:bottom-auto md:top-1/2 md:h-52 md:w-52 md:-translate-y-1/2">
              <img
                src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&q=80&auto=format&fit=crop"
                alt=""
                className="h-full w-full rounded-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-110"
              />
            </div>
          </motion.article>

          <motion.article
            className="flex flex-col rounded-calm border border-accent/80 bg-[#ebe3d8] p-6 shadow-soft transition-[border-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-accent hover:shadow-soft-hover md:p-8"
            whileHover={{ y: -5, scale: 1.01, transition: hoverLiftTransition }}
          >
            <GriefIcon className="h-9 w-9 shrink-0 text-text-primary/55" />
            <h3 className="mt-5 font-display text-xl font-semibold text-text-primary">Grief &amp; Grace</h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-text-primary/70">
              A sanctuary for those navigating loss. Weekly sharing circles every Thursday.
            </p>
            <div className="mt-auto space-y-3 pt-8">
              <p className="text-xs font-semibold text-text-secondary">Next meeting: Tomorrow, 6:00 PM</p>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/60">
                <div className="h-full w-[62%] rounded-full bg-text-secondary" />
              </div>
              <Link
                href="/dashboard/clubs/grief-and-grace"
                className="inline-flex text-xs font-semibold text-text-secondary underline-offset-4 hover:underline"
              >
                View Club
              </Link>
            </div>
          </motion.article>
        </div>
      </section>

      <section className="space-y-7 md:space-y-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between md:gap-6">
          <h2 className="font-display text-2xl font-semibold text-text-primary">Discover Communities</h2>
          <div className="flex flex-wrap gap-2.5">
            {filters.map((f) => {
              const isActive = filter === f.id;
              return (
                <motion.button
                  key={f.id}
                  type="button"
                  layout
                  onClick={() => setFilter(f.id)}
                  className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-colors duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                    isActive
                      ? "bg-text-secondary text-white shadow-sm ring-0"
                      : "bg-white/90 text-text-primary/65 ring-1 ring-text-primary/10 hover:bg-accent/45 hover:ring-text-primary/20"
                  }`}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{
                    layout: { duration: 0.4, ease: easeCalm },
                    ...hoverLiftTransition,
                  }}
                >
                  {f.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 sm:gap-7 xl:grid-cols-3 xl:gap-8">
          {filteredDiscover.map((club, index) => (
            <motion.article
              key={club.id}
              className="group flex flex-col overflow-hidden rounded-calm border border-accent/70 bg-white shadow-soft transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-primary/25 hover:shadow-soft-hover"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...morphTransition, delay: 0.04 + index * 0.05 }}
              whileHover={{ y: -6, transition: hoverLiftTransition }}
            >
              <div className="relative aspect-4/3 overflow-hidden bg-accent/40">
                <img
                  src={club.image}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-620 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.07]"
                />
                <span className="absolute left-4 top-4 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-105">
                  {club.tag}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-display text-lg font-semibold text-text-primary">{club.title}</h3>
                <p className="mt-1.5 text-xs font-medium text-text-primary/45">{club.souls.toLocaleString()} Souls Healing</p>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-text-primary/65">{club.description}</p>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={hoverLiftTransition}>
                  <Link
                    href={`/dashboard/clubs/${club.id}`}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-gentle bg-accent/50 py-3.5 text-sm font-semibold text-text-primary/80 transition-colors duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-accent/85"
                  >
                    Join Club
                  </Link>
                </motion.div>
              </div>
            </motion.article>
          ))}

          <motion.article
            className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-calm border border-dashed border-primary/40 bg-primary/15 px-6 py-10 text-center shadow-soft transition-[border-color,background-color] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-primary/55 hover:bg-primary/22 sm:col-span-2 sm:min-h-0 sm:gap-5 sm:py-12 xl:col-span-1"
            whileHover={{ y: -4, transition: hoverLiftTransition }}
          >
            <motion.span
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl font-light text-text-secondary shadow-sm"
              whileHover={{ rotate: 90, scale: 1.08 }}
              transition={hoverLiftTransition}
            >
              +
            </motion.span>
            <h3 className="font-display text-xl font-semibold text-text-secondary">Build Your Space</h3>
            <p className="max-w-xs px-2 text-sm leading-relaxed text-text-secondary/90">
              Can&apos;t find what you&apos;re looking for? Start a new moderated circle tailored to your needs.
            </p>
            <motion.button
              type="button"
              className="mt-1 rounded-full bg-text-secondary px-8 py-3 text-sm font-semibold text-white transition-shadow duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[0_10px_28px_-8px_rgb(47_93_80/45%)]"
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={hoverLiftTransition}
            >
              Create Club
            </motion.button>
          </motion.article>
        </div>

        {filteredDiscover.length === 0 ? (
          <p className="pt-2 text-center text-sm text-text-primary/60">No communities in this category yet.</p>
        ) : null}
      </section>
    </FadeIn>
  );
}
