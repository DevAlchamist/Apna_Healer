"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { FadeIn, hoverLiftTransition, morphTransition } from "@/components/ui/fade-in";
import { apiFetch } from "@/lib/api-client";
import type { ApiUser } from "@/types/api";

type LibraryItem = {
  id: string;
  title: string;
  category: string;
  duration: string;
  description: string;
  type: "pdf" | "audio" | "guide" | "template";
};

const USER_RESOURCES: LibraryItem[] = [
  { id: "u-1", title: "Overcoming Daily Overthinking Guide", category: "Mindfulness", duration: "10 min read", description: "Practical tools and thought patterns to calm cognitive fatigue.", type: "guide" },
  { id: "u-2", title: "10-Minute Deep Relaxation Audio", category: "Meditation", duration: "10 mins", description: "Soothing audio guide for quick stress reduction.", type: "audio" },
  { id: "u-3", title: "CBT Self-Care Activity Checklist", category: "CBT Tools", duration: "Downloadable PDF", description: "Weekly activities to keep check on your daily mental wellness.", type: "pdf" },
  { id: "u-4", title: "Understanding Grief & Loss Exercises", category: "Grief Support", duration: "15 min read", description: "A gentle reading guide for navigating complex emotional transitions.", type: "guide" },
];

const THERAPIST_RESOURCES: LibraryItem[] = [
  { id: "t-1", title: "CBT Thought Log Worksheet Template", category: "CBT Worksheets", duration: "Printable PDF", description: "Standard therapeutic log worksheet to assign to clients for cognitive reframing.", type: "template" },
  { id: "t-2", title: "Sleep Hygiene Tracking Guide & Log", category: "Habit Change", duration: "Patient Handout", description: "Daily sleep diary templates to track client sleep efficiency metrics.", type: "pdf" },
  { id: "t-3", title: "DBT Distress Tolerance Toolkit", category: "DBT Skills", duration: "25 min read", description: "Reference sheets for TIPP, ACCEPTS, and self-soothing skills.", type: "guide" },
  { id: "t-4", title: "Anxiety Scale Assessments Forms", category: "Clinical Tools", duration: "Form Template", description: "Standardized self-report GAD questionnaires for intake assessments.", type: "template" },
];

const LISTENER_RESOURCES: LibraryItem[] = [
  { id: "l-1", title: "Active Listening & Empathy Handbook", category: "Volunteer Basics", duration: "12 min read", description: "Core listener guidelines on paraphrasing, emotional validation, and non-judgment.", type: "guide" },
  { id: "l-2", title: "Sanctuary Volunteer Boundary Guide", category: "Safety", duration: "8 min read", description: "How to maintain appropriate emotional distance and exit crisis calls safely.", type: "guide" },
  { id: "l-3", title: "Crisis Escalation Protocols & Hotlines", category: "Crisis Support", duration: "Quick Reference PDF", description: "Immediate helpline contacts and referral steps for high-risk callers.", type: "pdf" },
  { id: "l-4", title: "Common Peer Concerns Reference Sheet", category: "Mentorship", duration: "Study Guide", description: "Brief notes on supporting relationship stress, exam pressure, and loneliness.", type: "pdf" },
];

export default function LibraryPage() {
  const userQuery = useQuery({
    queryKey: ["user-me"],
    queryFn: () => apiFetch<ApiUser>("/api/users/me"),
  });

  const role = userQuery.data?.role ?? "USER";

  const [activeTab, setActiveTab] = useState<"all" | "favorites" | "recently-viewed">("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const items = useMemo(() => {
    switch (role) {
      case "THERAPIST":
        return THERAPIST_RESOURCES;
      case "LISTENER":
        return LISTENER_RESOURCES;
      default:
        return USER_RESOURCES;
    }
  }, [role]);

  const filteredItems = useMemo(() => {
    let list = items;
    if (activeTab === "favorites") {
      list = list.filter((i) => favorites.includes(i.id));
    } else if (activeTab === "recently-viewed") {
      list = list.filter((i) => recentlyViewed.includes(i.id));
    }

    if (search.trim()) {
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(search.toLowerCase()) ||
          i.category.toLowerCase().includes(search.toLowerCase())
      );
    }
    return list;
  }, [items, activeTab, favorites, recentlyViewed, search]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
  };

  const handleItemClick = (id: string) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((item) => item !== id);
      return [id, ...filtered].slice(0, 5);
    });
  };

  if (userQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2f745f] border-t-transparent" />
      </div>
    );
  }

  return (
    <FadeIn className="space-y-6">
      {/* Header */}
      <section className="text-left space-y-2">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-[#1c2826]">
          Resource Library
        </h1>
        <p className="text-sm text-neutral-500">
          Access curated wellness exercises, templates, and guides compiled specifically for your role.
        </p>
      </section>

      {/* Tabs & Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2">
          {["all", "favorites", "recently-viewed"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                activeTab === tab
                  ? "bg-[#2f745f] text-white"
                  : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {tab.replace("-", " ")}
            </button>
          ))}
        </div>
        <div className="relative max-w-sm w-full">
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2f745f]"
          />
        </div>
      </div>

      {/* Library Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        <AnimatePresence mode="wait">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const isFav = favorites.includes(item.id);
              return (
                <motion.article
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-xl border border-neutral-200 bg-white p-5 text-left flex flex-col justify-between hover:border-[#2f745f]/20 transition shadow-2xs group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                        {item.category}
                      </span>
                      <button
                        onClick={() => toggleFavorite(item.id)}
                        className={`text-lg transition ${
                          isFav ? "text-[#e07b57]" : "text-neutral-300 hover:text-neutral-400"
                        }`}
                      >
                        ★
                      </button>
                    </div>
                    <h3 className="font-display text-lg font-bold text-neutral-800 leading-snug group-hover:text-[#2f745f] transition">
                      {item.title}
                    </h3>
                    <p className="text-xs text-neutral-500 line-clamp-2">{item.description}</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 text-[11px] font-bold text-neutral-400">
                    <span>{item.duration}</span>
                    <button
                      onClick={() => {
                        handleItemClick(item.id);
                        alert(`Opening/downloading resource: ${item.title}`);
                      }}
                      className="rounded bg-[#2f745f] hover:bg-[#204e40] text-white text-[10px] uppercase font-bold px-3 py-1.5 transition"
                    >
                      {item.type === "audio" ? "Listen" : item.type === "template" ? "Use Template" : "Download"}
                    </button>
                  </div>
                </motion.article>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-12 text-center text-neutral-500"
            >
              <span className="text-4xl">📚</span>
              <p className="mt-2 text-sm font-semibold">No library items found.</p>
              <p className="text-xs text-neutral-400 mt-1">Try resetting filters or adjusting search queries.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FadeIn>
  );
}
