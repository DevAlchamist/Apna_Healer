"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useSession, signIn } from "next-auth/react";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  TelescopeIcon,
  UsersIcon,
  CoffeeIcon,
  FeatherIcon,
  MoonIcon,
  SunriseIcon,
  GlobeIcon,
  VideoIcon,
  EyeIcon,
  SproutIcon,
  WindIcon,
} from "lucide-react";

import { LandingFooter } from "@/components/landing/footer";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingJoinModal } from "@/components/landing/landing-join-modal";
import { useListenerSupportModal } from "@/components/dashboard/listener-support-modal";
import { apiFetch } from "@/lib/api-client";
import type { ApiPublicEventSummary } from "@/types/api";

// ==========================================
// STATIC & FALLBACK DATA CONSTANTS
// ==========================================

const seasonalSlides = [
  {
    id: "ss-1",
    season: "This season",
    title: "Sunrise Breath Circles",
    body: "Forty minutes of shared breathing as the light comes in. Nothing to prepare, nothing to say.",
    image: "/222e4769-9762-44c1-9667-c0294d0196da.jpg",
    dates: "Every Sunday · Aug – Oct",
    accent: "sage",
  },
  {
    id: "ss-2",
    season: "Monsoon series",
    title: "Lantern Evenings",
    body: "Rain, warm cups and slow conversation on the terrace. Come with whatever your week left behind.",
    image: "/ea5b1d91-ae3a-4a3f-97e8-deb26bbf2973.jpg",
    dates: "Friday evenings · Aug 15 – Sep 26",
    accent: "lavender",
  },
  {
    id: "ss-3",
    season: "Coming soon",
    title: "The Quiet Weekend",
    body: "A two-day silent retreat in the hills, held in small groups of twelve with two facilitators.",
    image: "/ddf1108e-1f15-41ca-bdf7-37c0f9d98f40.jpg",
    dates: "Nov 21 – 23 · Registrations open Sep 1",
    accent: "peach",
  },
] as const;

