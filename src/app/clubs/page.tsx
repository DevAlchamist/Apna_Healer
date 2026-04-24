"use client";

import { motion } from "framer-motion";
import { LandingFooter } from "@/components/landing/footer";
import { LandingNavbar } from "@/components/landing/navbar";

const sphereCards = [
  {
    title: "Anxiety Support",
    description:
      "Finding calm in the chaos. These circles focus on grounding techniques, breathwork, and shared vulnerability.",
    action: "View 12 Circles",
    iconColor: "bg-[#bde6d7]",
  },
  {
    title: "Creative Expression",
    description:
      "Using art, journaling, and music as a conduit for emotional release and self-discovery.",
    action: "View 15 Circles",
    iconColor: "bg-[#bde6d7]",
  },
  {
    title: "Mindful Movement",
    description:
      "Connecting mind and body through gentle flow, restorative yoga, and somatic healing practices.",
    action: "View 8 Circles",
    iconColor: "bg-[#e8ddcf]",
  },
] as const;

export default function ClubsLandingPage() {
  const revealUp = {
    hidden: { opacity: 0, y: 26 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
  } as const;

  return (
    <div className="bg-[#f4f4f2] text-[#273331]">
      <LandingNavbar />
      <main>
        <motion.section
          className="mx-auto grid max-w-[1240px] items-center gap-12 px-6 py-14 md:px-10 lg:grid-cols-2"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7d8f8a]">
              Community Circles
            </p>
            <h1 className="mt-4 text-6xl font-semibold leading-[1.02] tracking-[-0.03em] text-[#242d2c] md:text-7xl">
              Find Your
              <br />
              <span className="text-[#2f745f]">Tribe</span>
            </h1>
            <p className="mt-6 max-w-[470px] text-[18px] leading-8 text-[#64706e]">
              Healing isn&apos;t a solitary journey. Join curated, therapist-guided
              circles designed to help you breathe, grow, and reconnect with
              others who understand your path.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="h-8 w-8 rounded-full border-2 border-[#f4f4f2] bg-[linear-gradient(145deg,#7b5d46,#ceb089)]" />
                <div className="h-8 w-8 rounded-full border-2 border-[#f4f4f2] bg-[linear-gradient(145deg,#4f6659,#a6c2b2)]" />
                <div className="h-8 w-8 rounded-full border-2 border-[#f4f4f2] bg-[linear-gradient(145deg,#8ea5b4,#d2dde4)]" />
              </div>
              <p className="text-sm text-[#6d7876]">Joined by 2.4k members today</p>
            </div>
          </div>
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 7, ease: "easeInOut", repeat: Infinity }}
            className="mx-auto h-[420px] w-full max-w-[540px] rounded-[43%_57%_42%_58%/56%_45%_55%_44%] bg-[radial-gradient(circle_at_60%_24%,#f0dfba,#a88a64_48%,#5d4b37)] shadow-[0_24px_48px_-30px_rgba(0,0,0,0.45)]"
          />
        </motion.section>

        <motion.section
          className="bg-[#f0efec] py-16"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto max-w-[1240px] px-6 md:px-10">
            <h2 className="text-center text-[52px] font-semibold tracking-[-0.02em] text-[#222b2a]">
              Explore the Spheres
            </h2>
            <p className="mx-auto mt-3 max-w-[620px] text-center text-[#737d7b]">
              We&apos;ve organized our circles into resonant spheres of support. No
              rigid boxes, just fluid spaces for exploration.
            </p>
            <div className="mt-11 grid gap-6 lg:grid-cols-3">
              {sphereCards.map((card, index) => (
                <motion.article
                  key={card.title}
                  className={`rounded-[30px] bg-white p-8 shadow-[0_16px_30px_-26px_rgba(0,0,0,0.45)] ${
                    index === 1 ? "lg:translate-y-8" : ""
                  }`}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className={`h-11 w-11 rounded-xl ${card.iconColor}`} />
                  <h3 className="mt-6 text-[37px] font-semibold tracking-[-0.02em] text-[#26302f]">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-7 text-[#707b79]">
                    {card.description}
                  </p>
                  <a
                    href="#"
                    className="mt-6 inline-flex text-sm font-semibold text-[#2f745f]"
                  >
                    {card.action} →
                  </a>
                </motion.article>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          className="py-16"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto max-w-[1240px] px-6 md:px-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-[52px] font-semibold tracking-[-0.02em] text-[#222b2a]">
                  Active Circles
                </h2>
                <p className="mt-1 text-[#7a8583]">
                  Real-time pulses of communities breathing together.
                </p>
              </div>
              <a href="#" className="text-sm font-semibold text-[#2f745f]">
                See all live sessions →
              </a>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {[
                ["Morning Gratitude Flow", "82 members currently breathing", "Tune In", "Live Now"],
                ["Social Anxiety Safe Space", "14 members currently listening", "Listen Silently", "Live Now"],
                ["Grief & Memory Workshop", "Led by Dr. Aris Thorne", "Remind Me", "Starts in 15m"],
              ].map(([title, detail, action, state]) => (
                <motion.article
                  key={title}
                  className="rounded-[24px] border border-[#e6e6e3] bg-white p-5"
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="rounded-full bg-[#ffe9e9] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#be6161]">
                    {state}
                  </span>
                  <h3 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-[#283231]">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm text-[#7a8582]">{detail}</p>
                  <div className="mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#edf2f0] text-[#4d5d59]">
                    ●
                  </div>
                  <button className="mt-5 h-11 w-full rounded-xl bg-[#f0f2f1] text-sm font-semibold text-[#2f745f]">
                    {action}
                  </button>
                </motion.article>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          className="py-16"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto max-w-[1240px] px-6 md:px-10">
            <h2 className="text-6xl font-semibold leading-[1.02] tracking-[-0.03em] text-[#242d2c] md:text-7xl">
              Selected
              <br />
              Community
              <br />
              <span className="text-[#2f745f]">Highlights</span>
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {[
                [
                  "Wellness Club",
                  "The Breathwork Collective",
                  "A deep-dive into pranayama and modern stress-release breathing.",
                  "bg-[radial-gradient(circle_at_40%_20%,#dbe5e7,#7d9497_48%,#3f4c4c)]",
                ],
                [
                  "Expression Club",
                  "Vulnerable Ink Journals",
                  "Connecting through radical honesty in daily reflective writing prompts.",
                  "bg-[radial-gradient(circle_at_55%_20%,#c9b294,#7f6148_52%,#3f2c1f)]",
                ],
              ].map(([tag, title, text, color]) => (
                <motion.article key={title} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                  <div className={`h-[500px] rounded-[32px] ${color} p-6`} />
                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-[#7d8986]">
                        {tag}
                      </p>
                      <h3 className="mt-1 text-[44px] font-semibold tracking-[-0.02em] text-[#273230]">
                        {title}
                      </h3>
                      <p className="mt-3 max-w-[470px] text-[15px] leading-7 text-[#727d7b]">
                        {text}
                      </p>
                    </div>
                    <button className="grid h-10 w-10 place-content-center rounded-full border border-[#9ac4b5] text-[#2f745f]">
                      ↗
                    </button>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          className="px-6 pb-16 md:px-10"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div
            whileHover={{ scale: 1.005 }}
            transition={{ duration: 0.2 }}
            className="mx-auto max-w-[1240px] rounded-[38px] bg-[#2f745f] px-8 py-14 text-center md:px-14"
          >
            <h2 className="text-[58px] font-semibold tracking-[-0.02em] text-white">
              Ready to find your circle?
            </h2>
            <p className="mx-auto mt-4 max-w-[620px] text-[18px] text-[#cde4dc]">
              Start your 14-day discovery pass. Connect with guides, join live
              sessions, and meet your community.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button className="rounded-full bg-white px-9 py-3 text-sm font-semibold text-[#2f745f]">
                Get Started Free
              </button>
              <button className="rounded-full border border-white/50 px-9 py-3 text-sm font-semibold text-white">
                Host a Circle
              </button>
            </div>
          </motion.div>
        </motion.section>
      </main>
      <LandingFooter />
    </div>
  );
}
