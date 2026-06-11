"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BlogBlockEditor } from "@/components/blog/blog-block-editor";
import { BlogPreviewFrame } from "@/components/blog/blog-preview-frame";
import { apiFetch, apiMutation } from "@/lib/api-client";
import type { ApiBlogDetail } from "@/types/api";
import { TableSkeleton } from "@/components/skeletons";

type AdminBlogDetailPageProps = {
  blogId: string;
};

export function AdminBlogDetailPage({ blogId }: AdminBlogDetailPageProps) {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"manage" | "edit">("manage");

  const blogQuery = useQuery({
    queryKey: ["admin-blog", blogId],
    queryFn: () => apiFetch<ApiBlogDetail>(`/api/admin/blogs/${blogId}`),
  });

  const rejectMutation = useMutation({
    mutationFn: () =>
      apiMutation(`/api/admin/blogs/${blogId}/reject`, "POST", {
        reason: "Needs revision before publishing.",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-blog", blogId] }),
  });

  const blog = blogQuery.data;

  if (blogQuery.isLoading || !blog) {
    return <TableSkeleton rows={8} columns={1} />;
  }

  if (view === "edit") {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setView("manage")} className="text-sm font-semibold text-text-secondary">
          ← Back to moderation
        </button>
        <BlogBlockEditor blogId={blogId} initialBlog={blog} mode="admin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/blogs" className="text-sm text-text-primary/50 hover:text-text-secondary">
            ← All blogs
          </Link>
          <h1 className="mt-2 font-display text-3xl font-semibold text-text-primary">{blog.title}</h1>
          <p className="text-sm text-text-primary/55">
            by {blog.author.name} · {blog.status.replace("_", " ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setView("edit")}
            className="rounded-full border border-[#ded7ce] px-4 py-2 text-sm font-semibold"
          >
            Edit
          </button>
          {blog.status === "PENDING_REVIEW" && (
            <>
              <button
                type="button"
                onClick={() =>
                  apiMutation(`/api/admin/blogs/${blogId}/approve`, "POST").then(() => blogQuery.refetch())
                }
                className="rounded-full bg-text-secondary px-4 py-2 text-sm font-semibold text-white"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => rejectMutation.mutate()}
                className="rounded-full px-4 py-2 text-sm font-semibold text-red-600"
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>
      <BlogPreviewFrame blog={blog} mode="preview" />
    </div>
  );
}