const gatherings = [
  {
    id: "e-1",
    title: "Sound Bath for Overthinkers",
    description:
      "Ninety minutes of Himalayan bowls, held in a dim room where you can simply lie down. No mantras, no chanting, no expectation to feel anything in particular.",
    intent: "Deep Breath",
    tags: ["Sound healing", "Beginner friendly"],
    image: "/ff2eb942-e9e4-4696-8019-e28614632b1a.jpg",
    host: "Meher Qureshi",
    hostRole: "Sound practitioner",
    date: "Sat, 16 Aug",
    time: "7:00 – 8:30 PM",
    place: "The Atrium, Bandra · Mumbai",
    seats: "9 of 24 places left",
    status: "upcoming",
    cta: "Reserve your place",
  },
  {
    id: "e-2",
    title: "Slow Flow in the Park",
    description:
      "A gentle outdoor practice at first light, followed by chai on the grass. Bodies of every shape and stiffness genuinely welcome.",
    intent: "Active Flow",
    tags: ["Movement", "Outdoors"],
    image: "/3b7b64b7-0f5f-4f83-9a87-feaa5782509d.jpg",
    host: "Dev Menon",
    hostRole: "Movement guide",
    date: "Sun, 17 Aug",
    time: "6:15 – 7:30 AM",
    place: "Cubbon Park · Bengaluru",
    seats: "Free · 30 places",
    status: "upcoming",
    cta: "Reserve your place",
  },
  {
    id: "e-3",
    title: "Pages & Pauses: A Journaling Table",
    description:
      "Three guided prompts, long stretches of quiet writing, and an optional sharing round at the end. Notebooks and tea provided.",
    intent: "Mental Clarity",
    tags: ["Journaling", "Small group"],
    image: "/07e4ccee-d987-4998-831c-39afb9fce3a5.jpg",
    host: "Riya Menon",
    hostRole: "Therapist & facilitator",
    date: "Wed, 20 Aug",
    time: "6:30 – 8:00 PM",
    place: "Online · Zoom room",
    seats: "12 places only",
    status: "upcoming",
    cta: "View Itinerary",
  },
  {
    id: "e-4",
    title: "Moonlight Wind-Down",
    description:
      "A late-night ritual for restless minds — dimmed lights, a body scan, and a slow letter to tomorrow. Come in whatever you sleep in.",
    intent: "Night Rituals",
    tags: ["Sleep", "Online"],
    image: "/f2d2766d-5094-40da-b75f-432ea3964258.jpg",
    host: "Zoya Rahman",
    hostRole: "Peer listener",
    date: "Every Thu",
    time: "10:30 – 11:15 PM",
    place: "Online · Apna Healer rooms",
    seats: "Free · unlimited",
    status: "upcoming",
    cta: "Reserve your place",
  },
  {
    id: "e-5",
    title: "The Silent Morning Walk",
    description:
      "Two hours of walking together without speaking, ending with breakfast where you can talk as much as you like. Surprisingly emotional, we are told.",
    intent: "Silent Retreats",
    tags: ["Silence", "Outdoors"],
    image: "/172b7e51-6aef-494e-87c7-d72a94e1ea74.jpg",
    host: "Nikhil Rao",
    hostRole: "Circle steward",
    date: "Sat, 23 Aug",
    time: "5:45 – 8:00 AM",
    place: "Aravalli Biodiversity Park · Gurgaon",
    seats: "16 places",
    status: "upcoming",
    cta: "View Itinerary",
  },
  {
    id: "e-6",
    title: "The Long Table Tea Circle",
    description:
      "One question, one pot of tea, and a room of strangers who leave a little less strange. Hosted on the last Sunday of every month.",
    intent: "Mental Clarity",
    tags: ["Community", "Conversation"],
    image: "/d41e296e-91de-4650-98b2-2aa6b6f55eb3.jpg",
    host: "Tanvi Joshi",
    hostRole: "Community host",
    date: "Sun, 31 Aug",
    time: "4:30 – 6:30 PM",
    place: "The Atrium, Hauz Khas · Delhi NCR",
    seats: "20 places",
    status: "upcoming",
    cta: "Reserve your place",
  },
  {
    id: "e-7",
    title: "Sunrise Breath: July Edition",
    description:
      "Forty-two people breathed together as the sun came up over the hall. The recap holds the guided audio and a few words from those who came.",
    intent: "Deep Breath",
    tags: ["Recap", "Audio included"],
    image: "/222e4769-9762-44c1-9667-c0294d0196da.jpg",
    host: "Meher Qureshi",
    hostRole: "Sound practitioner",
    date: "Sun, 20 Jul",
    time: "Held at 6:00 AM",
    place: "The Atrium, Bandra · Mumbai",
    seats: "42 people gathered",
    status: "completed",
    cta: "View Event Recap",
  },
  {
    id: "e-8",
    title: "Lantern Evening: The First One",
    description:
      "Our opening monsoon terrace evening — lanterns, one shared question, and a lot of rain. Photographs and reflections inside.",
    intent: "Night Rituals",
    tags: ["Recap", "Photos"],
    image: "/ea5b1d91-ae3a-4a3f-97e8-deb26bbf2973.jpg",
    host: "Tanvi Joshi",
    hostRole: "Community host",
    date: "Fri, 11 Jul",
    time: "Held at 8:00 PM",
    place: "The Atrium, Hauz Khas · Delhi NCR",
    seats: "28 people gathered",
    status: "completed",
    cta: "View Event Recap",
  },
] as const;

