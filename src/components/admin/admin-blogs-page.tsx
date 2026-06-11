"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { apiFetch, apiMutation } from "@/lib/api-client";
import { formatBlogDate } from "@/lib/display";
import type { ApiBlogAnalyticsOverview, ApiBlogListResponse } from "@/types/api";
import { StatCardsSkeleton, TableSkeleton } from "@/components/skeletons";

const STATUS_OPTIONS = ["ALL", "PENDING_REVIEW", "PUBLISHED", "DRAFT", "REJECTED", "UNPUBLISHED"] as const;

export function AdminBlogsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("ALL");
  const [search, setSearch] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (status !== "ALL") params.set("status", status);
    if (search) params.set("q", search);
    return params.toString();
  }, [search, status]);

  const blogsQuery = useQuery({
    queryKey: ["admin-blogs", queryString],
    queryFn: () => apiFetch<ApiBlogListResponse>(`/api/admin/blogs?${queryString}`),
  });

  const analyticsQuery = useQuery({
    queryKey: ["admin-blog-analytics"],
    queryFn: () => apiFetch<ApiBlogAnalyticsOverview>("/api/admin/blogs/analytics"),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiMutation(`/api/admin/blogs/${id}/approve`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-blog-analytics"] });
    },
  });

  const featureMutation = useMutation({
    mutationFn: (id: string) => apiMutation(`/api/admin/blogs/${id}/feature`, "POST"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-blogs"] }),
  });

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => apiMutation(`/api/admin/blogs/${id}/unpublish`, "POST"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-blogs"] }),
  });

  const blogs = blogsQuery.data?.items ?? [];
  const analytics = analyticsQuery.data;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-4xl font-semibold text-text-primary">Blog management</h1>
        <p className="text-text-primary/65">Review, moderate, and feature community stories.</p>
      </header>

      {analyticsQuery.isLoading ? (
        <StatCardsSkeleton count={4} />
      ) : analytics ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Total blogs", value: analytics.totalBlogs },
            { label: "Published", value: analytics.publishedBlogs },
            { label: "Pending review", value: analytics.pendingReview },
            { label: "Total views", value: analytics.totalViews },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              className="rounded-calm border border-[#ebe5de] bg-white p-5 shadow-soft"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-primary/45">
                {stat.label}
              </p>
              <p className="mt-2 text-3xl font-semibold text-text-primary">{stat.value}</p>
            </motion.div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search blogs..."
          className="rounded-gentle border border-[#ded7ce] px-4 py-2 text-sm"
        />
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setStatus(option)}
            className={`rounded-full px-4 py-2 text-xs font-semibold ${
              status === option ? "bg-text-secondary text-white" : "bg-white text-text-primary/60"
            }`}
          >
            {option.replace("_", " ")}
          </button>
        ))}
        <Link href="/admin/blogs/analytics" className="ml-auto text-sm font-semibold text-text-secondary">
          Analytics →
        </Link>
        <Link href="/admin/blogs/reports" className="text-sm font-semibold text-text-secondary">
          Reports →
        </Link>
        <Link href="/admin/blogs/comments" className="text-sm font-semibold text-text-secondary">
          Comments →
        </Link>
      </div>

      {blogsQuery.isLoading ? (
        <TableSkeleton rows={6} columns={5} />
      ) : (
        <div className="overflow-hidden rounded-calm border border-[#ebe5de] bg-white shadow-soft">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#ebe5de] bg-[#faf8f5] text-xs uppercase tracking-[0.16em] text-text-primary/45">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Engagement</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog) => (
                <tr key={blog.id} className="border-b border-[#f0ece6] last:border-0">
                  <td className="px-4 py-4">
                    <div className="font-semibold text-text-primary">{blog.title}</div>
                    <div className="text-xs text-text-primary/45">
                      {blog.isFeatured ? "Featured · " : ""}
                      {formatBlogDate(blog.publishedAt ?? blog.updatedAt)}
                    </div>
                  </td>
                  <td className="px-4 py-4">{blog.author.name ?? "Member"}</td>
                  <td className="px-4 py-4">{blog.status.replace("_", " ")}</td>
                  <td className="px-4 py-4 text-text-primary/60">
                    {blog.viewCount} views · {blog.likeCount} likes · {blog.commentCount} comments
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/blogs/${blog.id}`}
                        className="rounded-full border border-[#ded7ce] px-3 py-1 text-xs font-semibold"
                      >
                        View
                      </Link>
                      {blog.status === "PENDING_REVIEW" && (
                        <button
                          type="button"
                          onClick={() => approveMutation.mutate(blog.id)}
                          className="rounded-full bg-text-secondary px-3 py-1 text-xs font-semibold text-white"
                        >
                          Approve
                        </button>
                      )}
                      {blog.status === "PUBLISHED" && !blog.isFeatured && (
                        <button
                          type="button"
                          onClick={() => featureMutation.mutate(blog.id)}
                          className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-text-secondary"
                        >
                          Feature
                        </button>
                      )}
                      {blog.status === "PUBLISHED" && (
                        <button
                          type="button"
                          onClick={() => unpublishMutation.mutate(blog.id)}
                          className="rounded-full px-3 py-1 text-xs font-semibold text-red-600"
                        >
                          Unpublish
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
