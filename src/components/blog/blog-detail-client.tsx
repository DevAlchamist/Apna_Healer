"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LandingFooter } from "@/components/landing/footer";
import { LandingNavbar } from "@/components/landing/navbar";
import { BlogPreviewFrame } from "@/components/blog/blog-preview-frame";
import { apiFetch, apiMutation } from "@/lib/api-client";
import type { ApiBlogDetail } from "@/types/api";

type BlogDetailClientProps = {
  slug: string;
  shareUrl: string;
};

function getSessionHash() {
  if (typeof window === "undefined") return "server";
  const key = "apna-blog-view";
  let hash = window.localStorage.getItem(key);
  if (!hash) {
    hash = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(key, hash);
  }
  return hash;
}

export function BlogDetailClient({ slug, shareUrl }: BlogDetailClientProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const blogQuery = useQuery({
    queryKey: ["public-blog", slug],
    queryFn: () => apiFetch<ApiBlogDetail>(`/api/public/blogs/${slug}`),
  });

  useEffect(() => {
    if (!blogQuery.data) return;
    void apiMutation(`/api/public/blogs/${slug}/view`, "POST", {
      sessionHash: getSessionHash(),
    });
  }, [blogQuery.data, slug]);

  const likeMutation = useMutation({
    mutationFn: () => apiMutation<{ liked: boolean; likeCount: number }>(`/api/public/blogs/${slug}/like`, "POST"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["public-blog", slug] }),
  });

  const blog = blogQuery.data;

  if (blogQuery.isLoading || !blog) {
    return (
      <div className="min-h-screen bg-[#fdfcf8]">
        <LandingNavbar />
        <main className="px-6 py-24 text-center text-[#6b7573]">Loading story...</main>
        <LandingFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfcf8]">
      <LandingNavbar />
      <main>
        <BlogPreviewFrame
          blog={blog}
          mode="public"
          shareUrl={shareUrl}
          likedByMe={blog.likedByMe}
          likeCount={blog.likeCount}
          onLike={session?.user ? () => likeMutation.mutate() : undefined}
          likePending={likeMutation.isPending}
        />
      </main>
      <LandingFooter />
    </div>
  );
}