const atriumRituals = [
  {
    id: "a-1",
    name: "Morning Grounding",
    schedule: "Every day · 7:00 AM",
    description: "Ten minutes of breath and a single intention, held open in the online atrium.",
    accent: "sage",
    icon: "sunrise",
  },
  {
    id: "a-2",
    name: "The Midday Pause",
    schedule: "Weekdays · 1:30 PM",
    description: "A five-minute stretch and screen break, cameras off, no talking required.",
    accent: "peach",
    icon: "coffee",
  },
  {
    id: "a-3",
    name: "Evening Unwinding",
    schedule: "Every day · 9:00 PM",
    description: "A quiet room where you can journal alongside others before the day closes.",
    accent: "lavender",
    icon: "moon",
  },
  {
    id: "a-4",
    name: "Sunday Reflection",
    schedule: "Sundays · 11:00 AM",
    description: "One gentle question for the week that was, answered aloud or in the chat.",
    accent: "sage",
    icon: "feather",
  },
] as const;

const intentFilters = [
  "All Paths",
  "Deep Breath",
  "Active Flow",
  "Mental Clarity",
  "Night Rituals",
  "Silent Retreats",
] as const;

const overlay: Record<string, string> = {
  sage: "from-sage-700/80 via-sage-700/35",
  lavender: "from-lavender-700/80 via-lavender-700/35",
  peach: "from-peach-600/80 via-peach-600/35",
};

const atriumIcons = {
  sunrise: SunriseIcon,
  coffee: CoffeeIcon,
  moon: MoonIcon,
  feather: FeatherIcon,
};

const atriumAccents = {
  sage: "bg-sage-100 text-sage-700",
  lavender: "bg-lavender-100 text-lavender-700",
  peach: "bg-peach-100 text-peach-600",
};

const spotlightDetails = [
  { icon: CalendarDaysIcon, label: "Friday, 29 August" },
  { icon: ClockIcon, label: "8:30 – 9:45 PM IST" },
  { icon: GlobeIcon, label: "Online · open worldwide" },
];

const whyGatherIdeas = [
  {
    title: "The Root Effect",
    body: "Loneliness eases fastest in shared rooms. Showing up regularly, even silently, quietly rebuilds the sense that you belong somewhere.",
    icon: SproutIcon,
    tone: "text-sage-600 bg-sage-100",
  },
  {
    title: "Ephemeral Magic",
    body: "A gathering happens once and then it is gone. That impermanence is the point — it asks nothing of your future self.",
    icon: WindIcon,
    tone: "text-lavender-600 bg-lavender-100",
  },
  {
    title: "Sacred Witness",
    body: "Being seen without being fixed is its own medicine. Here, no one advises you unless you ask them to.",
    icon: EyeIcon,
    tone: "text-peach-500 bg-peach-100",
  },
];

// ==========================================
// SUB-COMPONENTS
// ==========================================

