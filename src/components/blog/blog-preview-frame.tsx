"use client";

import Image from "next/image";
import Link from "next/link";
import { BlogCommentsSection } from "@/components/blog/blog-comments-section";
import { BlogPublicContent } from "@/components/blog/blog-public-content";
import { BlogRelatedArticles } from "@/components/blog/blog-related-articles";
import { BlogSocialShare } from "@/components/blog/blog-social-share";
import { formatBlogDate } from "@/lib/display";
import type { ApiBlogDetail } from "@/types/api";

type BlogPreviewFrameProps = {
  blog: ApiBlogDetail;
  mode?: "preview" | "public";
  shareUrl?: string;
  likedByMe?: boolean;
  likeCount?: number;
  onLike?: () => void;
  likePending?: boolean;
};

export function BlogPreviewFrame({
  blog,
  mode = "public",
  shareUrl,
  likedByMe = false,
  likeCount,
  onLike,
  likePending = false,
}: BlogPreviewFrameProps) {
  const displayLikeCount = likeCount ?? blog.likeCount;
  const primaryCategory = blog.categories[0]?.name?.toUpperCase() ?? "REFLECTION";
  const authorLabel = blog.author.name ? `By ${blog.author.name}` : "By Apna Healer";

  return (
    <article className="bg-[#fdfcf8]">
      {mode === "preview" && (
        <div className="mx-auto max-w-3xl px-6 pt-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Preview mode — this is how your blog will appear when published.
            <Link href={`/dashboard/blog/${blog.id}/edit`} className="ml-2 font-semibold underline">
              Back to editor
            </Link>
          </div>
        </div>
      )}

      {/* Hero header */}
      <section className="relative">
        {blog.coverImageUrl ? (
          <div className="relative h-[380px] md:h-[480px]">
            <Image
              src={blog.coverImageUrl}
              alt={blog.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/10 to-[#fdfcf8]" />
          </div>
        ) : (
          <div className="h-24 bg-gradient-to-b from-[#eef1ef] to-[#fdfcf8]" />
        )}

        <header
          className={`relative z-10 mx-auto max-w-3xl px-6 text-center ${
            blog.coverImageUrl ? "-mt-28 md:-mt-32" : "pt-12"
          } pb-10`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#5a6563]">
            {primaryCategory}
          </p>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.08] tracking-[-0.02em] text-[#1f2d2a] md:text-[3.25rem]">
            {blog.title}
          </h1>
          {blog.subtitle && (
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[#5a6563]/90">{blog.subtitle}</p>
          )}
          <p className="mt-6 text-sm text-[#6b7573]">
            {authorLabel}
            <span className="mx-2 opacity-40">·</span>
            {blog.readingTimeMinutes} min read
            <span className="mx-2 opacity-40">·</span>
            {formatBlogDate(blog.publishedAt)}
          </p>
        </header>
      </section>

      <div className="mx-auto max-w-3xl px-6">
        <hr className="border-[#e8e4dc]" />
      </div>

      {/* Article body */}
      <div className="mx-auto max-w-3xl space-y-12 px-6 py-12 md:py-14">
        <BlogPublicContent blocks={blog.blocks} />

        {mode === "public" && (
          <div className="flex flex-col gap-6 border-t border-[#e8e4dc] pt-10 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onLike}
                disabled={!onLike || likePending}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                  onLike
                    ? likedByMe
                      ? "bg-[#2f745f] text-white hover:bg-[#286652]"
                      : "bg-[#2f745f] text-white hover:bg-[#286652]"
                    : "cursor-default bg-[#2f745f] text-white"
                }`}
              >
                <HeartIcon filled={likedByMe} />
                Resonate ({displayLikeCount})
              </button>
              {shareUrl && <BlogSocialShare url={shareUrl} title={blog.title} variant="pill" />}
            </div>
            {blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 md:justify-end">
                {blog.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full bg-[#ece9e2] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5a5348]"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {mode === "public" && !onLike && shareUrl && (
          <BlogSocialShare url={shareUrl} title={blog.title} />
        )}
      </div>

      {mode === "public" && (
        <div className="border-t border-[#ece8e0] bg-[#f9f8f6]">
          <div className="mx-auto max-w-3xl px-6 py-14 md:py-16">
            <BlogCommentsSection slug={blog.slug} />
          </div>
        </div>
      )}

      {mode === "public" && blog.related && blog.related.length > 0 && (
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <BlogRelatedArticles articles={blog.related} />
        </div>
      )}
    </article>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}
