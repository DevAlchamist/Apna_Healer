"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { BlogBlockEditor } from "@/components/blog/blog-block-editor";
import { FadeIn } from "@/components/ui/fade-in";
import { TableSkeleton } from "@/components/skeletons";
import { apiFetch } from "@/lib/api-client";
import type { ApiBlogDetail } from "@/types/api";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function EditBlogPage({ params }: PageProps) {
  const { id } = use(params);

  const blogQuery = useQuery({
    queryKey: ["blog", id],
    queryFn: () => apiFetch<ApiBlogDetail>(`/api/blogs/${id}`),
  });

  if (blogQuery.isLoading) {
    return (
      <FadeIn>
        <TableSkeleton rows={6} columns={1} />
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

  return (
    <BlogBlockEditor
      blogId={id}
      initialBlog={blogQuery.data}
      previewPath={`/dashboard/blog/${id}/preview`}
    />
  );
}
