"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiMutation } from "@/lib/api-client";
import type { ApiBlogReport } from "@/types/api";
import { TableSkeleton } from "@/components/skeletons";

export default function AdminBlogReportsPage() {
  const queryClient = useQueryClient();
  const reportsQuery = useQuery({
    queryKey: ["admin-blog-reports"],
    queryFn: () => apiFetch<ApiBlogReport[]>("/api/admin/blogs/reports?status=OPEN"),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "REVIEWED" | "DISMISSED" }) =>
      apiMutation(`/api/admin/blogs/reports/${id}`, "PATCH", { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-blog-reports"] }),
  });

  const reports = reportsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/blogs" className="text-sm text-text-primary/50 hover:text-text-secondary">
          ← Blogs
        </Link>
        <h1 className="mt-2 font-display text-4xl font-semibold text-text-primary">Reported content</h1>
      </div>

      {reportsQuery.isLoading ? (
        <TableSkeleton rows={5} columns={4} />
      ) : (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <p className="text-text-primary/55">No open reports.</p>
          ) : (
            reports.map((report) => (
              <article key={report.id} className="rounded-calm border border-[#ebe5de] bg-white p-5 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-primary/45">
                  {report.targetType}
                </p>
                <p className="mt-2 text-sm text-text-primary">{report.reason}</p>
                <p className="mt-2 text-xs text-text-primary/50">
                  Reported by {report.reporter.name} · {report.blog?.title}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => reviewMutation.mutate({ id: report.id, status: "REVIEWED" })}
                    className="rounded-full bg-text-secondary px-3 py-1 text-xs font-semibold text-white"
                  >
                    Mark reviewed
                  </button>
                  <button
                    type="button"
                    onClick={() => reviewMutation.mutate({ id: report.id, status: "DISMISSED" })}
                    className="rounded-full border border-[#ded7ce] px-3 py-1 text-xs font-semibold"
                  >
                    Dismiss
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}
