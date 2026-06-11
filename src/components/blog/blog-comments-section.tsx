"use client";

import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { UserAvatarCircle } from "@/components/dashboard/user-avatar-circle";
import { apiFetch, apiMutation } from "@/lib/api-client";
import { formatSharedAgo } from "@/lib/display";
import type { ApiBlogComment } from "@/types/api";

type BlogCommentsSectionProps = {
  slug: string;
};

export function BlogCommentsSection({ slug }: BlogCommentsSectionProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const commentsQuery = useQuery({
    queryKey: ["blog-comments", slug],
    queryFn: () => apiFetch<ApiBlogComment[]>(`/api/public/blogs/${slug}/comments`),
  });

  const createMutation = useMutation({
    mutationFn: (body: { content: string }) =>
      apiMutation<ApiBlogComment>(`/api/public/blogs/${slug}/comments`, "POST", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-comments", slug] });
      setContent("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, content: text }: { id: string; content: string }) =>
      apiMutation<ApiBlogComment>(`/api/public/blogs/${slug}/comments/${id}`, "PATCH", {
        content: text,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-comments", slug] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiMutation(`/api/public/blogs/${slug}/comments/${id}`, "DELETE"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog-comments", slug] }),
  });

  const reportMutation = useMutation({
    mutationFn: (id: string) =>
      apiMutation(`/api/public/blogs/${slug}/comments/${id}/report`, "POST", {
        reason: "Inappropriate content",
      }),
  });

  const comments = commentsQuery.data ?? [];
  const voiceLabel = comments.length === 1 ? "1 Voice" : `${comments.length} Voices`;

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-3xl font-semibold text-[#1f2d2a] md:text-4xl">Reflections</h2>
        <span className="rounded-full bg-[#ece9e2] px-3 py-1 text-xs font-semibold text-[#6b7573]">
          {voiceLabel}
        </span>
      </div>

      <div className="space-y-5">
        {comments.map((comment) => (
          <article
            key={comment.id}
            className="rounded-2xl bg-white px-6 py-5 shadow-[0_2px_20px_-8px_rgb(31_45_42/12%)]"
          >
            <div className="flex gap-4">
              <UserAvatarCircle
                name={comment.user.name}
                image={comment.user.image}
                className="h-11 w-11 shrink-0"
                fallbackClassName="bg-[#dceee6] text-sm font-semibold text-[#2f745f]"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-base font-semibold text-[#1f2d2a]">
                    {comment.user.name ?? "Member"}
                  </span>
                  <span className="text-sm text-[#8a9492]">{formatSharedAgo(comment.createdAt)}</span>
                </div>

                {editingId === comment.id ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-[#e8e4dc] bg-[#fdfcf8] px-4 py-3 text-sm text-[#3e4b4a] focus:outline-none focus:ring-2 focus:ring-[#2f745f]/20"
                    />
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          updateMutation.mutate({ id: comment.id, content: editContent })
                        }
                        className="text-sm font-semibold text-[#2f745f]"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-sm text-[#8a9492]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-[15px] leading-7 text-[#4a5553]">{comment.content}</p>
                )}

                {session?.user?.id === comment.user.id && editingId !== comment.id && (
                  <div className="mt-3 flex gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditContent(comment.content);
                      }}
                      className="text-xs font-semibold text-[#6b7573] hover:text-[#2f745f]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(comment.id)}
                      className="text-xs font-semibold text-[#6b7573] hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                )}
                {session?.user && session.user.id !== comment.user.id && (
                  <button
                    type="button"
                    onClick={() => reportMutation.mutate(comment.id)}
                    className="mt-3 text-xs text-[#a0a8a6] hover:text-[#6b7573]"
                  >
                    Report
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {session?.user ? (
        <div className="rounded-2xl bg-[#ededed] p-6 md:p-7">
          <p className="text-sm font-semibold text-[#1f2d2a]">Add your reflection</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!content.trim()) return;
              createMutation.mutate({ content: content.trim() });
            }}
            className="mt-4 space-y-4"
          >
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts in this supportive space..."
              rows={4}
              className="w-full rounded-xl border-0 bg-white px-4 py-4 text-[15px] leading-7 text-[#3e4b4a] shadow-sm placeholder:text-[#a0a8a6] focus:outline-none focus:ring-2 focus:ring-[#2f745f]/20"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-xl bg-[#3a5a40] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2f745f]"
              >
                Share Reflection
              </button>
            </div>
          </form>
        </div>
      ) : (
        <p className="text-center text-sm text-[#6b7573]">Sign in to share your reflection.</p>
      )}
    </section>
  );
}
