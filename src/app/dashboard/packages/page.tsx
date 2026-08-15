"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ContentGridSkeleton } from "@/components/skeletons";
import { FadeIn } from "@/components/ui/fade-in";
import { useBookSessionModal } from "@/components/dashboard/book-session-modal";
import { apiFetch, apiMutation } from "@/lib/api-client";
import { formatCurrency } from "@/lib/display";
import type { ApiBooking, ApiCareSession, ApiUser } from "@/types/api";
import { motion, AnimatePresence } from "framer-motion";

type PackageAllocation = {
  role: string;
  sessionCount: number;
};

type DbPackage = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  coverImage: string;
  galleryImages: string[];
  bannerImage?: string | null;
  price: string | number;
  discount: number;
  category: string;
  displayOrder: number;
  isFeatured: boolean;
  publicationStatus: string;
  isVisible: boolean;
  durationValue: number;
  durationUnit: string;
  startDate?: string | null;
  endDate?: string | null;
  maxPurchases?: number | null;
  purchaseCount: number;
  allocations: PackageAllocation[];
  providerId?: string | null;
};

export default function PackagesPage() {
  const queryClient = useQueryClient();
  const { open: openBookSession } = useBookSessionModal();

  // State for package editor form
  const [isEditing, setIsEditing] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editPurchase, setEditPurchase] = useState<any | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [price, setPrice] = useState(2500);
  const [discount, setDiscount] = useState(0);
  const [sessionCount, setSessionCount] = useState(5);
  const [durationValue, setDurationValue] = useState(3);
  const [durationUnit, setDurationUnit] = useState<"DAY" | "WEEK" | "MONTH" | "YEAR">("MONTH");
  const [publicationStatus, setPublicationStatus] = useState<"PUBLISHED" | "DRAFT">("PUBLISHED");
  const [isVisible, setIsVisible] = useState(true);

  const userQuery = useQuery({
    queryKey: ["user-me"],
    queryFn: () => apiFetch<ApiUser>("/api/users/me"),
  });

  const user = userQuery.data;
  const isTherapist = user?.role === "THERAPIST";

  const packagesQuery = useQuery({
    queryKey: ["packages-list", user?.id, user?.role],
    queryFn: () => {
      const url = isTherapist
        ? `/api/packages?providerId=${user?.id}`
        : "/api/packages";
      return apiFetch<DbPackage[]>(url);
    },
    enabled: !!user,
  });

  const selectedPackage = useMemo(() => {
    const list = packagesQuery.data ?? [];
    return list.find((p) => p.id === selectedId) || null;
  }, [packagesQuery.data, selectedId]);

  const purchasesQuery = useQuery({
    queryKey: ["admin-package-purchases", selectedId],
    queryFn: () => apiFetch<any[]>(`/api/admin/packages/purchases?packageId=${selectedId}`),
    enabled: !!selectedId && isTherapist,
  });

  const updatePurchaseMutation = useMutation({
    mutationFn: (payload: any) => apiMutation(`/api/admin/packages/purchases`, "PATCH", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-package-purchases", selectedId] });
      setEditPurchase(null);
    }
  });

  const bookingScope = useMemo(() => {
    if (user?.role === "THERAPIST" || user?.role === "LISTENER") {
      return "provider";
    }
    return "requester";
  }, [user?.role]);

  const sessionScope = useMemo(() => {
    if (user?.role === "THERAPIST" || user?.role === "LISTENER") {
      return "provider";
    }
    return "participant";
  }, [user?.role]);

  const bookingsQuery = useQuery({
    queryKey: ["packages-bookings", bookingScope],
    enabled: Boolean(user),
    queryFn: () => apiFetch<ApiBooking[]>(`/api/bookings?scope=${bookingScope}&take=12`),
  });

  const sessionsQuery = useQuery({
    queryKey: ["packages-sessions", sessionScope],
    enabled: Boolean(user),
    queryFn: () => apiFetch<ApiCareSession[]>(`/api/sessions?scope=${sessionScope}&take=12`),
  });

  const bookings = useMemo(() => bookingsQuery.data ?? [], [bookingsQuery.data]);
  const sessions = useMemo(() => sessionsQuery.data ?? [], [sessionsQuery.data]);
  const availableBalance = Number(user?.wallet?.availableBalance ?? 0);
  const completedSessions = sessions.filter((session) => session.status === "COMPLETED").length;
  const pendingBookings = bookings.filter((booking) => booking.status === "PENDING").length;

  // Mutator for creating/updating package
  const savePackageMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        subtitle,
        description,
        coverImage: coverImage.trim() || "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600",
        price,
        discount,
        category: "Therapy",
        publicationStatus,
        isVisible,
        durationValue,
        durationUnit,
        allocations: [
          {
            role: "THERAPIST",
            sessionCount,
          },
        ],
      };

      if (editingPackageId) {
        return apiMutation(`/api/packages/${editingPackageId}`, "PATCH", payload);
      } else {
        return apiMutation("/api/packages", "POST", payload);
      }
    },
    onSuccess: () => {
      packagesQuery.refetch();
      setIsEditing(false);
      resetForm();
    },
  });

  // Mutator for deleting package
  const deletePackageMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiMutation(`/api/packages/${id}`, "DELETE");
    },
    onSuccess: (_, id) => {
      packagesQuery.refetch();
      if (selectedId === id) setSelectedId(null);
    },
    onError: (err: any) => {
      alert(err.message || "Failed to delete package. Check if clients have already purchased it.");
    },
  });

  const resetForm = () => {
    setEditingPackageId(null);
    setTitle("");
    setSubtitle("");
    setDescription("");
    setCoverImage("");
    setPrice(2500);
    setDiscount(0);
    setSessionCount(5);
    setDurationValue(3);
    setDurationUnit("MONTH");
    setPublicationStatus("PUBLISHED");
    setIsVisible(true);
  };

  const handleEditClick = (pkg: DbPackage) => {
    setEditingPackageId(pkg.id);
    setTitle(pkg.title);
    setSubtitle(pkg.subtitle);
    setDescription(pkg.description);
    setCoverImage(pkg.coverImage);
    setPrice(Number(pkg.price));
    setDiscount(pkg.discount);
    setSessionCount(pkg.allocations.find((a) => a.role === "THERAPIST")?.sessionCount ?? 5);
    setDurationValue(pkg.durationValue);
    setDurationUnit(pkg.durationUnit as any);
    setPublicationStatus(pkg.publicationStatus as any);
    setIsVisible(pkg.isVisible);
    setIsEditing(true);
  };

  const packageCards = useMemo(() => {
    const list = packagesQuery.data ?? [];
    const packagePurchases = user?.packagePurchases ?? [];

    return list.map((entry) => {
      const originalPrice = Number(entry.price);
      const discountPercent = Number(entry.discount);
      const price = originalPrice - originalPrice * (discountPercent / 100);
      const shortfall = Math.max(price - availableBalance, 0);
      const affordability =
        availableBalance >= price
          ? "Wallet ready"
          : `Need ${formatCurrency(shortfall)} more`;

      const totalSessions = entry.allocations.reduce((sum, a) => sum + a.sessionCount, 0);

      const purchase = packagePurchases.find(
        (p: any) => p.packageId === entry.id && p.status === "ACTIVE"
      );
      const isPurchased = !!purchase;

      return {
        ...entry,
        price,
        originalPrice: discountPercent > 0 ? originalPrice : null,
        affordability,
        sessionsLabel: `${totalSessions} Session${totalSessions === 1 ? "" : "s"}`,
        badge: isPurchased ? "Activated" : (discountPercent > 0 ? `${discountPercent}% Off` : undefined),
        isPurchased,
        recommended: !isPurchased && (
          (entry.id === "mindfulness-starter-pack" && completedSessions === 0) ||
          (entry.id === "self-care-essentials" && pendingBookings > 0) ||
          (entry.id === "deep-healing-journey" && completedSessions >= 2)
        ),
      };
    });
  }, [packagesQuery.data, user?.packagePurchases, availableBalance, completedSessions, pendingBookings]);

  const queryError =
    userQuery.error?.message ??
    packagesQuery.error?.message ??
    bookingsQuery.error?.message ??
    sessionsQuery.error?.message;

  const isPageLoading =
    userQuery.isLoading ||
    packagesQuery.isLoading ||
    bookingsQuery.isLoading ||
    sessionsQuery.isLoading;

  if (isPageLoading) {
    return (
      <FadeIn className="space-y-12 pb-10 md:space-y-14 md:pb-12">
        <ContentGridSkeleton count={6} columns={3} />
      </FadeIn>
    );
  }

  // Therapist Management View
  if (isTherapist) {
    return (
      <FadeIn className="space-y-12 pb-10 md:space-y-14 md:pb-12 text-left">
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-4xl font-semibold text-text-primary sm:text-5xl">
              My Wellness Packages
            </h1>
            <p className="mt-2 text-base text-text-primary/70">
              Create custom session packages for your clients. Click a package card to view who has purchased it.
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={() => {
                resetForm();
                setIsEditing(true);
              }}
              className="rounded-full bg-text-secondary hover:bg-text-secondary/90 text-white text-sm font-semibold px-6 py-3 transition shadow-sm"
            >
              + Create Package
            </button>
          )}
        </section>

        {queryError ? (
          <p className="text-sm font-medium text-theme-status-error">{queryError}</p>
        ) : null}

        {isEditing ? (
          <section className="bg-white border border-accent/70 rounded-calm p-6 md:p-8 max-w-3xl shadow-soft">
            <h2 className="font-display text-2xl font-bold text-text-primary mb-6">
              {editingPackageId ? "Edit Custom Package" : "Create Custom Package"}
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                savePackageMutation.mutate();
              }}
              className="space-y-5"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-primary/60">Title *</span>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Anxiety Relief Bundle"
                    className="mt-2 w-full rounded-gentle border border-accent/80 bg-background/50 px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-primary/60">Subtitle *</span>
                  <input
                    type="text"
                    required
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g. 5 curated psychology sessions"
                    className="mt-2 w-full rounded-gentle border border-accent/80 bg-background/50 px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-primary/60">Description *</span>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what the package covers, the modalities used, and client expectations..."
                  className="mt-2 w-full rounded-gentle border border-accent/80 bg-background/50 px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-3">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-primary/60">Price (₹) *</span>
                  <input
                    type="number"
                    required
                    min={1}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="mt-2 w-full rounded-gentle border border-accent/80 bg-background/50 px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-primary/60">Discount (%)</span>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="mt-2 w-full rounded-gentle border border-accent/80 bg-background/50 px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-primary/60">Sessions Included *</span>
                  <input
                    type="number"
                    required
                    min={1}
                    value={sessionCount}
                    onChange={(e) => setSessionCount(Number(e.target.value))}
                    className="mt-2 w-full rounded-gentle border border-accent/80 bg-background/50 px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-primary/60">Validity Period *</span>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="number"
                      required
                      min={1}
                      value={durationValue}
                      onChange={(e) => setDurationValue(Number(e.target.value))}
                      className="w-24 rounded-gentle border border-accent/80 bg-background/50 px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <select
                      value={durationUnit}
                      onChange={(e) => setDurationUnit(e.target.value as any)}
                      className="flex-1 rounded-gentle border border-accent/80 bg-background/50 px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="DAY">Days</option>
                      <option value="WEEK">Weeks</option>
                      <option value="MONTH">Months</option>
                      <option value="YEAR">Years</option>
                    </select>
                  </div>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-primary/60">Cover Image URL</span>
                  <input
                    type="url"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="mt-2 w-full rounded-gentle border border-accent/80 bg-background/50 px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </label>
              </div>

              <div className="flex gap-6 mt-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => setIsVisible(e.target.checked)}
                    className="rounded border-accent text-text-secondary focus:ring-0"
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-primary/60">Visible to Clients</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={publicationStatus === "PUBLISHED"}
                    onChange={(e) => setPublicationStatus(e.target.checked ? "PUBLISHED" : "DRAFT")}
                    className="rounded border-accent text-text-secondary focus:ring-0"
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-primary/60">Publish Directly</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-[#ebe8e2]">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    resetForm();
                  }}
                  className="rounded-full border border-accent px-5 py-2 text-sm font-semibold text-text-primary/80 hover:bg-accent/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savePackageMutation.isPending}
                  className="rounded-full bg-text-secondary hover:bg-text-secondary/95 text-white px-6 py-2 text-sm font-semibold shadow-xs disabled:opacity-65"
                >
                  {savePackageMutation.isPending ? "Saving..." : "Save Package"}
                </button>
              </div>
            </form>
          </section>
        ) : (
          <>
            <section className="grid gap-6 md:gap-7 lg:grid-cols-3">
              {packageCards.length === 0 ? (
                <div className="col-span-3 text-center py-16 border border-dashed border-accent/80 rounded-calm bg-white space-y-4">
                  <p className="text-lg font-semibold text-text-primary/70">No wellness packages created yet.</p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="rounded-full bg-primary/20 hover:bg-primary/30 text-text-secondary text-xs font-bold px-5 py-2.5 transition"
                  >
                    Add your first custom package
                  </button>
                </div>
              ) : (
                packageCards.map((pkg) => (
                  <article
                    key={pkg.id}
                    onClick={() => setSelectedId(pkg.id === selectedId ? null : pkg.id)}
                    className={`group overflow-hidden rounded-calm bg-white shadow-soft transition-all duration-300 flex flex-col justify-between cursor-pointer border ${
                      pkg.id === selectedId
                        ? "border-[#2f745f] ring-2 ring-[#2f745f]/15"
                        : "border-accent/70 hover:border-primary/25 hover:-translate-y-0.5"
                    }`}
                  >
                    <div className="relative">
                      {pkg.coverImage && (
                        <img
                          src={pkg.coverImage}
                          alt={pkg.title}
                          className="h-44 w-full object-cover"
                        />
                      )}
                      <span className="absolute right-3 top-3 rounded-full bg-white/95 border border-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-primary/70">
                        {pkg.publicationStatus}
                      </span>
                    </div>

                    <div className="space-y-4 p-5 text-left flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-primary/45">
                          {pkg.sessionsLabel} • Validity: {pkg.durationValue} {pkg.durationUnit.toLowerCase()}
                        </p>
                        <h2 className="font-display text-xl font-bold text-text-primary mt-2">
                          {pkg.title}
                        </h2>
                        <p className="text-xs leading-relaxed text-text-primary/68 mt-1 line-clamp-3">
                          {pkg.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-accent/40 flex items-center justify-between">
                        <div>
                          {pkg.originalPrice && (
                            <p className="text-[10px] text-text-primary/40 line-through">
                              {formatCurrency(pkg.originalPrice)}
                            </p>
                          )}
                          <p className="font-display text-2xl font-bold text-text-primary">
                            {formatCurrency(pkg.price)}
                          </p>
                        </div>

                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleEditClick(pkg)}
                            className="rounded-full border border-accent px-4 py-2 text-xs font-semibold text-text-primary/80 hover:bg-accent/40"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this custom package?")) {
                                deletePackageMutation.mutate(pkg.id);
                              }
                            }}
                            className="rounded-full bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 text-xs font-semibold px-4 py-2"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </section>

            {/* Selected Package Purchases Panel for Therapists */}
            {selectedPackage && (
              <motion.section
                layout
                className="rounded-calm border border-accent/70 bg-white p-6 shadow-soft text-left"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-accent/40 pb-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-primary/50">
                      Package Purchases / Enrolled Clients
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-bold text-text-primary">
                      {selectedPackage.title}
                    </h2>
                    <p className="mt-1 text-xs text-text-primary/65">
                      List of users who purchased this package and their session allocations.
                    </p>
                  </div>
                </div>

                {purchasesQuery.isLoading ? (
                  <div className="flex h-32 items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2f745f] border-t-transparent" />
                  </div>
                ) : !purchasesQuery.data || purchasesQuery.data.length === 0 ? (
                  <p className="py-8 text-center text-sm text-text-primary/50">
                    No clients have purchased this package yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto mt-4 text-xs">
                    <table className="w-full text-left text-text-primary/80 font-medium">
                      <thead className="bg-background text-[10px] uppercase font-bold tracking-wider text-text-primary/60">
                        <tr>
                          <th className="px-4 py-3">Client</th>
                          <th className="px-4 py-3">Purchase Date</th>
                          <th className="px-4 py-3">Price Paid</th>
                          <th className="px-4 py-3">Allocations (Remaining / Total)</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-accent/30">
                        {purchasesQuery.data.map((pur: any) => (
                          <tr key={pur.id} className="hover:bg-background/40 transition">
                            <td className="px-4 py-3 text-left">
                              <p className="font-bold text-text-primary">{pur.user?.name || "Client"}</p>
                              <p className="text-[10px] text-text-primary/55 mt-0.5">{pur.user?.email}</p>
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
                                  <span className="capitalize text-[10px] bg-primary/10 text-text-secondary px-1.5 py-0.5 rounded font-semibold">
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
                                  ? "bg-green-50 text-green-700 border border-green-200"
                                  : pur.status === "COMPLETED"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : pur.status === "CANCELLED"
                                  ? "bg-red-50 text-red-700 border border-red-200"
                                  : "bg-neutral-100 text-neutral-500"
                              }`}>
                                {pur.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => setEditPurchase(pur)}
                                className="rounded-full bg-[#2f745f] hover:bg-[#204e40] text-white text-[10px] uppercase font-bold px-3 py-1.5 transition"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
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
                    className="w-full max-w-md rounded-calm border border-accent bg-white p-6 shadow-soft text-left"
                  >
                    <div className="flex items-center justify-between border-b border-accent/40 pb-4 mb-4">
                      <h3 className="font-display text-xl font-bold text-text-primary">
                        Edit Client Package Sessions
                      </h3>
                      <button
                        type="button"
                        onClick={() => setEditPurchase(null)}
                        className="text-2xl text-text-primary/55 hover:text-text-primary"
                      >
                        &times;
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
                        <p className="font-semibold text-text-primary/60">Client</p>
                        <p className="text-sm font-bold text-text-primary mt-0.5">{editPurchase.user?.name}</p>
                        <p className="text-text-primary/55">{editPurchase.user?.email}</p>
                      </div>

                      <div>
                        <label className="block font-semibold text-text-primary/65 mb-1">Status</label>
                        <select
                          name="status"
                          defaultValue={editPurchase.status}
                          className="w-full rounded-gentle border border-accent bg-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#2f745f]"
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                          <option value="EXPIRED">Expired</option>
                        </select>
                      </div>

                      <div className="space-y-3 pt-2">
                        <p className="font-semibold text-text-primary/65">Remaining Sessions</p>
                        {editPurchase.allocations.map((alloc: any) => (
                          <div key={alloc.id} className="flex items-center justify-between gap-3">
                            <span className="capitalize font-medium text-text-primary/80">
                              {alloc.role.toLowerCase()} support
                            </span>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                name={`remaining_${alloc.role}`}
                                min={0}
                                max={alloc.allocatedSessions}
                                defaultValue={alloc.remainingSessions}
                                className="w-16 rounded-gentle border border-accent bg-white px-2 py-1 text-center font-semibold text-text-primary focus:outline-none focus:ring-1 focus:ring-[#2f745f]"
                              />
                              <span className="text-text-primary/60">/ {alloc.allocatedSessions} total</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {updatePurchaseMutation.isError && (
                        <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                          {(updatePurchaseMutation.error as any)?.message || "Failed to update purchase details."}
                        </p>
                      )}

                      <div className="flex gap-3 pt-4 border-t border-accent/40">
                        <button
                          type="button"
                          disabled={updatePurchaseMutation.isPending}
                          onClick={() => setEditPurchase(null)}
                          className="flex-1 rounded-full border border-accent bg-white py-2.5 font-semibold text-text-primary/80 hover:bg-background/60 disabled:opacity-50 text-center"
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
          </>
        )}
      </FadeIn>
    );
  }

  // End User Packages Catalog View
  return (
    <FadeIn className="space-y-12 pb-10 md:space-y-14 md:pb-12 text-left">
      <section className="space-y-4 md:space-y-5">
        <h1 className="font-display text-4xl font-semibold text-text-primary sm:text-5xl">
          Wellness Packages
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-text-primary/70 md:text-lg">
          Curated therapeutic journeys designed to foster long-term growth and emotional stability.
          The catalog now reflects your live wallet readiness and recent care activity.
        </p>

        {queryError ? (
          <p className="text-sm font-medium text-theme-status-error">{queryError}</p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-gentle bg-white px-5 py-4 shadow-soft">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/40">
              Available Wallet
            </p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">
              {formatCurrency(user?.wallet?.availableBalance)}
            </p>
          </article>
          <article className="rounded-gentle bg-white px-5 py-4 shadow-soft">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/40">
              Completed Sessions
            </p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">{completedSessions}</p>
          </article>
          <article className="rounded-gentle bg-white px-5 py-4 shadow-soft">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/40">
              Pending Care Requests
            </p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">{pendingBookings}</p>
          </article>
        </div>
      </section>

      <section className="grid gap-6 md:gap-7 lg:grid-cols-3">
        {packageCards.map((entry) => (
          <article
            key={entry.id}
            className={`group overflow-hidden rounded-calm bg-white shadow-soft transition-[border-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-1 hover:shadow-soft-hover ${
              entry.isPurchased
                ? "border-2 border-[#2D5A4C] ring-2 ring-[#2D5A4C]/10"
                : "border border-accent/70 hover:border-primary/25"
            }`}
          >
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entry.coverImage}
                alt={entry.title}
                className="h-44 w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.04] md:h-48"
              />
              {entry.isPurchased ? (
                <span className="absolute right-3 top-3 rounded-full bg-[#2D5A4C] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm border border-[#2D5A4C]/35">
                  Activated
                </span>
              ) : entry.badge ? (
                <span className="absolute right-3 top-3 rounded-full bg-primary/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                  {entry.badge}
                </span>
              ) : null}
              {entry.recommended ? (
                <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-primary/70">
                  Recommended
                </span>
              ) : null}
            </div>

            <div className="space-y-4 p-5 md:space-y-5 md:p-6 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-primary/45">
                {entry.sessionsLabel}
              </p>
              <h2 className="font-display text-[2rem] font-semibold leading-tight text-text-primary">
                {entry.title}
              </h2>
              <p className="text-sm leading-relaxed text-text-primary/68">{entry.description}</p>

              <div className="rounded-gentle bg-background px-4 py-3 text-sm text-text-primary/62">
                {entry.isPurchased ? "Active Care Path" : entry.affordability}
              </div>

              <div className="flex items-end justify-between gap-3 pt-3">
                <div>
                  {entry.originalPrice ? (
                    <p className="text-xs font-semibold text-text-primary/40 line-through">
                      {formatCurrency(entry.originalPrice)}
                    </p>
                  ) : null}
                  <p className="font-display text-4xl font-semibold text-text-primary">
                    {formatCurrency(entry.price)}
                  </p>
                </div>

                <Link
                  href={`/dashboard/packages/${entry.id}`}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-[background-color,transform] duration-300 hover:-translate-y-0.5 ${
                    entry.isPurchased
                      ? "bg-[#2D5A4C] text-white hover:bg-[#204439]"
                      : "bg-[#e8ded2] text-text-primary hover:bg-[#dfd3c5]"
                  }`}
                >
                  {entry.isPurchased ? "Manage Path" : "View Bundle"}
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-calm bg-primary/10 p-6 transition-[box-shadow,transform] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-soft md:p-8 lg:p-10">
        <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center md:gap-8">
          <div>
            <h3 className="font-display text-3xl font-semibold text-text-secondary md:text-4xl">
              Need a custom plan?
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-primary/70 md:text-base">
              Use the live booking flow to connect with a provider and turn one of these bundles
              into a care path tailored to your current needs.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openBookSession({ preferredRole: "THERAPIST" })}
            className="rounded-full bg-text-secondary px-7 py-3 text-sm font-semibold text-white shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-soft-hover"
          >
            Consult with us
          </button>
        </div>
      </section>
    </FadeIn>
  );
}
