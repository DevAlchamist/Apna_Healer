"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { FadeIn } from "@/components/ui/fade-in";
import { apiMutation } from "@/lib/api-client";
import type { ApiBlogDetail } from "@/types/api";

export default function NewStoryPage() {
  const router = useRouter();
  const startedRef = useRef(false);

  const createMutation = useMutation({
    mutationFn: () =>
      apiMutation<ApiBlogDetail>("/api/blogs", "POST", {
        title: "Untitled story",
        blocks: [],
      }),
    onSuccess: (blog) => {
      router.replace(`/dashboard/blog/${blog.id}/edit`);
    },
  });

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    createMutation.mutate();
  }, [createMutation]);

  return (
    <FadeIn className="flex min-h-[40vh] items-center justify-center">
      <p className="text-text-primary/60">Creating your new story...</p>
    </FadeIn>
  );
}
