"use client";

import Image from "next/image";
import Link from "next/link";
import type { ApiPublicBlogSummary } from "@/types/api";

type BlogRelatedArticlesProps = {
  articles: ApiPublicBlogSummary[];
};

export function BlogRelatedArticles({ articles }: BlogRelatedArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <section className="space-y-10 text-center">
      <h2 className="font-display text-3xl font-semibold text-[#1f2d2a] md:text-4xl">
        Continue Your Journey
      </h2>
      <div className="grid gap-8 text-left md:grid-cols-3 md:gap-6">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/blog/${article.slug}`}
            className="group block space-y-4"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] bg-[#eef1ef]">
              {article.coverImageUrl ? (
                <Image
                  src={article.coverImageUrl}
                  alt={article.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[#8a9492]">
                  No cover image
                </div>
              )}
            </div>
            <div className="space-y-2 px-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a9492]">
                {article.categories[0]?.name ?? "Blog"}
              </p>
              <h3 className="font-display text-xl font-semibold leading-snug text-[#1f2d2a] transition-colors group-hover:text-[#2f745f]">
                {article.title}
              </h3>
              <p className="text-sm leading-6 text-[#6b7573]">{article.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
