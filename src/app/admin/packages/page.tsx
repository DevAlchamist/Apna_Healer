"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FadeIn, hoverLiftTransition, morphTransition } from "@/components/ui/fade-in";
import { apiFetch, apiMutation } from "@/lib/api-client";
import { formatCurrency } from "@/lib/display";
import { motion, AnimatePresence } from "framer-motion";

type PackageAllocation = {
  role: string;
  sessionCount: number;
};

type Package = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  price: string;
  discount: number;
  publicationStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFeatured: boolean;
  isVisible: boolean;
  purchaseCount: number;
  durationValue: number;
  durationUnit: string;
  allocations: PackageAllocation[];
};

export default function AdminPackagesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "DRAFT" | "PUBLISHED" | "ARCHIVED">("ALL");

  const packagesQuery = useQuery({
    queryKey: ["admin-packages"],
    queryFn: () => apiFetch<Package[]>("/api/packages"),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => apiMutation(`/api/packages/${id}/duplicate`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-packages"] });
      alert("Package duplicated successfully as Draft!");
    }
  });

  const archiveMutation = useMutation({
    mutationFn: (input: { id: string; status: "PUBLISHED" | "ARCHIVED" }) =>
      apiMutation(`/api/packages/${input.id}`, "PATCH", { publicationStatus: input.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-packages"] });
      alert("Package status updated successfully!");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiMutation(`/api/packages/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-packages"] });
      alert("Package deleted successfully!");
    },
    onError: (err: any) => {
      alert(err.message || "Failed to delete package.");
    }
  });

  const filteredPackages = useMemo(() => {
    const list = packagesQuery.data ?? [];
    return list.filter((p) => {
      const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
                          p.category.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "ALL" || p.publicationStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [packagesQuery.data, search, statusFilter]);

  if (packagesQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2f745f] border-t-transparent" />
      </div>
    );
  }

  return (
    <FadeIn className="space-y-6">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-[#1c2826]">
            Manage Packages
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Create, duplicate, publish, archive, and monitor all active wellness offerings.
          </p>
        </div>
        <Link
          href="/admin/packages/create"
          className="rounded-lg bg-[#2f745f] hover:bg-[#204e40] text-white text-xs font-bold px-5 py-3 transition self-start shadow-sm"
        >
          + Create Package
        </Link>
      </section>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {["ALL", "DRAFT", "PUBLISHED", "ARCHIVED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                statusFilter === status
                  ? "bg-[#2f745f] text-white"
                  : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="relative max-w-sm w-full">
          <input
            type="text"
            placeholder="Search packages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2f745f]"
          />
        </div>
      </div>

      {/* Package Roster Table */}
      <section className="bg-white border border-neutral-200 rounded-xl p-6 text-left shadow-2xs">
        {filteredPackages.length > 0 ? (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left text-neutral-600">
              <thead className="bg-neutral-50 text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                <tr>
                  <th className="px-4 py-3">Package Title</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Sessions</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Purchases</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredPackages.map((p) => {
                  const therapistSessions = p.allocations.find(a => a.role === "THERAPIST")?.sessionCount ?? 0;
                  const listenerSessions = p.allocations.find(a => a.role === "LISTENER")?.sessionCount ?? 0;

                  return (
                    <tr key={p.id} className="hover:bg-neutral-50 transition">
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-neutral-800">{p.title}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">{p.category} {p.isFeatured && "• Featured"}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-neutral-800">
                          {formatCurrency(Number(p.price))}
                        </p>
                        {p.discount > 0 && (
                          <p className="text-[10px] text-orange-600 font-semibold">{p.discount}% off</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-neutral-700">
                          {therapistSessions} Therapist / {listenerSessions} Listener
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="capitalize">{p.durationValue} {p.durationUnit.toLowerCase()}(s)</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          p.publicationStatus === "PUBLISHED"
                            ? "bg-green-100 text-green-700"
                            : p.publicationStatus === "DRAFT"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-neutral-100 text-neutral-500"
                        }`}>
                          {p.publicationStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-neutral-800">
                        {p.purchaseCount} purchases
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1 whitespace-nowrap">
                        <Link
                          href={`/admin/packages/edit/${p.id}`}
                          className="rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] uppercase font-bold px-2 py-1.5 transition inline-block"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => duplicateMutation.mutate(p.id)}
                          className="rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] uppercase font-bold px-2 py-1.5 transition"
                        >
                          Duplicate
                        </button>
                        {p.publicationStatus === "PUBLISHED" ? (
                          <button
                            onClick={() => archiveMutation.mutate({ id: p.id, status: "ARCHIVED" })}
                            className="rounded bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] uppercase font-bold px-2 py-1.5 transition"
                          >
                            Archive
                          </button>
                        ) : p.publicationStatus === "ARCHIVED" ? (
                          <button
                            onClick={() => archiveMutation.mutate({ id: p.id, status: "PUBLISHED" })}
                            className="rounded bg-green-50 hover:bg-green-100 text-green-700 text-[10px] uppercase font-bold px-2 py-1.5 transition"
                          >
                            Restore
                          </button>
                        ) : null}
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this package?")) {
                              deleteMutation.mutate(p.id);
                            }
                          }}
                          className="rounded bg-red-50 hover:bg-red-100 text-red-600 text-[10px] uppercase font-bold px-2 py-1.5 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-neutral-400 space-y-4">
            <span className="text-4xl block">📦</span>
            <p className="text-sm font-semibold">No packages found.</p>
            <p className="text-xs">Create your first wellness package bundle or adjust your status search filters.</p>
          </div>
        )}
      </section>
    </FadeIn>
  );
}
