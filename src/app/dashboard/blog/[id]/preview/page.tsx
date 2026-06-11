"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { BlogPreviewFrame } from "@/components/blog/blog-preview-frame";
import { FadeIn } from "@/components/ui/fade-in";
import { TableSkeleton } from "@/components/skeletons";
import { apiFetch } from "@/lib/api-client";
import type { ApiBlogDetail } from "@/types/api";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function PreviewBlogPage({ params }: PageProps) {
  const { id } = use(params);

  const blogQuery = useQuery({
    queryKey: ["blog-preview", id],
    queryFn: () => apiFetch<ApiBlogDetail>(`/api/blogs/${id}/preview`),
  });

  if (blogQuery.isLoading) {
    return (
      <FadeIn>
        <TableSkeleton rows={8} columns={1} />
      </FadeIn>
    );
  }

  if (!blogQuery.data) {
    return (
      <FadeIn>
        <p className="text-text-primary/60">Blog not found.</p>
      </FadeIn>
    );
  }

  return <BlogPreviewFrame blog={blogQuery.data} mode="preview" />;
}
