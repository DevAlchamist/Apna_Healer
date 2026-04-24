"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LandingFooter } from "@/components/landing/footer";
import { LandingNavbar } from "@/components/landing/navbar";

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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % seasonalSlides.length);
    }, 4800);
    return () => window.clearInterval(timer);
  }, []);

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
            key={seasonalSlides[heroIndex].title}
            initial={{ opacity: 0.5, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className={`mt-10 overflow-hidden rounded-[40px] p-8 md:p-12 ${seasonalSlides[heroIndex].color}`}
          >
            <h2 className="text-[52px] font-semibold tracking-[-0.03em] text-white">
              {seasonalSlides[heroIndex].title}
            </h2>
            <p className="mt-4 max-w-[600px] text-[17px] leading-8 text-white/85">
              {seasonalSlides[heroIndex].description}
            </p>
            <button className="mt-7 rounded-full bg-white/90 px-6 py-2.5 text-sm font-semibold text-[#2f745f]">
              Explore Ritual
            </button>
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
            <div className="grid gap-8 md:grid-cols-2">
              <motion.article whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                <div className="h-[330px] rounded-[30px] bg-[radial-gradient(circle_at_55%_42%,#f7c15b,#35637f_48%,#0f2133)] shadow-[0_20px_40px_-30px_rgba(0,0,0,0.5)]" />
              </motion.article>
              <article className="self-center">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6e8a84]">
                  Aug 14 • London
                </p>
                <h3 className="mt-2 text-[58px] font-semibold tracking-[-0.03em] text-[#2a3231]">
                  The Resonance Lab
                </h3>
                <p className="mt-3 max-w-[530px] text-[17px] leading-8 text-[#77817f]">
                  A somatic sound bath using frequency-based therapy to reset
                  the nervous system. Limited to 12 participants for intimacy.
                </p>
                <button className="mt-6 rounded-full border border-[#2f745f] px-6 py-2 text-sm font-semibold text-[#2f745f]">
                  Reserve your place →
                </button>
              </article>

              <motion.article whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                <div className="h-[420px] rounded-[30px] bg-[radial-gradient(circle_at_52%_20%,#cadfbe,#6d9264_44%,#2f4731)] shadow-[0_20px_40px_-30px_rgba(0,0,0,0.5)]" />
              </motion.article>
              <article className="self-center">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6e8a84]">
                  Aug 21-23 • Cotswolds
                </p>
                <h3 className="mt-2 text-[58px] font-semibold tracking-[-0.03em] text-[#2a3231]">
                  Unplugged: The Forest Sleep
                </h3>
                <p className="mt-3 max-w-[530px] text-[17px] leading-8 text-[#77817f]">
                  A 48-hour total digital detox. We replace screens with canopy
                  walks, firelight dialogue, and deep-soil meditation.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#ece8dd] px-3 py-1 text-xs font-semibold text-[#7a766d]">
                    Overnight
                  </span>
                  <span className="rounded-full bg-[#ece8dd] px-3 py-1 text-xs font-semibold text-[#7a766d]">
                    Fully Catered
                  </span>
                </div>
                <button className="mt-6 rounded-full bg-[#2f745f] px-6 py-2 text-sm font-semibold text-white">
                  View Itinerary
                </button>
              </article>
            </div>
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
          <div className="mx-auto grid max-w-[1240px] items-center gap-8 px-6 md:grid-cols-2 md:px-10">
            <article>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6e8a84]">
                Sept 08 • Virtual Atrium
              </p>
              <h3 className="mt-2 text-[58px] font-semibold tracking-[-0.03em] text-[#2a3231]">
                Breath of Life Workshop
              </h3>
              <p className="mt-3 max-w-[550px] text-[17px] leading-8 text-[#77817f]">
                Join global instructor Elias Yane for a 90-minute masterclass in
                pranayama techniques designed to alleviate chronic anxiety and
                brain fog.
              </p>
              <button className="mt-6 rounded-full border border-[#2f745f] px-6 py-2 text-sm font-semibold text-[#2f745f]">
                Join Online
              </button>
            </article>
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="h-[410px] rounded-[32px] bg-[radial-gradient(circle_at_48%_84%,#ffe6a5,#f0a66f_45%,#1f5e7a)] shadow-[0_20px_40px_-30px_rgba(0,0,0,0.5)]"
            />
          </div>
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
