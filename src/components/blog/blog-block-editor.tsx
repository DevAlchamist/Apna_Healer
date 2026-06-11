"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FadeIn, hoverLiftTransition } from "@/components/ui/fade-in";
import { BlogCoverUpload } from "@/components/blog/blog-cover-upload";
import { BlogPublicContent } from "@/components/blog/blog-public-content";
import {
  BLOG_BLOCK_TYPES,
  createDefaultBlock,
  extractToc,
  type BlogBlockInput,
  type BlogBlockTypeValue,
} from "@/lib/blog-blocks";
import { apiFetch, apiMutation } from "@/lib/api-client";
import type { ApiBlogCategory, ApiBlogDetail } from "@/types/api";

const AUTOSAVE_MS = 30_000;

const BLOCK_LABELS: Record<BlogBlockTypeValue, string> = {
  HEADING: "Heading",
  PARAGRAPH: "Paragraph",
  LIST: "List",
  QUOTE: "Quote",
  CODE: "Code",
  DIVIDER: "Divider",
  HIGHLIGHT: "Highlight",
  IMAGE: "Image",
  IMAGE_GALLERY: "Gallery",
  VIDEO_EMBED: "Video",
  BANNER: "Banner",
};

type BlogBlockEditorProps = {
  blogId: string;
  initialBlog: ApiBlogDetail;
  mode?: "author" | "admin";
  previewPath?: string;
};

