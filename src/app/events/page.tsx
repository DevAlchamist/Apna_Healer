"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { LandingFooter } from "@/components/landing/footer";
import { LandingNavbar } from "@/components/landing/navbar";
import { apiFetch } from "@/lib/api-client";
import type { ApiPublicEventSummary } from "@/types/api";

const seasonalSlides = [
  {
    title: "Summer Equinox Ritual",
    description:
      "A dawn-to-dusk immersive experience focused on solar energy and release.",
    color: "bg-[radial-gradient(circle_at_50%_30%,#eec862,#c79a2c_44%,#8a7b3f)]",
  },
  {
    title: "Moonlight Renewal Night",
    description:
      "An intimate twilight gathering with journaling, silent breath cycles, and sound.",
    color: "bg-[radial-gradient(circle_at_60%_35%,#9ebec9,#58879b_46%,#2d4858)]",
  },
  {
    title: "River of Stillness",
    description:
      "A restorative flow of movement, pauses, and reflective circles under open sky.",
    color: "bg-[radial-gradient(circle_at_50%_32%,#d8d0c2,#8d8a80_48%,#525c56)]",
  },
] as const;

const eventFilters = [
  "All Paths",
  "Deep Breath",
  "Active Flow",
  "Mental Clarity",
  "Night Rituals",
  "Silent Retreats",
] as const;

