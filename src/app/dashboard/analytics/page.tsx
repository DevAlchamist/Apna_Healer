"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FadeIn, hoverLiftTransition, morphTransition } from "@/components/ui/fade-in";
import { apiFetch } from "@/lib/api-client";
import type { ApiUser } from "@/types/api";
import { motion, AnimatePresence } from "framer-motion";

type TabId = "overview" | "earnings" | "reviews";

type Review = {
  id: string;
  rating: number;
  date: string;
  comment: string;
  clientName: string;
};

const MOCK_REVIEWS: Review[] = [
  { id: "r-1", rating: 5, date: "2026-07-01", comment: "Outstanding counselor! Really listened to my background stress.", clientName: "Anonymous Client" },
  { id: "r-2", rating: 5, date: "2026-06-28", comment: "Helped me construct actionable CBT habits that changed my mornings.", clientName: "Anonymous Client" },
  { id: "r-3", rating: 4, date: "2026-06-15", comment: "Friendly approach, sessions are helpful.", clientName: "Anonymous Client" },
];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const userQuery = useQuery({
    queryKey: ["user-me"],
    queryFn: () => apiFetch<ApiUser>("/api/users/me"),
  });

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
          Performance Analytics
        </h1>
        <p className="text-sm text-neutral-500">
          Track patient feedback, consult analytics, workload distributions, and earnings logs.
        </p>
      </section>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 pb-px">
        {([
          { id: "overview", label: "Overview" },
          { id: "earnings", label: "Earnings & Revenue" },
          { id: "reviews", label: "Ratings & Reviews" },
        ] as { id: TabId; label: string }[]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === tab.id
                ? "border-[#2f745f] text-[#2f745f]"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6 text-left">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              {/* Analytics Overview Grid */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Total Consultations</p>
                  <p className="mt-2 text-3xl font-bold text-[#1c2826]">112 Sessions</p>
                  <p className="mt-1 text-xs text-neutral-500">Completed all-time</p>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Average Rating</p>
                  <p className="mt-2 text-3xl font-bold text-[#2f745f]">★ 4.90</p>
                  <p className="mt-1 text-xs text-neutral-500">Based on patient feedback</p>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">caseload retention</p>
                  <p className="mt-2 text-3xl font-bold text-[#1c2826]">84.2%</p>
                  <p className="mt-1 text-xs text-neutral-500">Active returning clients</p>
                </div>
              </div>

              {/* Workload Distribution Grid */}
              <section className="bg-white border border-neutral-200 rounded-xl p-6 shadow-2xs">
                <h3 className="font-display text-lg font-bold text-[#1c2826] mb-4">Workload Distribution</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-neutral-600 mb-1">
                      <span>CBT Counseling Sessions (75%)</span>
                      <span>84 completed</span>
                    </div>
                    <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#2f745f] h-full rounded-full" style={{ width: "75%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-neutral-600 mb-1">
                      <span>Grief Support Sessions (25%)</span>
                      <span>28 completed</span>
                    </div>
                    <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#e07b57] h-full rounded-full" style={{ width: "25%" }} />
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === "earnings" && (
            <motion.div
              key="earnings"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Total Earnings</p>
                  <p className="mt-2 text-3xl font-bold text-[#1c2826]">₹1,68,000</p>
                  <p className="mt-1 text-xs text-neutral-500">Gross revenue generated</p>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Month-over-Month Growth</p>
                  <p className="mt-2 text-3xl font-bold text-green-600">+12.4%</p>
                  <p className="mt-1 text-xs text-neutral-500">Revenue change compared to last month</p>
                </div>
              </div>

              {/* Earnings Table */}
              <section className="bg-white border border-neutral-200 rounded-xl p-6 shadow-2xs">
                <h3 className="font-display text-lg font-bold text-[#1c2826] mb-4">Payout Transaction Logs</h3>
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left text-neutral-600">
                    <thead className="bg-neutral-50 text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                      <tr>
                        <th className="px-4 py-3">Payout Period</th>
                        <th className="px-4 py-3">Sessions Completed</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      <tr className="hover:bg-neutral-50 transition">
                        <td className="px-4 py-3 font-semibold text-neutral-800">June 2026</td>
                        <td className="px-4 py-3">28 Sessions</td>
                        <td className="px-4 py-3 text-green-600 font-medium">Transferred</td>
                        <td className="px-4 py-3 text-right font-bold">₹42,000</td>
                      </tr>
                      <tr className="hover:bg-neutral-50 transition">
                        <td className="px-4 py-3 font-semibold text-neutral-800">May 2026</td>
                        <td className="px-4 py-3">24 Sessions</td>
                        <td className="px-4 py-3 text-green-600 font-medium">Transferred</td>
                        <td className="px-4 py-3 text-right font-bold">₹36,000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === "reviews" && (
            <motion.div
              key="reviews"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              <section className="bg-white border border-neutral-200 rounded-xl p-6 shadow-2xs">
                <h3 className="font-display text-lg font-bold text-[#1c2826] mb-4">Patient Reviews & Testimonials</h3>
                {MOCK_REVIEWS.length > 0 ? (
                  <div className="space-y-4">
                    {MOCK_REVIEWS.map((review) => (
                      <div key={review.id} className="p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-bold text-neutral-800">{review.clientName}</span>
                          <span className="text-neutral-400">{review.date}</span>
                        </div>
                        <div className="flex text-[#ffca28] text-xs mb-2">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <span key={i}>★</span>
                          ))}
                        </div>
                        <p className="text-xs italic text-neutral-600 leading-relaxed">&ldquo;{review.comment}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500 py-6 text-center">No reviews submitted yet.</p>
                )}
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FadeIn>
  );
}
