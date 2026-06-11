"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { LandingFooter } from "@/components/landing/footer";
import { LandingNavbar } from "@/components/landing/navbar";
import { apiFetch } from "@/lib/api-client";
import { formatBlogDate, formatCompactCount } from "@/lib/display";
import type { ApiBlogCategory, ApiBlogTag, ApiPublicBlogListResponse } from "@/types/api";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most popular" },
  { value: "reading_time", label: "Quick reads" },
] as const;

export default function BlogLandingPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]["value"]>("newest");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (category) params.set("category", category);
    if (tag) params.set("tag", tag);
    if (sort) params.set("sort", sort);
    params.set("take", "12");
    return params.toString();
  }, [category, search, sort, tag]);

  const blogsQuery = useQuery({
    queryKey: ["public-blogs", queryString],
    queryFn: () => apiFetch<ApiPublicBlogListResponse>(`/api/public/blogs?${queryString}`),
  });

  const categoriesQuery = useQuery({
    queryKey: ["blog-categories"],
    queryFn: () => apiFetch<ApiBlogCategory[]>("/api/public/blogs/categories"),
  });

  const tagsQuery = useQuery({
    queryKey: ["blog-tags"],
    queryFn: () => apiFetch<ApiBlogTag[]>("/api/public/blogs/tags"),
  });

  const featured = blogsQuery.data?.featured;
  const items = blogsQuery.data?.items ?? [];

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <LandingNavbar />
      <main className="mx-auto max-w-[1240px] px-6 py-10 md:px-10">
        <header className="mb-10 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2f745f]">Stories</p>
          <h1 className="font-display text-5xl font-semibold text-[#1f2d2a] md:text-6xl">The ApnaHealer Blog</h1>
          <p className="max-w-2xl text-lg text-[#3e4b4a]/80">
            Reflections, rituals, and real stories from our healing community.
          </p>
        </header>

        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group mb-12 block overflow-hidden rounded-[28px] bg-[#2f745f] text-white shadow-[0_24px_60px_-30px_rgb(47_116_95/70%)]"
          >
            <div className="grid md:grid-cols-2">
              <div className="relative min-h-[280px]">
                {featured.coverImageUrl && (
                  <Image src={featured.coverImageUrl} alt={featured.title} fill className="object-cover opacity-90" />
                )}
              </div>
              <div className="flex flex-col justify-center p-8 md:p-12">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Featured</span>
                <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">{featured.title}</h2>
                <p className="mt-4 text-white/80">{featured.excerpt}</p>
                <p className="mt-6 text-sm text-white/60">
                  {featured.readingTimeMinutes} min read · {formatCompactCount(featured.viewCount)} views
                </p>
              </div>
            </div>
          </Link>
        )}

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stories..."
            className="w-full max-w-md rounded-full border border-[#ded7ce] bg-white px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2f745f]/20"
          />
          <div className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSort(option.value)}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  sort === option.value
                    ? "bg-[#2f745f] text-white"
                    : "bg-white text-[#3e4b4a]/70 hover:bg-[#ece9e2]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              !category ? "bg-[#2f745f] text-white" : "bg-white text-[#3e4b4a]/70"
            }`}
          >
            All categories
          </button>
          {(categoriesQuery.data ?? []).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.slug)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                category === item.slug ? "bg-[#2f745f] text-white" : "bg-white text-[#3e4b4a]/70"
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {(tagsQuery.data ?? []).slice(0, 12).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTag(tag === item.slug ? "" : item.slug)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                tag === item.slug ? "bg-[#ece9e2] text-[#2f745f]" : "bg-white text-[#3e4b4a]/60"
              }`}
            >
              #{item.name}
            </button>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((blog, index) => (
            <motion.div
              key={blog.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={`/blog/${blog.slug}`}
                className="group block overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[16/10] bg-[#eef1ef]">
                  {blog.coverImageUrl && (
                    <Image
                      src={blog.coverImageUrl}
                      alt={blog.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2f745f]/70">
                    {blog.categories[0]?.name ?? "Blog"}
                  </p>
                  <h3 className="mt-2 font-display text-xl font-semibold text-[#1f2d2a] group-hover:text-[#2f745f]">
                    {blog.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-[#3e4b4a]/70">{blog.excerpt}</p>
                  <p className="mt-4 text-xs text-[#3e4b4a]/50">
                    {formatBlogDate(blog.publishedAt)} · {blog.readingTimeMinutes} min ·{" "}
                    {formatCompactCount(blog.viewCount)} views
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
