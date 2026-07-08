"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FadeIn } from "@/components/ui/fade-in";
import { apiFetch, apiMutation } from "@/lib/api-client";

type PackageAllocation = {
  role: string;
  sessionCount: number;
};

type Package = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  coverImage: string;
  galleryImages: string[];
  bannerImage?: string | null;
  price: string;
  discount: number;
  category: string;
  displayOrder: number;
  isFeatured: boolean;
  publicationStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isVisible: boolean;
  durationValue: number;
  durationUnit: "DAY" | "WEEK" | "MONTH" | "YEAR";
  startDate?: string | null;
  endDate?: string | null;
  maxPurchases?: number | null;
  sections: any;
  facilitatorNote?: string | null;
  allocations: PackageAllocation[];
};

export default function EditPackagePage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data: pkg, isLoading } = useQuery<Package>({
    queryKey: ["admin-package", id],
    queryFn: () => apiFetch<Package>(`/api/packages/${id}`),
    enabled: Boolean(id)
  });

  // Form states
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [galleryRaw, setGalleryRaw] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [category, setCategory] = useState("");
  const [displayOrder, setDisplayOrder] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [publicationStatus, setPublicationStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">("DRAFT");
  
  const [durationValue, setDurationValue] = useState("");
  const [durationUnit, setDurationUnit] = useState<"DAY" | "WEEK" | "MONTH" | "YEAR">("MONTH");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxPurchases, setMaxPurchases] = useState("");

  const [therapistCount, setTherapistCount] = useState("0");
  const [listenerCount, setListenerCount] = useState("0");

  const [overviewText, setOverviewText] = useState("");
  const [includesRaw, setIncludesRaw] = useState("");
  const [idealForRaw, setIdealForRaw] = useState("");
  const [facilitatorNote, setFacilitatorNote] = useState("");

  useEffect(() => {
    if (pkg) {
      setTitle(pkg.title);
      setSubtitle(pkg.subtitle);
      setDescription(pkg.description);
      setCoverImage(pkg.coverImage);
      setGalleryRaw(pkg.galleryImages?.join(", ") ?? "");
      setBannerImage(pkg.bannerImage ?? "");
      setPrice(pkg.price);
      setDiscount(String(pkg.discount));
      setCategory(pkg.category);
      setDisplayOrder(String(pkg.displayOrder));
      setIsFeatured(pkg.isFeatured);
      setIsVisible(pkg.isVisible);
      setPublicationStatus(pkg.publicationStatus);
      
      setDurationValue(String(pkg.durationValue));
      setDurationUnit(pkg.durationUnit);
      setStartDate(pkg.startDate ? new Date(pkg.startDate).toISOString().slice(0, 16) : "");
      setEndDate(pkg.endDate ? new Date(pkg.endDate).toISOString().slice(0, 16) : "");
      setMaxPurchases(pkg.maxPurchases ? String(pkg.maxPurchases) : "");

      const therapist = pkg.allocations.find(a => a.role === "THERAPIST")?.sessionCount ?? 0;
      const listener = pkg.allocations.find(a => a.role === "LISTENER")?.sessionCount ?? 0;
      setTherapistCount(String(therapist));
      setListenerCount(String(listener));

      // Parse JSON sections
      const sections = Array.isArray(pkg.sections) ? pkg.sections : [];
      const ovSection = sections.find(s => s.id === "overview");
      const incSection = sections.find(s => s.id === "includes");
      const idealSection = sections.find(s => s.id === "ideal-for");

      setOverviewText(ovSection?.text ?? "");
      setIncludesRaw(incSection?.content?.join("\n") ?? "");
      setIdealForRaw(idealSection?.content?.join("\n") ?? "");
      setFacilitatorNote(pkg.facilitatorNote ?? "");
    }
  }, [pkg]);

  const updateMutation = useMutation({
    mutationFn: (payload: any) => apiMutation(`/api/packages/${id}`, "PATCH", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-packages"] });
      queryClient.invalidateQueries({ queryKey: ["admin-package", id] });
      alert("Package updated successfully!");
      router.push("/admin/packages");
    },
    onError: (err: any) => {
      alert(err.message || "Failed to update package.");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !subtitle || !description || !category || !price) {
      alert("Please fill in all required fields.");
      return;
    }

    const galleryImages = galleryRaw.split(",").map(url => url.trim()).filter(Boolean);
    const allocations = [];
    if (Number(therapistCount) > 0) {
      allocations.push({ role: "THERAPIST", sessionCount: Number(therapistCount) });
    }
    if (Number(listenerCount) > 0) {
      allocations.push({ role: "LISTENER", sessionCount: Number(listenerCount) });
    }

    // Assemble sections Json
    const sections = [];
    if (overviewText.trim()) {
      sections.push({ id: "overview", title: "Overview", text: overviewText.trim() });
    }
    if (includesRaw.trim()) {
      sections.push({
        id: "includes",
        title: "What's Included",
        content: includesRaw.split("\n").map(item => item.trim()).filter(Boolean)
      });
    }
    if (idealForRaw.trim()) {
      sections.push({
        id: "ideal-for",
        title: "Best For",
        content: idealForRaw.split("\n").map(item => item.trim()).filter(Boolean)
      });
    }

    const payload = {
      title,
      subtitle,
      description,
      coverImage,
      galleryImages,
      bannerImage: bannerImage.trim() || null,
      price: Number(price),
      discount: Number(discount),
      category,
      displayOrder: Number(displayOrder),
      isFeatured,
      publicationStatus,
      isVisible,
      durationValue: Number(durationValue),
      durationUnit,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      endDate: endDate ? new Date(endDate).toISOString() : null,
      maxPurchases: maxPurchases ? Number(maxPurchases) : null,
      sections,
      facilitatorNote: facilitatorNote.trim() || null,
      allocations
    };

    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2f745f] border-t-transparent" />
      </div>
    );
  }

  return (
    <FadeIn className="max-w-4xl mx-auto space-y-6 text-left pb-12">
      {/* Back to catalog */}
      <div>
        <Link href="/admin/packages" className="text-xs font-bold text-[#2f745f] hover:underline">
          ← Back to Catalog
        </Link>
      </div>

      <section className="space-y-1">
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#1c2826]">
          Edit Wellness Package
        </h1>
        <p className="text-xs text-neutral-500">Configure details, session quantities, duration schedules, and benefits details.</p>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-neutral-200 rounded-xl p-6 shadow-2xs text-xs text-neutral-700">
        
        {/* Basic Details */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold border-b pb-2 text-[#2f745f] uppercase tracking-wider">Basic Details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="font-semibold">Package Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#2f745f]"
                placeholder="e.g. Deep Healing Journey"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold">Subtitle *</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full rounded border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#2f745f]"
                placeholder="e.g. An intensive path for trauma recovery"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="font-semibold">Catalog Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-24 rounded border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#2f745f]"
              placeholder="Short teaser description to be displayed on package cards..."
            />
          </div>
        </section>

        {/* Pricing, Marketing & Limits */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold border-b pb-2 text-[#2f745f] uppercase tracking-wider">Pricing & Limits</h3>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1">
              <label className="font-semibold">Price (INR) *</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#2f745f]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold">Discount (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full rounded border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#2f745f]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#2f745f]"
                placeholder="e.g. Foundational"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold">Display Order</label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="w-full rounded border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#2f745f]"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="font-semibold">Start Date (Optional)</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#2f745f]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold">End Date (Optional)</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#2f745f]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold">Max Purchase Limit (Optional)</label>
              <input
                type="number"
                value={maxPurchases}
                onChange={(e) => setMaxPurchases(e.target.value)}
                className="w-full rounded border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#2f745f]"
                placeholder="Unlimited"
              />
            </div>
          </div>
        </section>

        {/* Media URLs */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold border-b pb-2 text-[#2f745f] uppercase tracking-wider">Media Files</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="font-semibold">Cover Image URL *</label>
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="w-full rounded border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#2f745f]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold">Banner Image URL (Optional)</label>
              <input
                type="url"
                value={bannerImage}
                onChange={(e) => setBannerImage(e.target.value)}
                className="w-full rounded border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#2f745f]"
                placeholder="Marketing slider banner URL"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold">Gallery Images URLs (Optional, comma-separated)</label>
              <input
                type="text"
                value={galleryRaw}
                onChange={(e) => setGalleryRaw(e.target.value)}
                className="w-full rounded border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#2f745f]"
                placeholder="e.g. url1, url2, url3"
              />
            </div>
          </div>
        </section>

        {/* Duration Configuration & Session Allocations */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold border-b pb-2 text-[#2f745f] uppercase tracking-wider">Allocations & Expirations</h3>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1">
              <label className="font-semibold">Duration Value</label>
              <input
                type="number"
                value={durationValue}
                onChange={(e) => setDurationValue(e.target.value)}
                className="w-full rounded border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#2f745f]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold">Duration Unit</label>
              <select
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value as any)}
                className="w-full rounded border border-neutral-200 px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#2f745f]"
              >
                <option value="DAY">Day(s)</option>
                <option value="WEEK">Week(s)</option>
                <option value="MONTH">Month(s)</option>
                <option value="YEAR">Year(s)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold">Therapist Sessions</label>
              <input
                type="number"
                value={therapistCount}
                onChange={(e) => setTherapistCount(e.target.value)}
                className="w-full rounded border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#2f745f]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold">Listener Sessions</label>
              <input
                type="number"
                value={listenerCount}
                onChange={(e) => setListenerCount(e.target.value)}
                className="w-full rounded border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#2f745f]"
              />
            </div>
          </div>
        </section>

        {/* Dynamic Sections Content */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold border-b pb-2 text-[#2f745f] uppercase tracking-wider">Dynamic Section Content</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="font-semibold">Overview Description</label>
              <textarea
                value={overviewText}
                onChange={(e) => setOverviewText(e.target.value)}
                className="w-full h-24 rounded border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#2f745f]"
                placeholder="Overview section text summary..."
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold">What&apos;s Included (One bullet point per line)</label>
              <textarea
                value={includesRaw}
                onChange={(e) => setIncludesRaw(e.target.value)}
                className="w-full h-24 rounded border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#2f745f]"
                placeholder="e.g.&#10;2 somatic therapy sessions&#10;Daily relaxation checklist"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold">Best For / Ideal For (One bullet point per line)</label>
              <textarea
                value={idealForRaw}
                onChange={(e) => setIdealForRaw(e.target.value)}
                className="w-full h-24 rounded border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#2f745f]"
                placeholder="e.g.&#10;Chronic stress&#10;Building focus"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold">Facilitator Note</label>
              <textarea
                value={facilitatorNote}
                onChange={(e) => setFacilitatorNote(e.target.value)}
                className="w-full h-20 rounded border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#2f745f]"
                placeholder="Facilitator advice..."
              />
            </div>
          </div>
        </section>

        {/* Visibility Options */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold border-b pb-2 text-[#2f745f] uppercase tracking-wider">Publication Controls</h3>
          <div className="flex flex-wrap gap-6 items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 accent-[#2f745f]"
              />
              <span className="font-semibold">Mark as Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
                className="h-4 w-4 accent-[#2f745f]"
              />
              <span className="font-semibold">Visible to Users</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Publication Status:</span>
              <select
                value={publicationStatus}
                onChange={(e) => setPublicationStatus(e.target.value as any)}
                className="rounded border border-neutral-200 px-3 py-1 bg-white focus:outline-none"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>
        </section>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-neutral-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/packages")}
            className="rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold px-5 py-2.5 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="rounded-lg bg-[#2f745f] hover:bg-[#204e40] text-white font-bold px-6 py-2.5 transition shadow-sm"
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </FadeIn>
  );
}
