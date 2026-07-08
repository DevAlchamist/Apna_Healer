"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FadeIn, hoverLiftTransition, morphTransition } from "@/components/ui/fade-in";
import { apiFetch } from "@/lib/api-client";
import { formatDateTime, sessionCounterpartyLabel, toSentenceCase } from "@/lib/display";
import type { ApiCareSession, ApiUser } from "@/types/api";
import { motion, AnimatePresence } from "framer-motion";
import { useSessionDetailsModal } from "@/components/dashboard/session-details-modal";

type SessionTab = "UPCOMING" | "PENDING" | "RESCHEDULED" | "COMPLETED" | "CANCELLED";

export default function MySessionsPage() {
  const { open: openSessionDetails } = useSessionDetailsModal();
  const [activeTab, setActiveTab] = useState<SessionTab>("UPCOMING");

  const userQuery = useQuery({
    queryKey: ["user-me"],
    queryFn: () => apiFetch<ApiUser>("/api/users/me"),
  });

  const sessionsQuery = useQuery({
    queryKey: ["my-sessions-list"],
    queryFn: () => apiFetch<ApiCareSession[]>("/api/sessions?take=100"),
    enabled: !!userQuery.data,
  });

  const user = userQuery.data;
  const sessions = sessionsQuery.data ?? [];

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (activeTab === "PENDING") {
        // Pending confirmation is represented by pending state or requests (matching with status or custom query)
        return (s.status as any) === "PENDING" || (s as any).isPendingConfirmation;
      }
      return s.status === activeTab;
    });
  }, [sessions, activeTab]);

  if (userQuery.isLoading || sessionsQuery.isLoading) {
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
          My Sessions
        </h1>
        <p className="text-sm text-neutral-500">
          Track and manage your upcoming consultations and therapy histories.
        </p>
      </section>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-px">
        {(["UPCOMING", "PENDING", "RESCHEDULED", "COMPLETED", "CANCELLED"] as SessionTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === tab
                ? "border-[#2f745f] text-[#2f745f]"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {tab.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Sessions Content */}
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {filteredSessions.length > 0 ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="grid gap-4 sm:grid-cols-2"
            >
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-xl border border-neutral-200 bg-white p-5 text-left flex flex-col justify-between hover:border-neutral-300 transition shadow-2xs"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded">
                        {toSentenceCase(session.sessionMode)} Session
                      </span>
                      <span className="text-[10px] font-semibold text-neutral-500">
                        {session.duration} mins
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-neutral-800 leading-snug">
                      Healer: {sessionCounterpartyLabel(session, user?.id)}
                    </h3>
                    <p className="text-xs font-semibold text-[#2f745f]">
                      {formatDateTime(session.startTime)}
                    </p>
                  </div>

                  <div className="mt-5 border-t border-neutral-100 pt-3 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">
                      Status: {toSentenceCase(session.status)}
                    </span>
                    <button
                      onClick={() => openSessionDetails(session)}
                      className="rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] uppercase font-bold px-3 py-1.5 transition"
                    >
                      See details
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key={`empty-${activeTab}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center space-y-4"
            >
              <span className="text-4xl block">🗓️</span>
              <p className="text-sm font-semibold text-neutral-500">
                You haven&apos;t booked any sessions yet.
              </p>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                No consultations found in the {activeTab.toLowerCase()} category. Get matched to your healer when ready.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FadeIn>
  );
}
