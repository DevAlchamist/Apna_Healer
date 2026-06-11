"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiMutation } from "@/lib/api-client";
import type { ApiBlogComment } from "@/types/api";
import { TableSkeleton } from "@/components/skeletons";

type AdminComment = ApiBlogComment & {
  blog?: { id: string; slug: string; title: string };
};

export default function AdminBlogCommentsPage() {
  const queryClient = useQueryClient();
  const commentsQuery = useQuery({
    queryKey: ["admin-blog-comments"],
    queryFn: () => apiFetch<AdminComment[]>("/api/admin/blogs/comments"),
  });

  const moderateMutation = useMutation({
    mutationFn: ({ commentId, status }: { commentId: string; status: "HIDDEN" | "DELETED" }) =>
      apiMutation("/api/admin/blogs/comments", "PATCH", { commentId, status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-blog-comments"] }),
  });

  const comments = commentsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/blogs" className="text-sm text-text-primary/50 hover:text-text-secondary">
          ← Blogs
        </Link>
        <h1 className="mt-2 font-display text-4xl font-semibold text-text-primary">Comment moderation</h1>
      </div>

      {commentsQuery.isLoading ? (
        <TableSkeleton rows={6} columns={3} />
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <article key={comment.id} className="rounded-calm border border-[#ebe5de] bg-white p-5 shadow-soft">
              <p className="text-sm text-text-primary">{comment.content}</p>
              <p className="mt-2 text-xs text-text-primary/50">
                {comment.user.name} on {comment.blog?.title} · {comment.status}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => moderateMutation.mutate({ commentId: comment.id, status: "HIDDEN" })}
                  className="rounded-full border border-[#ded7ce] px-3 py-1 text-xs font-semibold"
                >
                  Hide
                </button>
                <button
                  type="button"
                  onClick={() => moderateMutation.mutate({ commentId: comment.id, status: "DELETED" })}
                  className="rounded-full px-3 py-1 text-xs font-semibold text-red-600"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
