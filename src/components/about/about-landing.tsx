"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Playfair_Display } from "next/font/google";
import { LandingFooter } from "@/components/landing/footer";
import { LandingNavbar } from "@/components/landing/navbar";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-playfair-about",
});

const viewport = { once: true, amount: 0.22 } as const;

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.11, delayChildren: 0.06 },
  },
};

const imgLeaf =
  "https://images.unsplash.com/photo-1518531933037-91b2f5c22950?w=700&h=700&fit=crop&q=80";
const imgInterior =
  "/images/cp1.jpeg";
const imgSeed =
  "/images/lodhi_garden1.jpeg";
const imgForest =
  "/images/lodhi_garden2.jpeg";
const imgAtrium =
  "/images/hauzkhas.jpeg";

type LivingRootsMember = {
  name: string;
  role: string;
  src: string;
};

const livingRootsMembers: LivingRootsMember[] = [
  {
    name: "Elena S.",
    role: "Listener",
    src: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Marcus J.",
    role: "Therapist",
    src: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Sarah K.",
    role: "Psychologist",
    src: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "David L.",
    role: "Guide",
    src: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Aria M.",
    role: "Breathwork",
    src: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Noah P.",
    role: "Listener",
    src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Priya R.",
    role: "Therapist",
    src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Leo F.",
    role: "Guide",
    src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Maya O.",
    role: "Breathwork",
    src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Kim H.",
    role: "Psychologist",
    src: "/images/kirti.jpeg",
  },
  {
    name: "Ravi N.",
    role: "Listener",
    src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Zoe A.",
    role: "Therapist",
    src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "James T.",
    role: "Guide",
    src: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Nina C.",
    role: "Listener",
    src: "https://images.unsplash.com/photo-1489424731084-a5d8a2dd0111?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Omar B.",
    role: "Therapist",
    src: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Clara V.",
    role: "Psychologist",
    src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Ethan W.",
    role: "Breathwork",
    src: "https://images.unsplash.com/photo-1504257432387-30543a6e4920?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Hana J.",
    role: "Listener",
    src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Felix R.",
    role: "Guide",
    src: "https://images.unsplash.com/photo-1463453091185-98a43d326b2d?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Iris L.",
    role: "Therapist",
    src: "https://images.unsplash.com/photo-1531746020798-e6953b6b8610?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Theo M.",
    role: "Psychologist",
    src: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Luna K.",
    role: "Breathwork",
    src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Vik S.",
    role: "Listener",
    src: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Emma D.",
    role: "Guide",
    src: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Raj P.",
    role: "Therapist",
    src: "https://images.unsplash.com/photo-1506277886164-33535f372f37?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Sofia G.",
    role: "Psychologist",
    src: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Chen Y.",
    role: "Breathwork",
    src: "https://images.unsplash.com/photo-1539577195318-6cc49c83f749?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Aiden C.",
    role: "Listener",
    src: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Bella F.",
    role: "Therapist",
    src: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Cole H.",
    role: "Guide",
    src: "https://images.unsplash.com/photo-1500043357865-c6b882ee3b0c?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Dina A.",
    role: "Psychologist",
    src: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Evan R.",
    role: "Breathwork",
    src: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Faye L.",
    role: "Listener",
    src: "https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Gus M.",
    role: "Therapist",
    src: "https://images.unsplash.com/photo-1502823403499-6a1b47d1f8d0?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Hope W.",
    role: "Guide",
    src: "https://images.unsplash.com/photo-1519345182560-3f2907c472ef?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Ines P.",
    role: "Psychologist",
    src: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Jude K.",
    role: "Listener",
    src: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Kira N.",
    role: "Breathwork",
    src: "https://images.unsplash.com/photo-1524502397800-2eeaad7d3ca5?w=500&h=500&fit=crop&q=80",
  },
  {
    name: "Liam O.",
    role: "Therapist",
    src: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=500&h=500&fit=crop&q=80",
  },
];

