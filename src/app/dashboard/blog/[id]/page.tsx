"use client";

import { FadeIn, hoverLiftTransition, morphTransition } from "@/components/ui/fade-in";
import { blogDetails } from "@/data/blogs";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";

export default function BlogViewPage() {
  const params = useParams<{ id: string }>();
  const blog = blogDetails.find((entry) => entry.id === (params?.id ?? ""));

  if (!blog) {
    return (
      <FadeIn className="rounded-calm border border-accent/70 bg-white p-8">
        <h1 className="font-display text-4xl font-semibold text-text-primary">Story not found</h1>
        <p className="mt-3 text-text-primary/65">This story may have been moved or is no longer available.</p>
      </FadeIn>
    );
  }

  return (
    <FadeIn className="space-y-8 pb-10 md:space-y-10 md:pb-12">
      <motion.section
        className="rounded-calm bg-white p-6 shadow-soft md:p-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={morphTransition}
      >
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-primary/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-secondary">
              {blog.tag}
            </span>
            <span className="text-text-primary/55">{blog.publishedAt}</span>
          </div>

          <h1 className="font-display text-6xl font-semibold leading-[0.9] text-text-primary md:text-7xl">{blog.title}</h1>

          <div className="grid gap-3 md:grid-cols-3">
            {[
              { label: "Total Views", value: blog.views, icon: "eye" },
              { label: "Appreciations", value: blog.likes, icon: "heart" },
              { label: "Thoughts Shared", value: blog.comments, icon: "chat" },
            ].map((metric) => (
              <motion.article
                key={metric.label}
                className="rounded-gentle bg-background px-5 py-4 shadow-soft"
                whileHover={{ y: -3, transition: hoverLiftTransition }}
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-text-secondary">
                    {metric.icon === "eye" ? (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </svg>
                    ) : metric.icon === "heart" ? (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                        <path d="M12 21s-7.5-4.8-9.5-9a5.5 5.5 0 0 1 9.5-5.3A5.5 5.5 0 0 1 21.5 12c-2 4.2-9.5 9-9.5 9Z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M4 5h16v11H7l-3 3V5Z" />
                      </svg>
                    )}
                  </span>
                  <div>
                    <p className="font-display text-4xl font-semibold text-text-primary">{metric.value}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/45">{metric.label}</p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.img
        src={blog.heroImage}
        alt={blog.title}
        className="h-[320px] w-full rounded-calm object-cover shadow-soft md:h-[420px]"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...morphTransition, delay: 0.05 }}
      />

      <motion.article
        className="rounded-calm bg-white p-6 shadow-soft md:p-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...morphTransition, delay: 0.08 }}
      >
        <p className="text-[1.75rem] leading-relaxed text-text-primary/82 md:text-[2rem]">{blog.intro}</p>

        <h2 className="mt-9 font-display text-5xl font-semibold text-text-primary md:text-6xl">{blog.sectionTitle}</h2>
        <p className="mt-4 text-[1.08rem] leading-relaxed text-text-primary/74 md:text-[1.15rem]">{blog.sectionBody}</p>

        <blockquote className="mt-8 rounded-gentle bg-background px-6 py-6">
          <p className="text-4xl text-text-primary/25">&quot;</p>
          <p className="-mt-2 text-4xl italic text-text-secondary md:text-5xl">{blog.quote}</p>
          <footer className="mt-4 text-sm font-semibold text-text-primary/55">— {blog.quoteBy}</footer>
        </blockquote>

        <p className="mt-8 text-[1.08rem] leading-relaxed text-text-primary/74 md:text-[1.15rem]">{blog.paragraph}</p>
      </motion.article>

      <motion.section
        className="rounded-calm bg-white p-6 shadow-soft md:p-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...morphTransition, delay: 0.12 }}
      >
        <div className="grid gap-6 md:grid-cols-[1fr_280px] md:items-start">
          <div>
            <h3 className="font-display text-4xl font-semibold text-text-primary">Morning Rituals</h3>
            <ul className="mt-4 space-y-2 text-[1.02rem] text-text-primary/75">
              {blog.rituals.map((ritual) => (
                <li key={ritual} className="flex items-start gap-2">
                  <span className="mt-2 h-2.5 w-2.5 rounded-full bg-primary/80" />
                  <span>{ritual}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={blog.sideImage} alt="Ritual illustration" className="h-64 w-full rounded-gentle object-cover shadow-soft" />
        </div>

        <div className="mt-8 flex justify-end">
          <div className="flex items-center gap-2 rounded-full bg-[#414542] px-2 py-2 shadow-soft">
            <button
              type="button"
              className="rounded-full bg-text-secondary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2f6a58]"
            >
              ✎ Edit Story
            </button>
            <button
              type="button"
              className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Analytics"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M5 19h14M7 17V8M12 17V5M17 17v-6" strokeLinecap="round" />
              </svg>
            </button>
            <button
              type="button"
              className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Share"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M8 12 16 7M8 12l8 5M8 12h0" strokeLinecap="round" />
                <circle cx="6" cy="12" r="2" />
                <circle cx="18" cy="6" r="2" />
                <circle cx="18" cy="18" r="2" />
              </svg>
            </button>
          </div>
        </div>
      </motion.section>
    </FadeIn>
  );
}
