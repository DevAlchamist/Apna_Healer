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
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=900&h=1100&fit=crop&q=80";
const imgSeed =
  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=640&h=640&fit=crop&q=80";
const imgForest =
  "https://images.unsplash.com/photo-1441974231531-622684791016?w=640&h=640&fit=crop&q=80";
const imgAtrium =
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c0b?w=640&h=640&fit=crop&q=80";

const teamTop = [
  {
    name: "Elena S.",
    role: "Listener",
    src: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&q=80",
    blob: "60% 40% 30% 70% / 60% 30% 70% 40%",
  },
  {
    name: "Marcus J.",
    role: "Therapist",
    src: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&q=80",
    blob: "30% 60% 70% 40% / 50% 60% 30% 60%",
  },
  {
    name: "Sarah K.",
    role: "Psychologist",
    src: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop&q=80",
    blob: "50% 40% 60% 50% / 40% 50% 60% 50%",
  },
  {
    name: "David L.",
    role: "Guide",
    src: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&q=80",
    blob: "45% 55% 35% 65% / 55% 45% 65% 35%",
  },
  {
    name: "Aria M.",
    role: "Breathwork",
    src: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&q=80",
    blob: "40% 60% 55% 45% / 50% 40% 60% 50%",
  },
] as const;

const founder = {
  name: "Dr. Aris Varma",
  role: "Founder & Visionary",
  src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=560&h=560&fit=crop&q=80",
  blob: "55% 45% 45% 55% / 45% 55% 55% 45%",
} as const;

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

          <motion.ul
            className="mx-auto mt-12 flex max-w-[1100px] flex-wrap justify-center gap-x-6 gap-y-10 px-6 md:gap-x-8 md:px-10"
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
          >
            {teamTop.map((member) => (
              <motion.li
                key={member.name}
                variants={fadeUp}
                className="flex w-[45%] max-w-[140px] flex-col items-center sm:w-auto sm:max-w-none"
              >
                <div
                  className="relative h-28 w-28 overflow-hidden shadow-md ring-1 ring-black/5 sm:h-32 sm:w-32"
                  style={{
                    borderRadius: member.blob,
                  }}
                >
                  <Image
                    src={member.src}
                    alt={member.name}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>
                <p className="mt-4 text-center text-[12px] font-bold uppercase tracking-[0.08em] text-[#2d5a4c]">
                  {member.name}
                </p>
                <p className="mt-1 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9aa6a1]">
                  {member.role}
                </p>
              </motion.li>
            ))}
          </motion.ul>

          <motion.div
            className="mx-auto mt-14 flex max-w-[1100px] flex-col items-center px-6 md:px-10"
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="relative h-44 w-44 overflow-hidden shadow-[0_20px_50px_-28px_rgba(0,0,0,0.35)] ring-1 ring-black/5 sm:h-52 sm:w-52"
              style={{ borderRadius: founder.blob }}
            >
              <Image
                src={founder.src}
                alt={founder.name}
                fill
                className="object-cover contrast-125"
                sizes="208px"
              />
            </div>
            <p className="mt-5 text-center text-sm font-bold uppercase tracking-[0.1em] text-[#2d5a4c]">
              {founder.name}
            </p>
            <p className="mt-1 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9aa6a1]">
              {founder.role}
            </p>
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