const founder: LivingRootsMember = {
  name: "Dr. Aris Varma",
  role: "Founder & Visionary",
  src: "/images/deepak.jpg",
};

type LivingRootsMosaicMember = LivingRootsMember & {
  isCenter?: boolean;
  /** Equal col/row span keeps every tile square — only scale varies. */
  gridClass: string;
};

/** Center = largest tile (3×3). Peripherals mix 1×1 and 2×2 squares only. */
const LIVING_ROOTS_CENTER_GRID =
  "z-[3] col-span-3 row-span-3 col-start-4 row-start-3 sm:col-start-5 md:col-start-7 lg:col-start-9 xl:col-start-11";

const PERIPHERAL_SPAN_PATTERN = [
  "col-span-1 row-span-1",
  "col-span-2 row-span-2",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-2 row-span-2",
  "col-span-1 row-span-1",
  "col-span-2 row-span-2",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-2 row-span-2",
  "col-span-1 row-span-1",
  "col-span-2 row-span-2",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-2 row-span-2",
  "col-span-1 row-span-1",
  "col-span-2 row-span-2",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-2 row-span-2",
  "col-span-1 row-span-1",
  "col-span-2 row-span-2",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-2 row-span-2",
  "col-span-1 row-span-1",
  "col-span-2 row-span-2",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-2 row-span-2",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-2 row-span-2",
  "col-span-1 row-span-1",
  "col-span-2 row-span-2",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
] as const;

const livingRootsMosaic: LivingRootsMosaicMember[] = [
  ...livingRootsMembers.map((member, index) => ({
    ...member,
    gridClass:
      PERIPHERAL_SPAN_PATTERN[index % PERIPHERAL_SPAN_PATTERN.length] ??
      "col-span-1 row-span-1",
  })),
  { ...founder, isCenter: true, gridClass: LIVING_ROOTS_CENTER_GRID },
];

/** Organic blob radii — each tile gets a distinct silhouette. */
const LIVING_ROOTS_BLOB_SHAPES = [
  "rounded-[44%_56%_62%_38%/42%_58%_42%_58%]",
  "rounded-[58%_42%_38%_62%/48%_52%_58%_42%]",
  "rounded-[36%_64%_54%_46%/56%_44%_56%_44%]",
  "rounded-[52%_48%_64%_36%/38%_62%_38%_62%]",
  "rounded-[62%_38%_44%_56%/52%_48%_62%_38%]",
  "rounded-[40%_60%_58%_42%/44%_56%_44%_56%]",
  "rounded-[48%_52%_36%_64%/58%_42%_48%_52%]",
  "rounded-[56%_44%_52%_48%/42%_58%_56%_44%]",
  "rounded-[38%_62%_48%_52%/54%_46%_38%_62%]",
  "rounded-[64%_36%_42%_58%/46%_54%_64%_36%]",
  "rounded-[46%_54%_60%_40%/52%_48%_46%_54%]",
  "rounded-[54%_46%_38%_62%/44%_56%_54%_46%]",
  "rounded-[42%_58%_50%_50%/50%_50%_50%_50%]",
  "rounded-[50%_50%_58%_42%/46%_54%_50%_50%]",
  "rounded-[60%_40%_48%_52%/44%_56%_60%_40%]",
  "rounded-[34%_66%_56%_44%/58%_42%_34%_66%]",
  "rounded-[48%_52%_62%_38%/40%_60%_48%_52%]",
  "rounded-[56%_44%_40%_60%/52%_48%_56%_44%]",
  "rounded-[44%_56%_54%_46%/48%_52%_44%_56%]",
] as const;

const LIVING_ROOTS_CENTER_BLOB =
  "rounded-[48%_52%_54%_46%/50%_50%_52%_48%]";

