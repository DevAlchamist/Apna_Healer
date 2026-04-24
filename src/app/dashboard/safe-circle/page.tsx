"use client";

import { safeCirclePosts } from "@/data/safe-circle-posts";
import { FadeIn, hoverLiftTransition, morphTransition } from "@/components/ui/fade-in";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

const safeCircles = [
  {
    title: "Anxiety",
    description: "Managing the waves of daily stress together.",
    badge: "12 NEW",
    members: "+1.2k",
    tone: "mint",
  },
  {
    title: "Relationships",
    description: "Connection, boundaries, and meaningful bonds.",
    badge: "8 NEW",
    members: "+450",
    tone: "sand",
  },
  {
    title: "Daily Thoughts",
    description: "A safe space for reflections and journaling.",
    badge: "",
    members: "+2k",
    tone: "mint",
  },
];

function CircleIcon({ tone }: { tone: "mint" | "sand" }) {
  return (
    <span
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${
        tone === "mint" ? "bg-primary/20 text-text-secondary" : "bg-[#e9dfd1] text-[#8b6b46]"
      }`}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3 5.5 6v5.8c0 3.8 2.5 7.1 6.5 8.4 4-1.3 6.5-4.6 6.5-8.4V6L12 3Z" />
      </svg>
    </span>
  );
}

export default function SafeCirclePage() {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  return (
    <>
      <motion.div
        className="space-y-10 pb-10 md:space-y-12 md:pb-12"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={morphTransition}
      >
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-primary/45">Your Safe Circles</p>
          <p className="text-sm text-text-primary/65">Quiet spaces for shared experiences</p>

          <div className="mt-6 grid gap-4 md:gap-5 lg:grid-cols-4">
          {safeCircles.map((circle, index) => (
            <motion.article
              key={circle.title}
              className="rounded-calm border border-accent/80 bg-white p-5 shadow-soft transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-soft-hover md:p-6"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ ...morphTransition, delay: 0.03 * index }}
              whileHover={{ y: -5, transition: hoverLiftTransition }}
            >
              <div className="flex items-center justify-between">
                <CircleIcon tone={circle.tone as "mint" | "sand"} />
                {circle.badge ? (
                  <span className="rounded-full bg-accent/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-primary/65">
                    {circle.badge}
                  </span>
                ) : null}
              </div>
              <h3 className="mt-6 font-display text-3xl font-semibold text-text-primary">{circle.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-primary/65">{circle.description}</p>
              <p className="mt-5 text-sm font-semibold text-text-primary/55">{circle.members}</p>
            </motion.article>
          ))}

          <motion.article
            className="flex min-h-[230px] flex-col items-center justify-center rounded-calm border border-dashed border-accent bg-white/70 p-6 text-center md:p-7"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ ...morphTransition, delay: 0.12 }}
            whileHover={{ y: -4, transition: hoverLiftTransition }}
          >
            <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-accent text-2xl text-text-primary/60">
              +
            </span>
            <h3 className="font-display text-3xl font-semibold text-text-primary/85">Join New Circle</h3>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-primary/35">
              Expand your sanctuary
            </p>
          </motion.article>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-6">
            <div className="rounded-calm border border-accent/80 bg-white p-4 md:p-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[url('https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&q=80&auto=format&fit=crop')] bg-cover bg-center" />
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="flex-1 rounded-gentle bg-background px-4 py-2.5 text-left text-sm text-text-primary/45 transition-colors hover:bg-accent/40"
                >
                  Share your thoughts with the atrium...
                </button>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-text-secondary text-lg text-white"
                  aria-label="Open share modal"
                >
                  +
                </button>
              </div>

              <div className="mt-5 flex items-center gap-5 border-b border-accent/80 pb-2 text-xs font-medium">
                <button type="button" className="border-b-2 border-text-secondary pb-2 text-text-primary">
                  Recent Activity
                </button>
                <button type="button" className="pb-2 text-text-primary/45">
                  Popular Deep Dives
                </button>
                <button type="button" className="pb-2 text-text-primary/45">
                  Guided Prompts
                </button>
              </div>
            </div>

            {safeCirclePosts.map((post, index) => (
              <motion.article
                key={post.title}
                className="rounded-calm border border-accent/80 bg-white p-6 shadow-soft md:p-7"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ ...morphTransition, delay: 0.05 + index * 0.05 }}
                whileHover={{ y: -4, transition: hoverLiftTransition }}
              >
                <p className="text-sm font-semibold text-text-primary">{post.author}</p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-text-primary/45">
                  {post.time} • {post.circle}
                </p>
                <Link href={`/dashboard/safe-circle/${post.slug}`} className="group block">
                  <h3 className="mt-4 font-display text-3xl font-semibold leading-tight text-text-primary transition-colors group-hover:text-text-secondary">
                    {post.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-text-primary/70">{post.body}</p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.15em] text-text-secondary">Read reflection</p>
                </Link>

                {post.image ? <div className="mt-5 h-[220px] rounded-gentle bg-cover bg-center" style={{ backgroundImage: `url('${post.image}')` }} /> : null}

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="rounded-full border border-accent/80 bg-white px-4 py-2 text-sm font-medium text-text-primary/70 hover:bg-accent/40"
                  >
                    Support ({post.support})
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-accent/80 bg-white px-4 py-2 text-sm font-medium text-text-primary/70 hover:bg-accent/40"
                  >
                    Relate ({post.relate})
                  </button>
                </div>
              </motion.article>
            ))}
          </div>

          <aside className="space-y-5">
            <FadeIn delay={0.06}>
              <section className="rounded-calm border border-accent/80 bg-white p-5 md:p-6">
                <h4 className="text-sm font-semibold text-text-primary">Trending Discussions</h4>
                <div className="mt-4 space-y-4 text-sm">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-text-primary/45">Mindfulness</p>
                    <p className="mt-1 font-semibold text-text-primary/80">The best morning rituals for high-anxiety days</p>
                    <p className="mt-1 text-xs text-text-primary/45">42 members relating today</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-text-primary/45">Boundaries</p>
                    <p className="mt-1 font-semibold text-text-primary/80">How to explain mental health days to your boss</p>
                    <p className="mt-1 text-xs text-text-primary/45">108 members relating today</p>
                  </div>
                </div>
              </section>
            </FadeIn>

            <FadeIn delay={0.1}>
              <section className="rounded-calm border border-accent/80 bg-white p-5 md:p-6">
                <h4 className="text-sm font-semibold text-text-primary">Discover Circles</h4>
                <div className="mt-3 space-y-3">
                  {["Creative Healing", "Sleep Hygiene"].map((item) => (
                    <div key={item} className="flex items-center justify-between rounded-gentle bg-background px-3 py-2.5 text-sm">
                      <span className="text-text-primary/80">{item}</span>
                      <button type="button" className="text-text-primary/45">
                        +
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </FadeIn>

            <FadeIn delay={0.14}>
              <section className="rounded-calm border border-accent/80 bg-accent/30 p-5 md:p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-primary/50">Community Heart</p>
                <p className="mt-3 text-sm leading-relaxed text-text-primary/75">
                  This is a space of radical empathy. We don&apos;t upvote or downvote; we support and relate. Please keep the
                  atrium warm.
                </p>
                <button type="button" className="mt-4 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  Community Guidelines
                </button>
              </section>
            </FadeIn>
          </aside>
        </section>
      </motion.div>

      <AnimatePresence>
        {isShareModalOpen ? (
          <motion.div
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/35 px-4 py-6 md:px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
          <motion.div
            className="w-full max-w-3xl rounded-calm border border-accent/80 bg-white p-6 shadow-[0_20px_64px_-20px_rgb(0_0_0/38%)] md:p-8"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={morphTransition}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-4xl font-semibold text-text-primary">Share from the heart</h2>
                <p className="mt-1 text-sm text-text-primary/55">Your story might be the light someone else needs today.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-background text-text-primary/45 hover:bg-accent/50"
                aria-label="Close share modal"
              >
                ×
              </button>
            </div>

            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-primary/35">Choose a Circle</p>
            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              {["Anxiety Support", "Daily Gratitude", "Mindful Living"].map((item, index) => (
                <button
                  key={item}
                  type="button"
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    index === 1
                      ? "border-primary/65 bg-primary/10 text-text-secondary"
                      : "border-accent/80 bg-background text-text-primary/60 hover:bg-accent/50"
                  }`}
                >
                  {item}
                </button>
              ))}
              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-accent/80 bg-background text-text-primary/55"
                aria-label="Add circle"
              >
                +
              </button>
            </div>

            <input
              type="text"
              placeholder="Title your reflection..."
              className="mt-6 w-full border-b border-accent/75 pb-3 font-display text-5xl font-semibold text-text-primary outline-none placeholder:text-text-primary/20"
            />

            <textarea
              placeholder="Write your story..."
              className="mt-5 min-h-[210px] w-full resize-none bg-transparent text-sm leading-relaxed text-text-primary/80 outline-none placeholder:text-text-primary/35"
            />

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-accent/75 pt-4">
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-text-primary/40">
                <button type="button" className="hover:text-text-secondary">
                  Add Image
                </button>
                <button type="button" className="hover:text-text-secondary">
                  I
                </button>
                <button type="button" className="hover:text-text-secondary">
                  ≡
                </button>
                <button type="button" className="hover:text-text-secondary">
                  Link
                </button>
              </div>

              <div className="flex items-center gap-4">
                <button type="button" className="text-[11px] font-semibold uppercase tracking-wide text-text-primary/35 hover:text-text-primary/55">
                  Privacy
                </button>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="rounded-full bg-text-secondary px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-soft-hover"
                >
                  Share with Community
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
      </AnimatePresence>
    </>
  );
}