export default function EventsPage() {
  const [heroIndex, setHeroIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState("All Paths");
  const [statusFilter, setStatusFilter] = useState<"PUBLISHED" | "COMPLETED">("PUBLISHED");

  const eventsQuery = useQuery({
    queryKey: ["public-events", activeFilter, statusFilter],
    queryFn: () =>
      apiFetch<ApiPublicEventSummary[]>(
        `/api/public/events?filter=${encodeURIComponent(activeFilter)}&status=${statusFilter}&take=12`,
      ),
  });

  const events = eventsQuery.data ?? [];
  const heroEvent = events[0];

  const heroSlides = useMemo(() => {
    if (events.length >= 3) {
      return events.slice(0, 3).map((event) => ({
        title: event.title,
        description: event.description,
        color: "bg-[radial-gradient(circle_at_50%_30%,#eec862,#c79a2c_44%,#8a7b3f)]",
      }));
    }
    return seasonalSlides;
  }, [events]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 4800);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  const revealUp = {
    hidden: { opacity: 0, y: 26 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
  } as const;

  const goNext = () => {
    setHeroIndex((prev) => (prev + 1) % seasonalSlides.length);
  };

  const goPrev = () => {
    setHeroIndex((prev) => (prev - 1 + seasonalSlides.length) % seasonalSlides.length);
  };

  return (
    <div className="bg-[#f4f4f2] text-[#273331]">
      <LandingNavbar />
      <main>
        <motion.section
          className="mx-auto max-w-[1240px] px-6 pb-12 pt-10 md:px-10"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <span className="inline-flex rounded-full bg-[#cde8dd] px-4 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#3b7060]">
            Seasonal Gathering
          </span>
          <div className="mt-4 flex items-end justify-between gap-6">
            <div>
              <h1 className="text-[90px] font-semibold leading-[0.95] tracking-[-0.04em] text-[#2f745f]">
                Sacred
                <br />
                Spaces.
              </h1>
              <p className="mt-5 max-w-[520px] text-[29px] leading-normal text-[#697371]">
                A curated journey through communal rituals, deep listening, and
                restorative motion.
              </p>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <button
                type="button"
                aria-label="Previous seasonal event"
                onClick={goPrev}
                className="grid h-10 w-10 place-content-center rounded-full border border-[#d0d6d4] text-[#6b7573] transition hover:bg-white"
              >
                ←
              </button>
              <button
                type="button"
                aria-label="Next seasonal event"
                onClick={goNext}
                className="grid h-10 w-10 place-content-center rounded-full border border-[#d0d6d4] text-[#6b7573] transition hover:bg-white"
              >
                →
              </button>
            </div>
          </div>
          <motion.article
            key={heroSlides[heroIndex].title}
            initial={{ opacity: 0.5, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className={`mt-10 overflow-hidden rounded-[40px] p-8 md:p-12 ${heroSlides[heroIndex].color}`}
          >
            <h2 className="text-[52px] font-semibold tracking-[-0.03em] text-white">
              {heroSlides[heroIndex].title}
            </h2>
            <p className="mt-4 max-w-[600px] text-[17px] leading-8 text-white/85">
              {heroSlides[heroIndex].description}
            </p>
            {heroEvent ? (
              <Link
                href={`/events/${heroEvent.id}`}
                className="mt-7 inline-block rounded-full bg-white/90 px-6 py-2.5 text-sm font-semibold text-[#2f745f]"
              >
                Explore Ritual
              </Link>
            ) : null}
          </motion.article>
        </motion.section>

        <motion.section
          className="py-10"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto max-w-[1240px] px-6 md:px-10">
            {/* Status toggle selector */}
            <div className="flex gap-6 border-b border-neutral-300 pb-4 mb-6">
              <button
                type="button"
                onClick={() => setStatusFilter("PUBLISHED")}
                className={`text-xl font-bold pb-2 border-b-2 transition-colors ${
                  statusFilter === "PUBLISHED"
                    ? "border-[#2f745f] text-[#2f745f]"
                    : "border-transparent text-[#77817f] hover:text-[#2f745f]"
                }`}
              >
                Upcoming Gatherings
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("COMPLETED")}
                className={`text-xl font-bold pb-2 border-b-2 transition-colors ${
                  statusFilter === "COMPLETED"
                    ? "border-[#2f745f] text-[#2f745f]"
                    : "border-transparent text-[#77817f] hover:text-[#2f745f]"
                }`}
              >
                Event Recaps (Completed)
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-2 text-sm text-[#8f9694]">Filter by Intent:</span>
              {eventFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                    activeFilter === filter
                      ? "bg-[#2f745f] text-white"
                      : "bg-[#ebedeb] text-[#737e7b] hover:bg-[#e2e6e4]"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          className="pb-10"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto max-w-[1240px] px-6 md:px-10">
            {eventsQuery.isLoading ? (
              <div className="grid gap-8 md:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-[330px] animate-pulse rounded-[30px] bg-[#e8e8e5]" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <p className="text-center text-[#77817f]">
                No events match this filter yet. Try another path.
              </p>
            ) : (
              <div className="grid gap-8 md:grid-cols-2">
                {events.slice(0, 4).map((event, index) => (
                  <div key={event.id} className="contents">
                    <motion.article whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                      <Link href={`/events/${event.id}`}>
                        <div
                          className="h-[330px] rounded-[30px] bg-cover bg-center shadow-[0_20px_40px_-30px_rgba(0,0,0,0.5)] md:h-[420px]"
                          style={{ backgroundImage: `url(${event.image})` }}
                        />
                      </Link>
                    </motion.article>
                    <article className={`self-center ${index % 2 === 1 ? "md:order-first" : ""}`}>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6e8a84]">
                        {event.tag} • {event.category}
                      </p>
                      <h3 className="mt-2 text-[58px] font-semibold tracking-[-0.03em] text-[#2a3231]">
                        {event.title}
                      </h3>
                      <p className="mt-3 max-w-[530px] text-[17px] leading-8 text-[#77817f]">
                        {event.description}
                      </p>
                      <p className="mt-2 text-sm text-[#6e8a84]">Hosted by {event.host}</p>
                      <Link
                        href={`/events/${event.id}`}
                        className={`mt-6 inline-block rounded-full px-6 py-2 text-sm font-semibold ${
                          statusFilter === "COMPLETED"
                            ? "bg-[#2f745f] text-white"
                            : (index % 2 === 0
                              ? "border border-[#2f745f] text-[#2f745f]"
                              : "bg-[#2f745f] text-white")
                        }`}
                      >
                        {statusFilter === "COMPLETED" ? "View Event Recap →" : (index % 2 === 0 ? "Reserve your place →" : "View Itinerary")}
                      </Link>
                    </article>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.section>

        <motion.section
          className="py-14"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto max-w-[1240px] px-6 text-center md:px-10">
            <h3 className="text-[56px] font-semibold tracking-[-0.03em] text-[#2d3534]">
              Ongoing Atrium Rituals
            </h3>
            <p className="mt-2 text-[#808b88]">
              Drop-in sessions for our community members. No booking required,
              just presence.
            </p>
            <div className="mx-auto mt-8 grid max-w-[800px] gap-4 md:grid-cols-2">
              {[
                ["Morning Pages", "Daily 7:00 AM • Creative stream-of-consciousness writing."],
                ["Sunset Hum", "Fridays 6:30 PM • Collective vocal toning and relaxation."],
              ].map(([title, text]) => (
                <motion.article
                  key={title}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-calm bg-white p-5 text-left shadow-[0_16px_28px_-24px_rgba(0,0,0,0.45)]"
                >
                  <h4 className="text-[34px] font-semibold tracking-[-0.02em] text-[#303938]">
                    {title}
                  </h4>
                  <p className="mt-2 text-sm text-[#808a88]">{text}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          className="pb-12"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {events[4] ? (
            <div className="mx-auto grid max-w-[1240px] items-center gap-8 px-6 md:grid-cols-2 md:px-10">
              <article>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6e8a84]">
                  {events[4].tag} • {events[4].category}
                </p>
                <h3 className="mt-2 text-[58px] font-semibold tracking-[-0.03em] text-[#2a3231]">
                  {events[4].title}
                </h3>
                <p className="mt-3 max-w-[550px] text-[17px] leading-8 text-[#77817f]">
                  {events[4].description}
                </p>
                <Link
                  href={`/events/${events[4].id}`}
                  className="mt-6 inline-block rounded-full border border-[#2f745f] px-6 py-2 text-sm font-semibold text-[#2f745f]"
                >
                  Join Online
                </Link>
              </article>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="h-[410px] rounded-[32px] bg-cover bg-center shadow-[0_20px_40px_-30px_rgba(0,0,0,0.5)]"
                style={{ backgroundImage: `url(${events[4].image})` }}
              />
            </div>
          ) : null}
        </motion.section>

        <motion.section
          className="py-16"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto grid max-w-[1240px] items-center gap-8 px-6 md:grid-cols-2 md:px-10">
            <div>
              <h3 className="text-[64px] font-semibold tracking-[-0.03em] text-[#2f745f]">
                Why Gather?
              </h3>
              <div className="mt-6 space-y-5">
                {[
                  ["The Root Effect", "Like trees in a forest, our nervous systems communicate. Gathering in intentional space allows us to regulate one another's calm."],
                  ["Ephemeral Magic", "A digital course is a map; an event is the journey. These moments are unforgettable snapshots of collective healing."],
                  ["Sacred Witness", "To be seen and heard in your vulnerability by a supportive community is the most potent medicine we know."],
                ].map(([title, text]) => (
                  <div key={title} className="flex gap-4">
                    <div className="mt-1 h-8 w-8 rounded-lg bg-[#e5efe9]" />
                    <div>
                      <h4 className="text-[32px] font-semibold tracking-[-0.02em] text-[#2b3332]">
                        {title}
                      </h4>
                      <p className="mt-1 text-sm leading-7 text-[#7d8785]">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="relative rounded-[34px] bg-[#ececea] p-8"
            >
              <div className="h-[360px] rounded-[28px] bg-[radial-gradient(circle_at_80%_10%,#a18862,#5b3f2a_42%,#231912)]" />
              <span className="absolute bottom-4 right-4 rounded-full bg-[#2f745f] px-6 py-7 text-xs font-semibold uppercase tracking-[0.08em] text-white">
                Limited Entry
              </span>
            </motion.div>
          </div>
        </motion.section>
      </main>
      <LandingFooter />
    </div>
  );
}