export function AboutLanding() {
  return (
    <div
      className={`min-h-screen bg-[#f9f9f9] text-[#273331] ${playfair.variable}`}
    >
      <LandingNavbar />

      <main>
        {/* Hero */}
        <motion.section
          className="relative overflow-hidden bg-[#f4f4f2]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/*<div className="mx-auto grid max-w-[1240px] items-center gap-10 px-6 py-16 md:grid-cols-2 md:px-10 md:py-20">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="max-w-xl"
            >
              <motion.span
                variants={fadeUp}
                className="inline-flex rounded-full bg-[#d1f2e5] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-[#2d5a4c]"
              >
                About ApnaHealer
              </motion.span>
              <motion.h1
                variants={fadeUp}
                className="mt-6 font-[family-name:var(--font-manrope)] text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-[#1f2827] md:text-6xl"
              >
                A sanctuary for the
                <br />
                <span className="italic text-[#2f745f]">quiet in-between.</span>
              </motion.h1>
              <motion.p
                variants={fadeUp}
                className="mt-6 text-[17px] leading-8 text-[#5d6664]"
              >
                We built ApnaHealer as a gentle counterweight to noise — a
                place where emotional care feels human, unhurried, and deeply
                respectful of your story.
              </motion.p>
              <motion.div
                variants={fadeUp}
                className="mt-8 flex flex-wrap gap-3"
              >
                <Link
                  href="/contact"
                  className="rounded-full bg-[#2f745f] px-7 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#245d4c]"
                >
                  Talk to us
                </Link>
                <a
                  href="#narrative"
                  className="rounded-full border border-[#c5d4cf] bg-white/80 px-7 py-3.5 text-sm font-semibold text-[#3e4a48] transition hover:bg-white"
                >
                  Read our narrative
                </a>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[36px] shadow-[0_28px_60px_-32px_rgba(0,0,0,0.45)] md:max-w-none"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_20%,#c8e8dd,#2f745f_52%,#1a3329)]" />
              <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.12),transparent_55%)]" />
            </motion.div>
          </div>*/}
        </motion.section>

        {/* Our narrative */}
        <section
          id="narrative"
          className="border-t border-black/[0.04] bg-[#f9f9f9] py-16 md:py-24"
        >
          <div className="mx-auto flex max-w-[1240px] flex-col items-center gap-12 px-6 md:flex-row md:items-center md:gap-16 md:px-10">
            <motion.div
              className="w-full max-w-xl flex-1"
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={viewport}
            >
              <motion.span
                variants={fadeUp}
                className="inline-flex rounded-full bg-[#d1f2e5] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-[#2d5a4c]"
              >
                Our narrative
              </motion.span>
              <motion.h2
                variants={fadeUp}
                className="mt-5 font-[family-name:var(--font-manrope)] text-3xl font-semibold leading-tight tracking-[-0.02em] text-[#2d5a4c] md:text-[40px]"
              >
                Spaces for{" "}
                <span className="italic text-[#2d5a4c]">quiet healing.</span>
              </motion.h2>
              <motion.p
                variants={fadeUp}
                className="mt-5 text-[17px] leading-8 text-[#4a5553]"
              >
                We believe the most profound transformations don&apos;t happen
                in the noise of clinical jargon, but in the gentle stillness of
                being truly heard. Welcome to the atrium of the soul.
              </motion.p>
              <motion.div
                variants={fadeUp}
                className="mt-10 flex items-center gap-3"
              >
                <span className="h-px w-10 bg-[#c8cdc9]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9aa6a1]">
                  The journey of ApnaHealer
                </span>
              </motion.div>
            </motion.div>

            <motion.div
              className="relative mx-auto shrink-0"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={viewport}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative h-[280px] w-[280px] overflow-hidden rounded-full shadow-[0_24px_50px_-28px_rgba(0,0,0,0.35)] ring-1 ring-black/5 md:h-[380px] md:w-[380px]">
                <Image
                  src={imgLeaf}
                  alt="Leaf with droplets, symbolic of calm renewal"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 280px, 380px"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </section>
        {/* Listening over fixing */}
        <section className="border-t border-black/[0.04] bg-[#f9f8f3] py-16 md:py-24">
          <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-6 md:grid-cols-2 md:gap-16 md:px-10">
            <motion.div
              initial={{ opacity: 0, x: -44 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={viewport}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto w-full max-w-md md:max-w-none"
            >
              <div className="rounded-[32px] bg-[#1a1f1e] p-2 shadow-[0_28px_55px_-34px_rgba(0,0,0,0.55)]">
                <div className="overflow-hidden rounded-[26px]">
                  <div className="relative aspect-[3/4] w-full">
                    <Image
                      src={imgInterior}
                      alt="Calm interior overlooking forest"
                      fill
                      className="object-cover "
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            <div>
              <motion.h2
                className="font-[family-name:var(--font-manrope)] text-3xl font-semibold tracking-[-0.02em] text-[#1a1a1a] md:text-[40px]"
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={viewport}
                transition={{ duration: 0.55, delay: 0.05 }}
              >
                Listening over fixing.
              </motion.h2>

              <motion.div
                className="mt-8 space-y-5"
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={viewport}
              >
                <motion.article
                  variants={fadeUp}
                  className="rounded-[20px] bg-white p-6 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.2)] md:p-8"
                >
                  <h3 className="text-lg font-bold text-[#2d4f40] md:text-xl">
                    The Presence Protocol
                  </h3>
                  <p className="mt-3 text-[15px] leading-7 text-[#4a4a4a]">
                    Most care focuses on solving problems as if humans were
                    machines to be repaired. We approach the psyche as a
                    landscape to be explored. We don&apos;t fix; we witness.
                  </p>
                </motion.article>
                <motion.article
                  variants={fadeUp}
                  className="rounded-[20px] bg-white p-6 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.2)] md:p-8"
                >
                  <h3 className="text-lg font-bold text-[#2d4f40] md:text-xl">
                    Radical Empathy
                  </h3>
                  <p className="mt-3 text-[15px] leading-7 text-[#4a4a4a]">
                    Empathy isn&apos;t just a feeling — it&apos;s a shared
                    architectural space. We build digital atriums where your
                    words can echo until they finally make sense to you.
                  </p>
                </motion.article>
              </motion.div>
            </div>
          </div>
        </section>
        {/* Growth cycle timeline */}
        <section className="border-t border-black/[0.04] bg-[#f9f9f9] py-16 md:py-24">
          <motion.div
            className="mx-auto max-w-[800px] px-6 text-center md:px-10"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.55 }}
          >
            <h2
              className={`${playfair.className} text-3xl font-semibold text-[#2d5a4c] md:text-[42px]`}
            >
              The Growth Cycle
            </h2>
            <p className="mt-4 text-[15px] leading-7 text-[#6f7977] md:text-[17px]">
              From a single conversation to a global sanctuary, our evolution
              has been as organic as the roots we share.
            </p>
          </motion.div>

          <div className="relative mx-auto mt-16 max-w-[1100px] px-6 md:px-10">
            <div
              className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-linear-to-b from-[#d5ddd9] via-[#c5cfc9] to-[#d5ddd9] md:block"
              aria-hidden
            />

            <div className="flex flex-col gap-16 md:gap-24">
              <GrowthPhase
                align="left"
                title="Seed Phase"
                subtitle="2021 — The spark"
                body="We began as intimate digital letters — one voice answering another with patience, offering connection without performance."
                imageSrc={imgSeed}
                imageAlt="Sprout in a pot, beginning of growth"
                delay={0}
              />
              <GrowthPhase
                align="right"
                title="Sprout Phase"
                subtitle="2022 — Expansion"
                body="Healers joined our circle. We launched our first atrium — a shared room for rituals, listening, and collective care."
                imageSrc={imgForest}
                imageAlt="Misty pine forest and mountains"
                delay={0.08}
              />
              <GrowthPhase
                align="left"
                title="The Atrium Phase"
                subtitle="2024 — Mastery"
                body="ApnaHealer became a global sanctuary: structured sessions, communities, and spaces where stories echo until they settle into clarity."
                imageSrc={imgAtrium}
                imageAlt="Tree inside a bright architectural atrium"
                delay={0.12}
              />
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="border-t border-black/[0.04] bg-[#f9f8f4] py-16 md:py-24">
          <motion.div
            className="mx-auto max-w-[1100px] px-6 text-center md:px-10"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.55 }}
          >
            <h2 className="font-[family-name:var(--font-manrope)] text-3xl font-semibold tracking-[-0.02em] text-[#1a1a1a] md:text-[44px]">
              Our Living Roots
            </h2>
            <p className="mt-3 text-[16px] text-[#6a7572] md:text-[17px]">
              A collective of listeners, healers, and guides.
            </p>
          </motion.div>

          <motion.div
            className="relative mt-12 w-full"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative w-full overflow-hidden px-2 sm:px-4 md:px-6">
              <div className="grid w-full grid-flow-dense grid-cols-8 auto-rows-[64px] gap-1.5 sm:grid-cols-10 sm:auto-rows-[72px] sm:gap-2 md:grid-cols-14 md:auto-rows-[76px] lg:grid-cols-16 lg:auto-rows-[80px] xl:grid-cols-[repeat(18,minmax(0,1fr))] xl:auto-rows-[84px]">
                {livingRootsMosaic.map((member, index) => (
                  <LivingRootsTile
                    key={`${member.name}-${index}`}
                    member={member}
                    isCenter={member.isCenter}
                    className={member.gridClass}
                    blobClass={
                      member.isCenter
                        ? LIVING_ROOTS_CENTER_BLOB
                        : (LIVING_ROOTS_BLOB_SHAPES[index % LIVING_ROOTS_BLOB_SHAPES.length] ??
                          LIVING_ROOTS_BLOB_SHAPES[0])
                    }
                  />
                ))}
              </div>

              {/* Light edge fade — narrow, low opacity */}
              <div
                className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 sm:w-14 md:w-20"
                style={{
                  background:
                    "linear-gradient(to right, #f9f8f4 0%, rgba(249,248,244,0.45) 35%, rgba(249,248,244,0.12) 65%, transparent 100%)",
                }}
              />
              <div
                className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 sm:w-14 md:w-20"
                style={{
                  background:
                    "linear-gradient(to left, #f9f8f4 0%, rgba(249,248,244,0.45) 35%, rgba(249,248,244,0.12) 65%, transparent 100%)",
                }}
              />
              <div
                className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 sm:h-10 md:h-12"
                style={{
                  background:
                    "linear-gradient(to bottom, #f9f8f4 0%, rgba(249,248,244,0.4) 40%, transparent 100%)",
                }}
              />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 sm:h-10 md:h-12"
                style={{
                  background:
                    "linear-gradient(to top, #f9f8f4 0%, rgba(249,248,244,0.4) 40%, transparent 100%)",
                }}
              />
            </div>
          </motion.div>
        </section>

        {/* CTA */}
        <motion.section
          className="border-t border-black/[0.04] bg-[#f0f7f0] py-20 md:py-28"
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={staggerContainer}
        >
          <div className="mx-auto max-w-[720px] px-6 text-center md:px-10">
            <motion.p
              variants={fadeUp}
              className="text-xl font-semibold text-[#3a4543] md:text-2xl"
            >
              Your story is waiting to be heard.
            </motion.p>
            <motion.p
              variants={fadeUp}
              className={`${playfair.className} mt-3 text-2xl font-bold italic text-[#3e6652] md:text-3xl`}
            >
              Shall we begin?
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-wrap items-center justify-center gap-4"
            >
              <Link
                href="/contact"
                className="rounded-full bg-[#3e6652] px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#325544]"
              >
                Book your first session
              </Link>
              <a
                href="#narrative"
                className="rounded-full border border-[#3e6652] bg-transparent px-8 py-3.5 text-sm font-semibold text-[#3e6652] transition hover:bg-white/60"
              >
                Explore our roots
              </a>
            </motion.div>
          </div>
        </motion.section>
      </main>

      <LandingFooter />
    </div>
  );
}

