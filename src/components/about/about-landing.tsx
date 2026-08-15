"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  EarIcon,
  HeartIcon,
  LeafIcon,
  SproutIcon,
  TreesIcon,
  ArrowRightIcon,
} from "lucide-react";

import { LandingFooter } from "@/components/landing/footer";
import { LandingNavbar } from "@/components/landing/navbar";

// ==========================================
// STATIC DATA DEFINITIONS
// ==========================================

const principles = [
  {
    title: "The Presence Protocol",
    body: "Every listener is trained to do less, not more. No interrupting, no advice in the first twenty minutes, no rushing towards a resolution. Silence is allowed to sit in the room.",
    icon: EarIcon,
    tone: "bg-sage-100 text-sage-700",
    wrap: "bg-sage-50 border-sage-100",
  },
  {
    title: "Radical Empathy",
    body: "We hire for warmth before credentials, then add the credentials. Nobody here will tell you it could be worse, or that you should be grateful, or that you simply need to think positive.",
    icon: HeartIcon,
    tone: "bg-lavender-100 text-lavender-700",
    wrap: "bg-lavender-50 border-lavender-100",
  },
];

const phases = [
  {
    phase: "Seed Phase",
    year: "2021",
    label: "The spark",
    body: "A single WhatsApp group of nine people who couldn’t sleep. One of them started replying to everyone at 2 AM, and it never really stopped.",
    icon: SproutIcon,
    tone: "bg-sage-100 text-sage-700 ring-sage-200",
  },
  {
    phase: "Sprout Phase",
    year: "2022",
    label: "Expansion",
    body: "Forty trained listeners, the first verified therapists, and our first physical room in Bandra with borrowed chairs and very good tea.",
    icon: LeafIcon,
    tone: "bg-lavender-100 text-lavender-700 ring-lavender-200",
  },
  {
    phase: "Atrium Phase",
    year: "2024",
    label: "Mastery",
    body: "Four cities, ongoing rituals that run every single day, and a care standard other platforms have started borrowing. Still no scripts.",
    icon: TreesIcon,
    tone: "bg-peach-100 text-peach-600 ring-peach-200",
  },
];

const team = [
  {
    id: "tm-1",
    name: "Aditi Verma",
    role: "Founder & listener",
    note: "Started Apna Healer after a year of unanswered helplines.",
    photo: "/3d8f6278-c7dd-473c-9ba9-9f95540ab434.jpg",
    shape: "rounded-[58%_42%_48%_52%/48%_54%_46%_52%]",
    size: "h-52 w-52 sm:h-64 sm:w-64",
    offset: "lg:mt-10",
  },
  {
    id: "tm-2",
    name: "Kabir Sethi",
    role: "Head of community",
    note: "Holds the atrium rituals and trains every new listener.",
    photo: "/67703900-1aae-45b5-a178-6f95d1394b03.jpg",
    shape: "rounded-[45%_55%_58%_42%/52%_46%_54%_48%]",
    size: "h-44 w-44 sm:h-56 sm:w-56",
    offset: "lg:-mt-6",
  },
  {
    id: "tm-3",
    name: "Riya Menon",
    role: "Therapist & guide",
    note: "Believes the first session should feel like exhaling.",
    photo: "/1b305101-e75d-4490-a94e-f2cff0113199.jpg",
    shape: "rounded-[52%_48%_42%_58%/56%_44%_56%_44%]",
    size: "h-48 w-48 sm:h-60 sm:w-60",
    offset: "lg:mt-16",
  },
  {
    id: "tm-4",
    name: "Meher Qureshi",
    role: "Ritual practitioner",
    note: "Brought sound baths to people who thought they were silly.",
    photo: "/b67e2902-c2ba-4daf-a662-aa1c4ae1c00f.jpg",
    shape: "rounded-[48%_52%_56%_44%/44%_58%_42%_56%]",
    size: "h-44 w-44 sm:h-56 sm:w-56",
    offset: "lg:mt-2",
  },
  {
    id: "tm-5",
    name: "Dr. Nandita Iyer",
    role: "Clinical supervisor",
    note: "Reviews every listener conversation flagged for care.",
    photo: "/2adb72fe-db83-4c41-942a-5ed65e6ffa2a.jpg",
    shape: "rounded-[56%_44%_46%_54%/50%_52%_48%_50%]",
    size: "h-52 w-52 sm:h-64 sm:w-64",
    offset: "lg:mt-20",
  },
  {
    id: "tm-6",
    name: "Dr. Imran Sheikh",
    role: "Care standards",
    note: "Wrote the rule that no one is ever rushed off a call.",
    photo: "/1d3367b5-61c9-4648-bb01-3fa4d7309727.jpg",
    shape: "rounded-[44%_56%_52%_48%/58%_42%_58%_42%]",
    size: "h-44 w-44 sm:h-56 sm:w-56",
    offset: "lg:-mt-2",
  },
];

