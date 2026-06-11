"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FadeIn, hoverLiftTransition, morphTransition } from "@/components/ui/fade-in";
import { TableSkeleton } from "@/components/skeletons";
import { apiFetch } from "@/lib/api-client";
import { formatBlogDate, formatCompactCount } from "@/lib/display";
import type { ApiBlogAuthorStats, ApiBlogListResponse } from "@/types/api";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending review",
  PUBLISHED: "Published",
  REJECTED: "Rejected",
  UNPUBLISHED: "Unpublished",
};

export default function BlogPage() {
  const statsQuery = useQuery({
    queryKey: ["blog-stats"],
    queryFn: () => apiFetch<ApiBlogAuthorStats>("/api/blogs/me/stats"),
  });

  const blogsQuery = useQuery({
    queryKey: ["blogs"],
    queryFn: () => apiFetch<ApiBlogListResponse>("/api/blogs"),
  });

  const stats = statsQuery.data;
  const blogs = blogsQuery.data?.items ?? [];

  const metrics = stats
    ? [
        { label: "Total Views", value: formatCompactCount(stats.totalViews), trend: "Live" },
        { label: "Global Likes", value: formatCompactCount(stats.totalLikes), trend: "Live" },
        { label: "Reflections", value: String(stats.publishedCount), trend: "Published" },
      ]
    : [];

  return (
    <FadeIn className="space-y-10">
      <section className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={morphTransition}>
            <h1 className="font-display text-5xl font-semibold text-text-primary md:text-6xl">My Blogs</h1>
            <p className="mt-3 max-w-xl text-lg text-text-primary/68">
              Curate your thoughts, track your reach, and nurture your digital sanctuary.
            </p>
          </motion.div>
          <Link
            href="/dashboard/blog/new"
            className="inline-flex rounded-full bg-text-secondary px-9 py-4 text-base font-semibold text-white shadow-sm hover:shadow-[0_12px_32px_-10px_rgb(47_93_80/50%)]"
          >
            Write New Story
          </Link>
        </div>

        {statsQuery.isLoading ? (
          <TableSkeleton rows={1} columns={3} />
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {metrics.map((metric, index) => (
              <motion.article
                key={metric.label}
                className="rounded-calm border border-[#ebe5de] bg-white px-7 py-10 shadow-soft md:px-8 md:py-11"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...morphTransition, delay: 0.06 + index * 0.07 }}
                whileHover={{ y: -5, transition: hoverLiftTransition }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-primary/45">
                  {metric.label}
                </p>
                <p className="mt-3 text-5xl font-semibold text-text-primary">{metric.value}</p>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-6">
        {blogsQuery.isLoading ? (
          <TableSkeleton rows={4} columns={4} />
        ) : blogs.length === 0 ? (
          <div className="rounded-calm border border-[#ebe5de] bg-white p-10 text-center shadow-soft">
            <p className="text-lg text-text-primary/60">No stories yet. Start your first reflection.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {blogs.map((blog) => (
              <article
                key={blog.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-calm border border-[#ebe5de] bg-white p-5 shadow-soft"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-semibold text-text-primary">{blog.title}</h2>
                    <span className="rounded-full bg-[#ece9e2] px-2.5 py-0.5 text-xs font-semibold text-text-primary/60">
                      {STATUS_LABELS[blog.status] ?? blog.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-text-primary/55">
                    {formatBlogDate(blog.publishedAt ?? blog.updatedAt)} · {formatCompactCount(blog.viewCount)} views
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/blog/${blog.id}/edit`}
                    className="rounded-full border border-[#ded7ce] px-4 py-2 text-sm font-semibold text-text-primary/70 hover:bg-accent/30"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/dashboard/blog/${blog.id}/preview`}
                    className="rounded-full border border-[#ded7ce] px-4 py-2 text-sm font-semibold text-text-primary/70 hover:bg-accent/30"
                  >
                    Preview
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </FadeIn>
  );
}
