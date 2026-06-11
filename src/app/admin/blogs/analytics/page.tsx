"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import type { ApiBlogAnalyticsOverview } from "@/types/api";
import { StatCardsSkeleton } from "@/components/skeletons";

export default function AdminBlogAnalyticsPage() {
  const analyticsQuery = useQuery({
    queryKey: ["admin-blog-analytics"],
    queryFn: () => apiFetch<ApiBlogAnalyticsOverview>("/api/admin/blogs/analytics"),
  });

  const analytics = analyticsQuery.data;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/blogs" className="text-sm text-text-primary/50 hover:text-text-secondary">
          ← Blogs
        </Link>
        <h1 className="mt-2 font-display text-4xl font-semibold text-text-primary">Blog analytics</h1>
      </div>

      {analyticsQuery.isLoading ? (
        <StatCardsSkeleton count={4} />
      ) : analytics ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Views", value: analytics.totalViews },
              { label: "Likes", value: analytics.totalLikes },
              { label: "Comments", value: analytics.totalComments },
              { label: "Published", value: analytics.publishedBlogs },
            ].map((stat) => (
              <div key={stat.label} className="rounded-calm border border-[#ebe5de] bg-white p-5 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-primary/45">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold">{stat.value}</p>
              </div>
            ))}
          </div>

          <section className="rounded-calm border border-[#ebe5de] bg-white p-6 shadow-soft">
            <h2 className="font-display text-xl font-semibold">Top posts</h2>
            <ul className="mt-4 space-y-3">
              {analytics.topPosts.map((post) => (
                <li key={post.id} className="flex justify-between text-sm">
                  <span>{post.title}</span>
                  <span className="text-text-primary/50">{post.viewCount} views</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
