"use client";

import { FadeIn, hoverLiftTransition, morphTransition } from "@/components/ui/fade-in";
import { motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";
import { moodFilters, specializationFilters, therapists } from "@/data/therapists";

export default function TherapistsPage() {
  const [mood, setMood] = useState<(typeof moodFilters)[number]>("All");
  const [specialization, setSpecialization] = useState<(typeof specializationFilters)[number]>("All");

  const visibleTherapists = useMemo(() => {
    return therapists.filter((therapist) => {
      const matchesMood = mood === "All" || therapist.mood === mood;
      const matchesSpecialization = specialization === "All" || therapist.specialization === specialization;
      return matchesMood && matchesSpecialization;
    });
  }, [mood, specialization]);

  return (
    <FadeIn className="space-y-10 pb-6 md:space-y-12">
      <motion.section
        className="relative overflow-hidden rounded-calm bg-linear-to-r from-[#ccfaeb] to-[#c7fff0] p-6 md:p-7"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={morphTransition}
      >
        <div className="grid items-center gap-6 md:grid-cols-[1.2fr_320px] md:gap-8">
          <div>
            <p className="inline-flex rounded-full bg-black/6 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-text-primary/65">
              Immediate Support
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold text-text-secondary md:text-5xl">
              Connect with a Listener
            </h1>
            <p className="mt-3 max-w-xl text-base text-text-primary/70 md:text-lg">
              Feeling overwhelmed? Sometimes you just need someone to hear you. Our trained listeners are available
              24/7 for a confidential talk.
            </p>
            <motion.button
              type="button"
              className="mt-6 rounded-full bg-text-secondary px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[0_10px_28px_-8px_rgb(47_93_80/45%)]"
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={hoverLiftTransition}
            >
              Start Talking Now
            </motion.button>
          </div>

          <motion.div
            className="mx-auto h-52 w-full max-w-[320px] overflow-hidden rounded-calm md:h-56"
            whileHover={{ y: -4, transition: hoverLiftTransition }}
          >
            <img
              src="https://images.unsplash.com/photo-1618220179428-22790b461013?w=700&q=80&auto=format&fit=crop"
              alt="Therapy session"
              className="h-full w-full object-cover transition-transform duration-620 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.06]"
            />
          </motion.div>
        </div>
      </motion.section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-4xl font-semibold text-text-primary md:text-5xl">Find your guide</h2>
            <p className="mt-1 text-sm font-medium text-text-primary/65">
              {visibleTherapists.length} professionals available for your journey
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-full border border-accent/90 bg-white px-3 py-2">
              <span className="text-xs font-semibold text-text-primary/60">Mood</span>
              <select
                value={mood}
                onChange={(event) => setMood(event.target.value as (typeof moodFilters)[number])}
                className="bg-transparent text-xs font-semibold text-text-primary outline-none"
              >
                {moodFilters.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-accent/90 bg-white px-3 py-2">
              <span className="text-xs font-semibold text-text-primary/60">Specialization</span>
              <select
                value={specialization}
                onChange={(event) => setSpecialization(event.target.value as (typeof specializationFilters)[number])}
                className="bg-transparent text-xs font-semibold text-text-primary outline-none"
              >
                {specializationFilters.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <motion.button
              type="button"
              className="rounded-full border border-accent/90 bg-white p-2.5 text-text-primary/70 transition-colors hover:bg-accent/45"
              whileHover={{ rotate: 8 }}
              transition={hoverLiftTransition}
              aria-label="Filter settings"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 7h16M7 12h10M10 17h4" strokeLinecap="round" />
              </svg>
            </motion.button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {visibleTherapists.map((therapist, index) => (
            <Link
              key={therapist.name}
              href={`/${therapist.id}`}
              className="block rounded-calm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
            >
              <motion.article
                className="group h-full rounded-calm border border-accent/80 bg-white p-3 shadow-soft transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-primary/30 hover:shadow-soft-hover"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...morphTransition, delay: 0.05 + index * 0.03 }}
                whileHover={{ y: -5, transition: hoverLiftTransition }}
              >
                <div className="relative overflow-hidden rounded-gentle">
                  <img
                    src={therapist.image}
                    alt={therapist.name}
                    className="h-44 w-full object-cover transition-transform duration-620 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.06]"
                  />
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-text-primary/70 shadow-sm">
                    <svg viewBox="0 0 24 24" className="h-3 w-3 text-[#f5a623]" fill="currentColor">
                      <path d="m12 17.3-6.2 3.8 1.7-7.1L2 9.2l7.2-.6L12 2l2.8 6.6 7.2.6-5.5 4.8 1.7 7.1z" />
                    </svg>
                    {therapist.rating}
                  </span>
                </div>

                <div className="px-1 pb-1 pt-3">
                  <h3 className="text-xl font-semibold text-text-primary">{therapist.name}</h3>
                  <p className="text-sm text-text-primary/70">{therapist.role}</p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {therapist.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#f2ede6] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-primary/60"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-primary/45">
                        Session Fee
                      </p>
                      <p className="font-display text-2xl font-semibold text-text-primary">₹{therapist.fee}</p>
                      <p className="text-[10px] text-text-primary/40">/hr</p>
                    </div>

                    <motion.span
                      className="inline-flex rounded-full bg-text-secondary px-5 py-2 text-sm font-semibold text-white shadow-sm"
                      whileHover={{ scale: 1.05, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      transition={hoverLiftTransition}
                    >
                      Book
                    </motion.span>
                  </div>
                </div>
              </motion.article>
            </Link>
          ))}
        </div>
      </section>
    </FadeIn>
  );
}