function LivingRootsTile({
  member,
  className,
  blobClass,
  isCenter,
}: {
  member: LivingRootsMember;
  className: string;
  blobClass: string;
  isCenter?: boolean;
}) {
  return (
    <div className={`group relative min-h-0 w-full ${className}`}>
      <div
        className={`relative h-full w-full overflow-hidden shadow-[0_6px_18px_-16px_rgba(0,0,0,0.3)] ${blobClass}`}
      >
        <Image
          src={member.src}
          alt=""
          fill
          className="object-cover object-center"
          sizes={
            isCenter
              ? "(max-width: 768px) 22vw, 140px"
              : "(max-width: 768px) 12vw, 88px"
          }
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:p-2">
          <span
            className={`inline-flex max-w-[calc(100%-0.5rem)] items-center rounded-full bg-white/95 px-2.5 py-1 font-semibold uppercase tracking-[0.06em] text-[#2d5a4c] shadow-sm ${
              isCenter ? "text-[9px] sm:text-[10px]" : "text-[8px] sm:text-[9px]"
            }`}
          >
            {member.name}
            <span className="mx-1 font-normal text-[#9aa6a1]">·</span>
            {member.role}
          </span>
        </div>
      </div>
    </div>
  );
}

function GrowthPhase({
  align,
  title,
  subtitle,
  body,
  imageSrc,
  imageAlt,
  delay,
}: {
  align: "left" | "right";
  title: string;
  subtitle: string;
  body: string;
  imageSrc: string;
  imageAlt: string;
  delay: number;
}) {
  const textBlock = (
    <motion.div
      className={`flex flex-1 flex-col justify-center md:max-w-[420px] ${
        align === "left"
          ? "md:items-end md:text-right"
          : "md:items-start md:text-left"
      }`}
      initial={{ opacity: 0, x: align === "left" ? -36 : 36 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={viewport}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <h3 className="font-[family-name:var(--font-manrope)] text-xl font-semibold text-[#2d5a4c] md:text-2xl">
        {title}
      </h3>
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8aa99a]">
        {subtitle}
      </p>
      <p className="mt-4 text-[15px] leading-7 text-[#5c6865] md:text-[16px]">
        {body}
      </p>
    </motion.div>
  );

  const imageBlock = (
    <motion.div
      className="relative mx-auto w-full max-w-[320px] flex-1 md:max-w-[380px]"
      initial={{ opacity: 0, x: align === "left" ? 36 : -36 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={viewport}
      transition={{
        duration: 0.55,
        delay: delay + 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <div className="relative aspect-square overflow-hidden rounded-[20px] shadow-[0_20px_45px_-30px_rgba(0,0,0,0.35)] ring-1 ring-black/5">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 90vw, 380px"
        />
      </div>
    </motion.div>
  );

  const node = (
    <div className="relative z-10 order-2 hidden w-8 shrink-0 md:flex md:justify-center">
      <motion.div
        className="mt-8 h-3.5 w-3.5 rounded-full border-4 border-[#f9f9f9] bg-[#2d5a4c] shadow-[0_0_0_1px_rgba(45,90,76,0.25)]"
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={viewport}
        transition={{ type: "spring", stiffness: 320, damping: 18, delay }}
      />
    </div>
  );

  if (align === "left") {
    return (
      <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:gap-6">
        <div className="order-1 flex w-full flex-1 justify-start md:justify-end md:pr-4">
          {textBlock}
        </div>
        {node}
        <div className="order-3 flex w-full flex-1 justify-start md:pl-4">
          {imageBlock}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:gap-6">
      <div className="order-1 flex w-full flex-1 justify-center md:justify-end md:pr-4">
        {imageBlock}
      </div>
      {node}
      <div className="order-3 flex w-full flex-1 justify-start md:pl-4">
        {textBlock}
      </div>
    </div>
  );
}
