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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editPurchase, setEditPurchase] = useState<any | null>(null);

  const packagesQuery = useQuery({
    queryKey: ["admin-packages"],
    queryFn: () => apiFetch<Package[]>("/api/packages"),
  });

  const selectedPackage = useMemo(() => {
    const list = packagesQuery.data ?? [];
    return list.find((p) => p.id === selectedId) || null;
  }, [packagesQuery.data, selectedId]);

  const purchasesQuery = useQuery({
    queryKey: ["admin-package-purchases", selectedId],
    queryFn: () => apiFetch<any[]>(`/api/admin/packages/purchases?packageId=${selectedId}`),
    enabled: !!selectedId,
  });

  const updatePurchaseMutation = useMutation({
    mutationFn: (payload: any) => apiMutation(`/api/admin/packages/purchases`, "PATCH", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-package-purchases", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["admin-packages"] });
      setEditPurchase(null);
    }
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
                    <tr
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className={`hover:bg-neutral-50 transition cursor-pointer ${
                        selectedId === p.id ? "bg-[#f0f7f4]" : ""
                      }`}
                    >
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
                      <td className="px-4 py-3.5 text-right space-x-1 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
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

      {/* Selected Package Purchases Panel */}
      {selectedPackage && (
        <motion.section
          layout
          className="rounded-[20px] border border-neutral-200 bg-white p-6 shadow-soft"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-100 pb-5 text-left">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Package Bookings / Purchases
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold text-neutral-800">
                {selectedPackage.title}
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                Manage users who purchased this package, review status, and edit session allocations.
              </p>
            </div>
          </div>

          {purchasesQuery.isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2f745f] border-t-transparent" />
            </div>
          ) : !purchasesQuery.data || purchasesQuery.data.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">
              No users have purchased this package yet.
            </p>
          ) : (
            <div className="overflow-x-auto mt-4 text-xs">
              <table className="w-full text-left text-neutral-600 font-medium">
                <thead className="bg-neutral-50 text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Purchase Date</th>
                    <th className="px-4 py-3">Price Paid</th>
                    <th className="px-4 py-3">Allocations (Remaining / Total)</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {purchasesQuery.data.map((pur: any) => {
                    return (
                      <tr key={pur.id} className="hover:bg-neutral-50 transition">
                        <td className="px-4 py-3 text-left">
                          <p className="font-bold text-neutral-800">{pur.user?.name || "User"}</p>
                          <p className="text-[10px] text-neutral-400 mt-0.5">{pur.user?.email}</p>
                        </td>
                        <td className="px-4 py-3 text-left">
                          {new Date(pur.purchaseDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-left font-semibold">
                          {formatCurrency(Number(pur.pricePaid))}
                        </td>
                        <td className="px-4 py-3 text-left space-y-1">
                          {pur.allocations.map((alloc: any) => (
                            <div key={alloc.id} className="flex gap-2 items-center">
                              <span className="capitalize text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded font-semibold">
                                {alloc.role.toLowerCase()}
                              </span>
                              <span>
                                {alloc.remainingSessions} / {alloc.allocatedSessions} sessions left
                              </span>
                            </div>
                          ))}
                        </td>
                        <td className="px-4 py-3 text-left">
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            pur.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : pur.status === "COMPLETED"
                              ? "bg-blue-100 text-blue-700"
                              : pur.status === "CANCELLED"
                              ? "bg-red-100 text-red-700"
                              : "bg-neutral-100 text-neutral-500"
                          }`}>
                            {pur.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setEditPurchase(pur)}
                            className="rounded bg-[#2f745f] hover:bg-[#204e40] text-white text-[10px] uppercase font-bold px-2.5 py-1.5 transition"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.section>
      )}

      {/* Edit Purchase Modal */}
      <AnimatePresence>
        {editPurchase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-[2px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-[28px] border border-neutral-200 bg-white p-6 shadow-soft text-left"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
                <h3 className="font-display text-xl font-bold text-neutral-800">
                  Edit Package Booking
                </h3>
                <button
                  type="button"
                  onClick={() => setEditPurchase(null)}
                  className="text-2xl text-neutral-400 hover:text-neutral-600"
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.target as HTMLFormElement;
                  const status = (target.elements.namedItem("status") as HTMLSelectElement).value;
                  const allocations = editPurchase.allocations.map((a: any) => {
                    const input = target.elements.namedItem(`remaining_${a.role}`) as HTMLInputElement;
                    return {
                      role: a.role,
                      remainingSessions: Number(input.value),
                    };
                  });
                  updatePurchaseMutation.mutate({
                    id: editPurchase.id,
                    status,
                    allocations,
                  });
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <p className="font-semibold text-neutral-500">Customer</p>
                  <p className="text-sm font-bold text-neutral-800">{editPurchase.user?.name}</p>
                  <p className="text-neutral-400">{editPurchase.user?.email}</p>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-500 mb-1">Status</label>
                  <select
                    name="status"
                    defaultValue={editPurchase.status}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#2f745f]"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>

                <div className="space-y-3 pt-2">
                  <p className="font-semibold text-neutral-500">Edit Remaining Sessions</p>
                  {editPurchase.allocations.map((alloc: any) => (
                    <div key={alloc.id} className="flex items-center justify-between gap-3">
                      <span className="capitalize font-medium text-neutral-700">
                        {alloc.role.toLowerCase()} support
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          name={`remaining_${alloc.role}`}
                          min={0}
                          max={alloc.allocatedSessions}
                          defaultValue={alloc.remainingSessions}
                          className="w-16 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-center font-semibold text-neutral-800 focus:outline-none focus:ring-1 focus:ring-[#2f745f]"
                        />
                        <span className="text-neutral-400">/ {alloc.allocatedSessions} total</span>
                      </div>
                    </div>
                  ))}
                </div>

                {updatePurchaseMutation.isError && (
                  <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                    {(updatePurchaseMutation.error as any)?.message || "Failed to update purchase details."}
                  </p>
                )}

                <div className="flex gap-3 pt-4 border-t border-neutral-100">
                  <button
                    type="button"
                    disabled={updatePurchaseMutation.isPending}
                    onClick={() => setEditPurchase(null)}
                    className="flex-1 rounded-full border border-neutral-200 bg-white py-2.5 font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatePurchaseMutation.isPending}
                    className="flex-1 rounded-full bg-[#2f745f] hover:bg-[#204e40] py-2.5 font-semibold text-white disabled:opacity-50 text-center flex items-center justify-center gap-1.5"
                  >
                    {updatePurchaseMutation.isPending ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </FadeIn>
  );
}