// ==========================================
// SUB-COMPONENTS
// ==========================================

function AboutHero() {
  return (
    <section aria-labelledby="about-title" className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(202,223,195,0.5),transparent_65%)]" />
        <div className="absolute right-0 top-28 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(247,212,189,0.4),transparent_65%)]" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 px-5 pb-16 pt-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:pb-24 lg:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-400">Our narrative</span>
          <h1 id="about-title" className="mt-5 font-display text-4xl leading-[1.08] tracking-tight text-ink-900 sm:text-[3.4rem] font-semibold">
            Spaces for <span className="italic text-sage-600 font-normal">quiet healing</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-relaxed text-ink-500 sm:text-lg">
            Apna Healer began with a simple observation: most people don’t need to be fixed. They need somewhere unhurried to be heard.
            So we built rooms — some digital, some with actual chairs — where being unwell isn’t a problem to solve, only something to sit
            with until it softens.
          </p>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-500">
            Five years on, that idea holds a community of listeners, therapists and quiet regulars across four cities.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-md"
        >
          <div
            aria-hidden="true"
            className="absolute -inset-6 animate-breathe rounded-full bg-[radial-gradient(circle_at_center,rgba(169,200,160,0.45),transparent_70%)]"
          />

          <div className="relative aspect-square overflow-hidden rounded-full ring-1 ring-cream-300">
            <img src="/6326c8bf-9b9f-46ca-848d-806f77f7afc6.jpg" alt="Fresh green leaves covered in morning dew" className="h-full w-full object-cover" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ListeningOverFixing() {
  return (
    <section aria-labelledby="philosophy-title" className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-70px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-5xl bg-cream-200"
        >
          <img
            src="/542cdf94-2ea5-4536-ab93-be9548535de4.jpg"
            alt="A quiet therapy room with a cream armchair and soft daylight"
            loading="lazy"
            className="aspect-[4/5] w-full object-cover"
          />
        </motion.div>

        <div>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-70px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-400">Our philosophy</span>
            <h2 id="philosophy-title" className="mt-4 font-display text-3xl leading-tight text-ink-900 sm:text-4xl font-semibold">
              Listening over <span className="italic text-sage-600 font-normal">fixing</span>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-ink-500">
              Two commitments shape everything we build. They sound soft. In practice they are the hardest rules we hold ourselves to.
            </p>
          </motion.div>

          <div className="mt-10 space-y-5">
            {principles.map((p, i) => (
              <motion.article
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3 }}
                className={`rounded-4xl border p-7 transition-shadow duration-300 hover:shadow-soft ${p.wrap}`}
              >
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${p.tone}`}>
                  <p.icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <h3 className="mt-5 font-display text-xl text-ink-900 font-semibold">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-500">{p.body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function GrowthCycleTimeline() {
  return (
    <section aria-labelledby="growth-title" className="border-y border-cream-300 bg-cream-50/70 py-20 lg:py-28">
      <div className="mx-auto w-full max-w-3xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-400">How we grew</span>
          <h2 id="growth-title" className="mt-4 font-display text-3xl leading-tight text-ink-900 sm:text-4xl font-semibold">
            The Growth Cycle
          </h2>
        </motion.div>

        <ol className="relative mt-16 space-y-14">
          <span
            aria-hidden="true"
            className="absolute left-[27px] top-2 bottom-2 w-px bg-gradient-to-b from-sage-200 via-lavender-200 to-peach-200"
          />

          {phases.map((phase, i) => (
            <motion.li
              key={phase.phase}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex gap-6"
            >
              <span className={`relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full ring-1 ${phase.tone}`}>
                <phase.icon className="h-5 w-5" strokeWidth={1.8} />
              </span>

              <div className="pt-1.5 text-left">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <h3 className="font-display text-xl text-ink-900 font-semibold">{phase.phase}</h3>
                  <span className="text-sm text-ink-400">
                    {phase.year} — {phase.label}
                  </span>
                </div>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-500">{phase.body}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function LivingRoots() {
  return (
    <section id="roots" aria-labelledby="roots-title" className="relative overflow-hidden py-20 lg:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-20 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(218,209,240,0.4),transparent_65%)]"
      />

      <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="max-w-xl text-left"
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-400">The people</span>
          <h2 id="roots-title" className="mt-4 font-display text-3xl leading-tight text-ink-900 sm:text-4xl font-semibold">
            Our Living Roots
          </h2>
          <p className="mt-5 text-base leading-relaxed text-ink-500">
            Healers, listeners and guides who hold this place together. Some are clinicians, some simply stayed up late for a stranger
            once and never left.
          </p>
        </motion.div>

        <ul className="mt-16 flex flex-wrap justify-center gap-x-8 gap-y-14 lg:gap-x-12">
          {team.map((member, i) => (
            <motion.li
              key={member.id}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: (i % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className={`group w-[calc(50%-1rem)] max-w-[16rem] text-center sm:w-auto ${member.offset}`}
            >
              <div
                className={`relative mx-auto overflow-hidden ${member.size} ${member.shape} bg-cream-200 transition-all duration-700 ease-out group-hover:rounded-[50%]`}
              >
                <img
                  src={member.photo}
                  alt={`Portrait of ${member.name}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                />
              </div>
              <h3 className="mt-5 font-display text-lg text-ink-900 font-semibold">{member.name}</h3>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.14em] text-sage-600">{member.role}</p>
              <p className="mx-auto mt-2.5 max-w-[15rem] text-sm leading-relaxed text-ink-500">{member.note}</p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

interface BeginBannerProps {
  onExploreRoots: () => void;
}

function BeginBanner({ onExploreRoots }: BeginBannerProps) {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8 lg:pb-28">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-70px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-5xl bg-sage-800 px-7 py-16 text-center sm:px-14 lg:py-20"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(169,200,160,0.35),transparent_65%)]" />
          <div className="absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(247,212,189,0.25),transparent_65%)]" />
        </div>

        <div className="relative mx-auto max-w-2xl">
          <h2 className="font-display text-3xl leading-tight sm:text-[2.75rem] font-semibold">Shall we begin?</h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed ">
            There is no right moment and no minimum amount of pain required. Whenever you’re ready — today, next month, at 3 AM — a room
            will be open and someone will be in it.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/therapists"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-cream-50 px-8 py-4 text-sm font-semibold text-sage-800 transition hover:bg-cream-100 sm:w-auto"
            >
              Book your first session
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <button
              type="button"
              onClick={onExploreRoots}
              className="inline-flex w-full items-center justify-center rounded-full border border-cream-50/25 px-8 py-4 text-sm font-semibold transition hover:bg-cream-50/10 sm:w-auto cursor-pointer"
            >
              Explore our roots
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

// ==========================================
// EXPORT COMPONENT
// ==========================================

export function AboutLanding() {
  const handleScrollToRoots = () => {
    document.getElementById("roots")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen w-full bg-cream-100 text-ink-900">
      <LandingNavbar />

      <main>
        <AboutHero />
        <ListeningOverFixing />
        <GrowthCycleTimeline />
        <LivingRoots />
        <BeginBanner onExploreRoots={handleScrollToRoots} />
      </main>

      <LandingFooter />
    </div>
  );
}
