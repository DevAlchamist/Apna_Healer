"use client";

import { FadeIn, hoverLiftTransition, morphTransition } from "@/components/ui/fade-in";
import { motion } from "framer-motion";
import Link from "next/link";
import { publishedBlogs } from "@/data/blogs";

const metrics = [
  { label: "Total Views", value: "14.2k", trend: "+12%" },
  { label: "Global Likes", value: "2,840", trend: "+5%" },
  { label: "Reflections", value: "412", trend: "Stable" },
];

export default function BlogPage() {
  return (
    <FadeIn className="space-y-10">
      <section className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={morphTransition}
          >
            <h1 className="font-display text-5xl font-semibold text-text-primary md:text-6xl">My Blogs</h1>
            <p className="mt-3 max-w-xl text-lg text-text-primary/68">
              Curate your thoughts, track your reach, and nurture your digital sanctuary.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ ...morphTransition, delay: 0.08 }}
          >
            <Link
              href="/dashboard/blog/new"
              className="inline-flex rounded-full bg-text-secondary px-9 py-4 text-base font-semibold text-white shadow-sm transition-shadow duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[0_12px_32px_-10px_rgb(47_93_80/50%)]"
            >
              Write New Story
            </Link>
          </motion.div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {metrics.map((metric, index) => (
            <motion.article
              key={metric.label}
              className="rounded-calm border border-[#ebe5de] bg-white px-7 py-10 shadow-soft transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-primary/20 hover:shadow-soft-hover md:px-8 md:py-11"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...morphTransition, delay: 0.06 + index * 0.07 }}
              whileHover={{ y: -5, transition: hoverLiftTransition }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-primary/45">
                  {metric.label}
                </p>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-transform duration-300 ${
                    metric.trend === "Stable"
                      ? "bg-[#ece8e1] text-text-primary/45"
                      : "bg-primary/20 text-text-secondary"
                  }`}
                >
                  {metric.trend}
                </span>
              </div>
              <p className="mt-3 text-5xl font-semibold text-text-primary">{metric.value}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <motion.div
          className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ded7ce] pb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...morphTransition, delay: 0.12 }}
        >
          <div className="flex flex-wrap items-center gap-4 text-sm md:gap-6">
            <motion.button
              type="button"
              className="border-b-2 border-text-secondary pb-2 font-semibold text-text-secondary"
              whileHover={{ y: -1 }}
              transition={hoverLiftTransition}
            >
              Published (12)
            </motion.button>
            <motion.button
              type="button"
              className="pb-2 text-text-primary/60 transition-colors hover:text-text-primary"
              whileHover={{ y: -1 }}
              transition={hoverLiftTransition}
            >
              Drafts (3)
            </motion.button>
            <motion.button
              type="button"
              className="pb-2 text-text-primary/60 transition-colors hover:text-text-primary"
              whileHover={{ y: -1 }}
              transition={hoverLiftTransition}
            >
              Archived
            </motion.button>
          </div>
          <motion.button
            type="button"
            className="text-sm text-text-primary/55 transition-colors hover:text-text-secondary"
            whileHover={{ x: 2 }}
            transition={hoverLiftTransition}
          >
            Sort by: Recent
          </motion.button>
        </motion.div>

        <div className="space-y-5">
          {publishedBlogs.map((post, index) => (
            <motion.article
              key={post.title}
              className="group rounded-calm border border-[#ebe5de] bg-white p-5 shadow-soft transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-primary/15 hover:shadow-soft-hover md:p-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...morphTransition, delay: 0.08 + index * 0.06 }}
              whileHover={{ y: -4, transition: hoverLiftTransition }}
            >
              <div className="grid gap-5 md:grid-cols-[170px_1fr]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="h-60 w-full rounded-gentle object-cover transition-transform duration-620 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.02]"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider">
                    <span className="rounded-full bg-primary/20 px-2 py-1 text-text-secondary">{post.tag}</span>
                    <span className="text-text-primary/45">{post.date}</span>
                  </div>
                  <Link href={`/dashboard/blog/${post.id}`}>
                    <h2 className="mt-2 font-display text-[2rem] font-semibold leading-tight text-text-primary transition-colors hover:text-text-secondary">
                      {post.title}
                    </h2>
                  </Link>
                  <p className="mt-3 text-[1.05rem] text-text-primary/66">{post.excerpt}</p>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#e8e1d7] pt-4">
                    <p className="text-sm text-text-primary/56">
                      {post.views} views · {post.likes} likes · {post.comments} comments
                    </p>
                    <motion.button
                      type="button"
                      className="rounded-full bg-[#ebe8e3] px-6 py-2 text-sm font-semibold text-text-primary/75 transition-colors duration-300 hover:bg-accent/80"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      transition={hoverLiftTransition}
                    >
                      Edit Story
                    </motion.button>
                    <Link
                      href={`/dashboard/blog/${post.id}`}
                      className="rounded-full border border-accent/80 px-5 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-accent/35"
                    >
                      Read Story
                    </Link>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}

          <motion.article
            className="rounded-calm border border-dashed border-[#e6ded3] bg-[#f9f7f4] p-5 shadow-sm transition-[border-color,background-color] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-primary/30 hover:bg-primary/5 md:p-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...morphTransition, delay: 0.2 }}
            whileHover={{ y: -3, transition: hoverLiftTransition }}
          >
            <div className="grid gap-5 md:grid-cols-[170px_1fr]">
              <motion.div
                className="flex h-40 items-center justify-center rounded-gentle border border-[#e4ddd3] text-4xl text-text-primary/25"
                whileHover={{ scale: 1.03 }}
                transition={hoverLiftTransition}
              >
                +
              </motion.div>
              <div>
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-text-primary/45">
                  <span className="rounded-full bg-[#e9e1d7] px-2 py-1">Draft</span>
                  <span>Modified 2 days ago</span>
                </div>
                <h3 className="mt-3 font-display text-[2rem] italic text-text-primary/70">
                  Why we struggle with boundaries...
                </h3>
                <p className="mt-3 text-[1.05rem] text-text-primary/65">
                  Title still in progress. Exploring the relationship between people-pleasing and emotional burnout.
                </p>
                <motion.button
                  type="button"
                  className="mt-6 rounded-full bg-text-secondary px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow duration-500 hover:shadow-[0_10px_28px_-8px_rgb(47_93_80/45%)]"
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  transition={hoverLiftTransition}
                >
                  Continue Writing
                </motion.button>
              </div>
            </div>
          </motion.article>
        </div>
      </section>
    </FadeIn>
  );
}