export function BlogBlockEditor({
  blogId,
  initialBlog,
  mode = "author",
  previewPath,
}: BlogBlockEditorProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(initialBlog.title);
  const [subtitle, setSubtitle] = useState(initialBlog.subtitle ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(initialBlog.coverImageUrl);
  const [tagInput, setTagInput] = useState("");
  const [tagNames, setTagNames] = useState(initialBlog.tags.map((t) => t.name));
  const [categoryIds, setCategoryIds] = useState(initialBlog.categories.map((c) => c.id));
  const [seoTitle, setSeoTitle] = useState(initialBlog.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initialBlog.seoDescription ?? "");
  const [blocks, setBlocks] = useState<BlogBlockInput[]>(
    initialBlog.blocks.map((b) => ({
      id: b.id,
      type: b.type,
      sortOrder: b.sortOrder,
      data: b.data,
    })),
  );
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>("Saved");
  const payloadRef = useRef<Record<string, unknown>>({});

  const categoriesQuery = useQuery({
    queryKey: ["blog-categories"],
    queryFn: () => apiFetch<ApiBlogCategory[]>("/api/public/blogs/categories"),
  });

  const saveMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => {
      const url =
        mode === "admin" ? `/api/admin/blogs/${blogId}` : `/api/blogs/${blogId}`;
      return apiMutation<ApiBlogDetail>(url, "PATCH", body);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["blog", blogId], data);
      setIsDirty(false);
      setSaveStatus("Saved");
    },
    onError: () => setSaveStatus("Save failed"),
  });

  const publishMutation = useMutation({
    mutationFn: () => apiMutation<ApiBlogDetail>(`/api/blogs/${blogId}/publish`, "POST"),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      if (data.status === "PENDING_REVIEW") {
        setSaveStatus("Submitted for review");
      } else {
        setSaveStatus("Published");
      }
    },
  });

  const buildPayload = useCallback(
    () => ({
      title,
      subtitle: subtitle || null,
      coverImageUrl,
      tagNames,
      categoryIds,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      blocks: blocks.map((block, index) => ({
        ...block,
        sortOrder: index,
      })),
    }),
    [blocks, categoryIds, coverImageUrl, seoDescription, seoTitle, subtitle, tagNames, title],
  );

  useEffect(() => {
    payloadRef.current = buildPayload();
  }, [buildPayload]);

  useEffect(() => {
    if (!isDirty) return;
    const timer = window.setInterval(() => {
      if (!isDirty) return;
      setSaveStatus("Saving...");
      saveMutation.mutate(payloadRef.current);
    }, AUTOSAVE_MS);
    return () => window.clearInterval(timer);
  }, [isDirty, saveMutation]);

  const toc = useMemo(() => extractToc(blocks), [blocks]);

  function markDirty() {
    setIsDirty(true);
    setSaveStatus("Unsaved changes");
  }

  function addBlock(type: BlogBlockTypeValue) {
    setBlocks((prev) => [...prev, createDefaultBlock(type, prev.length)]);
    markDirty();
  }

  function duplicateBlock(index: number) {
    setBlocks((prev) => {
      const copy = { ...prev[index], id: undefined, sortOrder: prev.length };
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next.map((b, i) => ({ ...b, sortOrder: i }));
    });
    markDirty();
  }

  function removeBlock(index: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== index).map((b, i) => ({ ...b, sortOrder: i })));
    markDirty();
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const target = index + direction;
    setBlocks((prev) => {
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((b, i) => ({ ...b, sortOrder: i }));
    });
    markDirty();
  }

  function updateBlockData(index: number, data: Record<string, unknown>) {
    setBlocks((prev) =>
      prev.map((block, i) => (i === index ? { ...block, data } : block)),
    );
    markDirty();
  }

  function handleSave() {
    setSaveStatus("Saving...");
    saveMutation.mutate(buildPayload());
  }

  function addTag() {
    const trimmed = tagInput.trim();
    if (!trimmed || tagNames.includes(trimmed)) return;
    setTagNames((prev) => [...prev, trimmed]);
    setTagInput("");
    markDirty();
  }

  return (
    <FadeIn className="space-y-8 pb-10 md:space-y-10 md:pb-12">
      <section className="rounded-calm bg-white p-5 shadow-soft md:p-7">
        <BlogCoverUpload
          value={coverImageUrl}
          onChange={(url) => {
            setCoverImageUrl(url);
            markDirty();
          }}
        />
      </section>

      <section className="space-y-5">
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            markDirty();
          }}
          placeholder="Title your reflection..."
          className="w-full bg-transparent font-display text-5xl font-semibold text-text-primary/75 placeholder:text-text-primary/25 focus:outline-none md:text-6xl"
        />
        <input
          type="text"
          value={subtitle}
          onChange={(e) => {
            setSubtitle(e.target.value);
            markDirty();
          }}
          placeholder="Subtitle (optional)"
          className="w-full bg-transparent text-xl text-text-primary/60 placeholder:text-text-primary/25 focus:outline-none"
        />

        <div className="flex flex-wrap items-center gap-2.5">
          {tagNames.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[#ece9e2] px-3 py-1 text-xs font-semibold text-text-primary/70"
            >
              {tag}
              <button
                type="button"
                className="ml-2 opacity-50 hover:opacity-100"
                onClick={() => {
                  setTagNames((prev) => prev.filter((t) => t !== tag));
                  markDirty();
                }}
              >
                ×
              </button>
            </span>
          ))}
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            placeholder="+ Add tag"
            className="rounded-full border border-dashed border-text-primary/30 px-3 py-1 text-xs font-semibold text-text-primary/50 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(categoriesQuery.data ?? []).map((category) => {
            const selected = categoryIds.includes(category.id);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  setCategoryIds((prev) =>
                    selected ? prev.filter((id) => id !== category.id) : [...prev, category.id],
                  );
                  markDirty();
                }}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  selected
                    ? "bg-text-secondary text-white"
                    : "bg-[#ece9e2] text-text-primary/60 hover:bg-primary/20"
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-4 rounded-calm border border-[#ebe5de] bg-white p-5 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-primary/45">SEO</p>
        <input
          value={seoTitle}
          onChange={(e) => {
            setSeoTitle(e.target.value);
            markDirty();
          }}
          placeholder="SEO title"
          className="w-full rounded-gentle border border-[#ded7ce] px-3 py-2 text-sm"
        />
        <textarea
          value={seoDescription}
          onChange={(e) => {
            setSeoDescription(e.target.value);
            markDirty();
          }}
          placeholder="SEO description"
          rows={2}
          className="w-full rounded-gentle border border-[#ded7ce] px-3 py-2 text-sm"
        />
      </section>

      <div className="flex flex-wrap gap-2">
        {BLOG_BLOCK_TYPES.map((type) => (
          <motion.button
            key={type}
            type="button"
            onClick={() => addBlock(type)}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-text-primary/70 shadow-soft transition-colors hover:bg-accent/45"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={hoverLiftTransition}
          >
            + {BLOCK_LABELS[type]}
          </motion.button>
        ))}
      </div>

      <div className="space-y-6">
        {blocks.map((block, index) => (
          <div
            key={block.id ?? `block-${index}`}
            className="group rounded-calm border border-[#ebe5de] bg-white p-5 shadow-soft"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-text-primary/45">
                {BLOCK_LABELS[block.type as BlogBlockTypeValue]}
              </span>
              <div className="flex flex-wrap gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                <button type="button" onClick={() => moveBlock(index, -1)} className="rounded px-2 py-1 text-xs hover:bg-accent/40">↑</button>
                <button type="button" onClick={() => moveBlock(index, 1)} className="rounded px-2 py-1 text-xs hover:bg-accent/40">↓</button>
                <button type="button" onClick={() => duplicateBlock(index)} className="rounded px-2 py-1 text-xs hover:bg-accent/40">Duplicate</button>
                <button type="button" onClick={() => removeBlock(index)} className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">Remove</button>
              </div>
            </div>
            <BlogPublicContent
              blocks={[
                {
                  id: block.id ?? `edit-${index}`,
                  type: block.type as ApiBlogDetail["blocks"][number]["type"],
                  sortOrder: index,
                  data: block.data as Record<string, unknown>,
                },
              ]}
              editable
              onBlockChange={(_, data) => updateBlockData(index, data)}
            />
          </div>
        ))}
      </div>

      <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-full border border-[#ded7ce] bg-white/95 px-5 py-3 shadow-soft backdrop-blur">
        <span className="text-sm text-text-primary/55">{saveStatus}</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full border border-[#ded7ce] px-5 py-2 text-sm font-semibold text-text-primary/70 hover:bg-accent/30"
          >
            Save draft
          </button>
          {previewPath && (
            <button
              type="button"
              onClick={() => {
                handleSave();
                router.push(previewPath);
              }}
              className="rounded-full border border-[#ded7ce] px-5 py-2 text-sm font-semibold text-text-primary/70 hover:bg-accent/30"
            >
              Preview
            </button>
          )}
          {mode === "author" && (
            <button
              type="button"
              onClick={() => {
                handleSave();
                publishMutation.mutate();
              }}
              disabled={publishMutation.isPending}
              className="rounded-full bg-text-secondary px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Publish
            </button>
          )}
        </div>
      </div>
    </FadeIn>
  );
}