function SacredSpacesHero({ upcomingCount }: { upcomingCount: number }) {
  return (
    <section aria-labelledby="events-title" className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-260px] h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(202,223,195,0.45),transparent_65%)]" />
        <div className="absolute -left-24 top-24 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_center,rgba(247,212,189,0.4),transparent_65%)]" />
        <div className="absolute -right-20 top-10 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle_at_center,rgba(218,209,240,0.4),transparent_65%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-3xl px-5 pb-12 pt-20 text-center sm:px-8 lg:pb-16 lg:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-cream-300 bg-cream-50/80 px-4 py-2 text-xs font-medium text-ink-500 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-sage-400" />
            {upcomingCount} gatherings open right now
          </span>

          <h1 id="events-title" className="mt-7 font-display text-[2.75rem] leading-[1.05] tracking-tight text-ink-900 sm:text-6xl font-semibold">
            Event <span className="italic text-sage-600 font-normal">Spaces</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-500 sm:text-lg">
            Small gatherings where healing happens sideways — through breath, movement, silence and the simple relief of being in a room
            with people who understand. Come alone. Most people do.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function SeasonalCarousel() {
  const [index, setIndex] = useState(0);
  const slide = seasonalSlides[index];

  useEffect(() => {
    const t = window.setInterval(() => setIndex((i) => (i + 1) % seasonalSlides.length), 7000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <section aria-label="Seasonal rituals and gatherings" className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8">
      <div className="relative overflow-hidden rounded-5xl bg-cream-200 shadow-soft">
        <div className="relative aspect-[16/10] w-full sm:aspect-[16/7]">
          <AnimatePresence>
            <motion.img
              key={slide.id}
              src={slide.image}
              alt=""
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </AnimatePresence>
          <div aria-hidden="true" className={`absolute inset-0 bg-gradient-to-t to-transparent ${overlay[slide.accent]}`} />

          <div className="absolute inset-x-0 bottom-0 p-7 sm:p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-lg"
              >
                <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-cream-100/90">{slide.season}</span>
                <h2 className="mt-3 font-display text-3xl leading-tight text-cream-50 sm:text-4xl">{slide.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-cream-100/90 sm:text-base">{slide.body}</p>
                <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-cream-50/15 px-4 py-2 text-xs text-cream-50 backdrop-blur">
                  <CalendarDaysIcon className="h-3.5 w-3.5" />
                  {slide.dates}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-2" role="tablist" aria-label="Seasonal slides">
          {seasonalSlides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={s.title}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === index ? "w-10 bg-ink-900" : "w-4 bg-ink-400/40 hover:bg-ink-400/70"
              }`}
            />
          ))}
        </div>
        <a
          href="#gatherings"
          className="group inline-flex items-center gap-2 text-sm text-ink-500 transition hover:text-ink-900"
        >
          See all gatherings
          <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>
    </section>
  );
}

interface EventFilterBarProps {
  view: "upcoming" | "completed";
  onViewChange: (view: "upcoming" | "completed") => void;
  intent: string;
  onIntentChange: (intent: string) => void;
}

function EventFilterBar({ view, onViewChange, intent, onIntentChange }: EventFilterBarProps) {
  return (
    <div id="gatherings" className="sticky top-[72px] z-30 border-y border-cream-300 bg-cream-100/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full shrink-0 rounded-full bg-cream-200 p-1.5 sm:w-auto" role="tablist" aria-label="Event timeline">
          {[
            { key: "upcoming" as const, label: "Upcoming Gatherings" },
            { key: "completed" as const, label: "Completed Recaps" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={view === tab.key}
              onClick={() => onViewChange(tab.key)}
              className={`relative flex-1 whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition sm:flex-none cursor-pointer ${
                view === tab.key ? "text-ink-900" : "text-ink-500 hover:text-ink-700"
              }`}
            >
              {view === tab.key && (
                <motion.span
                  layoutId="event-view-pill"
                  className="absolute inset-0 rounded-full bg-cream-50 shadow-soft"
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                />
              )}
              <span className="relative">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1" role="group" aria-label="Filter by intent">
          {intentFilters.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={intent === option}
              onClick={() => onIntentChange(option)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm transition cursor-pointer ${
                intent === option
                  ? "border-sage-300 bg-sage-50 text-sage-700"
                  : "border-cream-300 bg-cream-50 text-ink-500 hover:border-ink-400/30 hover:text-ink-700"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface EventsEditorialGridProps {
  events: Array<{
    id: string;
    title: string;
    description: string;
    intent: string;
    tags: string[];
    image: string;
    host: string;
    hostRole: string;
    date: string;
    time: string;
    place: string;
    seats: string;
    status: string;
    cta: string;
  }>;
  onSelect: (event: { id: string }) => void;
}

function EventsEditorialGrid({ events, onSelect }: EventsEditorialGridProps) {
  return (
    <section aria-label="Gatherings" className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
      {events.length === 0 ? (
        <div className="mx-auto max-w-md rounded-4xl border border-cream-300 bg-cream-50 px-8 py-14 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cream-200 text-ink-500">
            <TelescopeIcon className="h-6 w-6" />
          </span>
          <h3 className="mt-6 font-display text-xl text-ink-900">Nothing on this path just yet</h3>
          <p className="mt-3 text-sm leading-relaxed text-ink-500">
            New gatherings are added every week. Try another path, or look through what we have already held.
          </p>
        </div>
      ) : (
        <div className="space-y-16 lg:space-y-24">
          <AnimatePresence mode="popLayout">
            {events.map((event, i) => {
              const flipped = i % 2 === 1;
              return (
                <motion.article
                  key={event.id}
                  layout
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14"
                >
                  <div className={`group relative overflow-hidden rounded-5xl bg-cream-200 ${flipped ? "lg:order-2" : ""}`}>
                    <img
                      src={event.image}
                      alt=""
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover transition duration-[900ms] group-hover:scale-[1.03]"
                    />
                    {event.status === "completed" && (
                      <span className="absolute left-4 top-4 rounded-full bg-cream-50/90 px-3 py-1.5 text-[11px] font-medium text-ink-500 backdrop-blur">
                        Held on {event.date}
                      </span>
                    )}
                  </div>

                  <div className={flipped ? "lg:order-1" : ""}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-sage-100 px-3 py-1.5 text-[11px] font-medium text-sage-700">{event.intent}</span>
                      {event.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-cream-200 px-3 py-1.5 text-[11px] text-ink-500">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <h3 className="mt-5 font-display text-3xl leading-tight text-ink-900">{event.title}</h3>
                    <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-500 sm:text-base">{event.description}</p>

                    <dl className="mt-7 grid gap-3 sm:grid-cols-2">
                      <div className="flex items-center gap-2 text-sm text-ink-700">
                        <CalendarDaysIcon className="h-4 w-4 shrink-0 text-ink-400" />
                        <dd>{event.date}</dd>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-ink-700">
                        <ClockIcon className="h-4 w-4 shrink-0 text-ink-400" />
                        <dd>{event.time}</dd>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-ink-700">
                        <MapPinIcon className="h-4 w-4 shrink-0 text-ink-400" />
                        <dd>{event.place}</dd>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-ink-700">
                        <UsersIcon className="h-4 w-4 shrink-0 text-ink-400" />
                        <dd>{event.seats}</dd>
                      </div>
                    </dl>

                    <div className="mt-8 flex flex-wrap items-center gap-5">
                      <button
                        type="button"
                        onClick={() => onSelect(event)}
                        className={`group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium transition ${
                          event.status === "upcoming"
                            ? "bg-sage-600 text-cream-50 hover:bg-sage-700 cursor-pointer"
                            : "border border-cream-300 bg-cream-50 text-ink-700 hover:border-ink-400/30 cursor-pointer"
                        }`}
                      >
                        {event.cta}
                        <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </button>
                      <p className="text-xs text-ink-400">
                        Held by <span className="text-ink-700">{event.host}</span> · {event.hostRole}
                      </p>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}

function AtriumRituals({ onEnter }: { onEnter: () => void }) {
  return (
    <section aria-labelledby="atrium-title" className="border-y border-cream-300 bg-cream-50/70 py-16 lg:py-20">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="max-w-xl">
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">Ongoing atrium rituals</span>
            <h2 id="atrium-title" className="mt-3 font-display text-2xl leading-snug text-ink-900 sm:text-3xl">
              The doors that never close
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              Small recurring moments held by the community. Drop in for two minutes or stay the whole time — nobody keeps count.
            </p>
          </div>
          <button
            type="button"
            onClick={onEnter}
            className="shrink-0 rounded-full border border-cream-300 bg-cream-50 px-6 py-3 text-sm font-medium text-ink-700 transition hover:border-sage-200 hover:text-sage-700 cursor-pointer"
          >
            Enter the atrium
          </button>
        </motion.div>

        <ul className="mt-10 grid gap-x-10 gap-y-2 sm:grid-cols-2">
          {atriumRituals.map((ritual, i) => {
            const Icon = atriumIcons[ritual.icon];
            return (
              <motion.li
                key={ritual.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: (i % 2) * 0.08 }}
                className="flex items-start gap-4 border-b border-cream-300 py-5 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${atriumAccents[ritual.accent]}`}>
                  <Icon className="h-4 w-4" strokeWidth={1.9} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="font-display text-lg text-ink-900">{ritual.name}</h3>
                    <span className="text-xs text-ink-400">{ritual.schedule}</span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{ritual.description}</p>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function EventSpotlight({ onJoin }: { onJoin: () => void }) {
  return (
    <section aria-labelledby="spotlight-title" className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-70px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-5xl"
      >
        <img
          src="/fd0239f1-225b-4a4a-828c-fe537802ee38.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-ink-900/85 via-ink-900/60 to-ink-900/25" />

        <div className="relative px-7 py-14 sm:px-14 sm:py-20 lg:max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-cream-50/15 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-cream-100 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-peach-300" />
            The gathering of the month
          </span>

          <h2 id="spotlight-title" className="mt-6 font-display text-3xl leading-tight text-cream-50 sm:text-[2.75rem]">
            One Thousand Candles, One Quiet Hour
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-cream-100/85 sm:text-base">
            Once a month we light a candle at the same minute across the country and sit together in silence for an hour — cameras
            optional, chat open for anyone who wants to leave a word behind.
          </p>

          <ul className="mt-8 flex flex-wrap gap-x-7 gap-y-3">
            {spotlightDetails.map((d) => (
              <li key={d.label} className="flex items-center gap-2 text-sm text-cream-100/90">
                <d.icon className="h-4 w-4 text-peach-300" strokeWidth={1.8} />
                {d.label}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onJoin}
              className="inline-flex items-center gap-2 rounded-full bg-cream-50 px-8 py-4 text-sm font-medium text-ink-900 transition hover:bg-cream-100 cursor-pointer"
            >
              <VideoIcon className="h-4 w-4" />
              Join Online
            </button>
            <p className="text-xs text-cream-100/70">Free · 2,140 people joined last month</p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function WhyGather({ onNotify }: { onNotify: () => void }) {
  return (
    <section aria-labelledby="why-title" className="mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8 lg:pb-28">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6 }}
        className="max-w-xl"
      >
        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">Why gather?</span>
        <h2 id="why-title" className="mt-3 font-display text-2xl leading-snug text-ink-900 sm:text-3xl">
          Three quiet reasons people keep coming back
        </h2>
      </motion.div>

      <div className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-3">
        {whyGatherIdeas.map((idea, i) => (
          <motion.div
            key={idea.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.55, delay: i * 0.09 }}
          >
            <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${idea.tone}`}>
              <idea.icon className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <h3 className="mt-5 font-display text-xl text-ink-900">{idea.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">{idea.body}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6 }}
        className="relative mt-16 overflow-hidden rounded-5xl border border-cream-300 bg-cream-50 px-7 py-12 sm:px-12"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 -top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(218,209,240,0.55),transparent_65%)]" />
          <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(247,212,189,0.5),transparent_65%)]" />
        </div>

        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">Limited entry</span>
            <h3 className="mt-3 font-display text-2xl leading-snug text-ink-900 sm:text-[1.75rem]">
              We keep every circle small on purpose.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              Most gatherings cap at twenty-four people so everyone has room to be heard. When a space fills, we open the next one rather
              than squeeze more chairs in.
            </p>
          </div>
          <button
            type="button"
            onClick={onNotify}
            className="shrink-0 rounded-full bg-ink-900 px-8 py-4 text-sm font-medium text-cream-50 transition hover:bg-ink-700 cursor-pointer"
          >
            Notify me of new spaces
          </button>
        </div>
      </motion.div>
    </section>
  );
}

// ==========================================
// MAIN COMPONENT EXPORT
// ==========================================

export default function EventsPage() {
  const { status, data: session } = useSession();
  const [view, setView] = useState<"upcoming" | "completed">("upcoming");
  const [intent, setIntent] = useState<string>("All Paths");

  // Modal lifecycle state definitions
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [modalMethod, setModalMethod] = useState<"email" | "phone">("email");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isOtpStage, setIsOtpStage] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const listenerSupportModal = useListenerSupportModal();

  // Status mapping: "PUBLISHED" for upcoming, "COMPLETED" for completed recaps
  const statusFilter = view === "upcoming" ? "PUBLISHED" : "COMPLETED";

  const eventsQuery = useQuery({
    queryKey: ["public-events", intent, statusFilter],
    queryFn: () =>
      apiFetch<ApiPublicEventSummary[]>(
        `/api/public/events?filter=${encodeURIComponent(intent)}&status=${statusFilter}&take=12`,
      ),
  });

  const events = eventsQuery.data ?? [];
  const upcomingCount = view === "upcoming" ? events.length : 0;

  // Enrich event summaries for the editorial grid with fallback layout metadata
  const visibleEvents = useMemo(() => {
    return events.map((e, index) => {
      const mock = gatherings[index % gatherings.length] || gatherings[0];

      let date = e.tag;
      let time = "6:30 – 8:00 PM";
      if (e.tag.includes("·")) {
        const parts = e.tag.split("·");
        date = parts[0].trim();
        time = parts[1].trim();
      }

      return {
        id: e.id,
        title: e.title,
        description: e.description,
        intent: e.category || mock.intent,
        tags: mock.tags ? [...mock.tags] : ["Wellness Gathering", "Safe Space"],
        image: e.image || mock.image,
        host: e.host || mock.host,
        hostRole: mock.hostRole || "Circle Facilitator",
        date: date || mock.date,
        time: time || mock.time,
        place: mock.place || "Online · Zoom room",
        seats: mock.seats || "12 places left",
        status: statusFilter === "COMPLETED" ? "completed" : "upcoming",
        cta: statusFilter === "COMPLETED" ? "View Event Recap" : (index % 2 === 0 ? "Reserve your place" : "View Itinerary"),
      };
    });
  }, [events, statusFilter]);

  const openJoinModal = () => {
    setModalMethod("email");
    setPhoneNumber("");
    setOtpCode("");
    setIsOtpStage(false);
    setIsSigningIn(false);
    setIsJoinModalOpen(true);
  };

  const handleGoogleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      await signIn("google", { callbackUrl: "/events" });
    } catch (error) {
      console.error("Google sign-in failed", error);
      setIsSigningIn(false);
    }
  };

  const handleSelect = (event: { id: string }) => {
    if (status !== "authenticated") {
      openJoinModal();
    } else {
      // Redirect authenticated user to specific event detail view
      window.location.href = `/events/${event.id}`;
    }
  };

  const handleSupportOpen = () => {
    if (status !== "authenticated") {
      openJoinModal();
    } else {
      listenerSupportModal.open();
    }
  };

  return (
    <div className="min-h-screen w-full bg-cream-100 text-ink-900">
      <LandingNavbar onJoinClick={openJoinModal} />

      <main>
        <SacredSpacesHero upcomingCount={upcomingCount} />
        <SeasonalCarousel />
        <EventFilterBar view={view} onViewChange={setView} intent={intent} onIntentChange={setIntent} />
        <EventsEditorialGrid events={visibleEvents} onSelect={handleSelect} />
        <AtriumRituals onEnter={handleSupportOpen} />
        <EventSpotlight onJoin={handleSupportOpen} />
        <WhyGather onNotify={openJoinModal} />
      </main>

      <LandingFooter />

      <LandingJoinModal
        open={isJoinModalOpen}
        onClose={() => !isSigningIn && setIsJoinModalOpen(false)}
        modalMethod={modalMethod}
        onModalMethodChange={(m) => {
          setModalMethod(m);
          setPhoneNumber("");
          setOtpCode("");
          setIsOtpStage(false);
        }}
        phoneNumber={phoneNumber}
        onPhoneNumberChange={setPhoneNumber}
        otpCode={otpCode}
        onOtpCodeChange={setOtpCode}
        isOtpStage={isOtpStage}
        isSigningIn={isSigningIn}
        onGoogleSignIn={handleGoogleSignIn}
        onPhoneSubmit={(e) => {
          e.preventDefault();
          if (phoneNumber.trim()) setIsOtpStage(true);
        }}
        onOtpSubmit={(e) => e.preventDefault()}
      />
    </div>
  );
}
