"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FadeIn, hoverLiftTransition, morphTransition } from "@/components/ui/fade-in";
import { apiFetch } from "@/lib/api-client";
import type { ApiUser } from "@/types/api";
import { motion, AnimatePresence } from "framer-motion";

type SupportRequest = {
  id: string;
  concern: string;
  requestedTime: string;
  languages: string[];
  userInitials: string;
  status: "PENDING" | "ACCEPTED" | "PASSED";
};

const INITIAL_REQUESTS: SupportRequest[] = [
  { id: "req-1", concern: "Exam Anxiety & Stress", requestedTime: "5 mins ago", languages: ["English", "Hindi"], userInitials: "KS", status: "PENDING" },
  { id: "req-2", concern: "Relationship breakdown / isolation", requestedTime: "12 mins ago", languages: ["English"], userInitials: "SS", status: "PENDING" },
  { id: "req-3", concern: "Social isolation and loneliness", requestedTime: "24 mins ago", languages: ["Hindi"], userInitials: "RV", status: "PENDING" },
];

export default function SupportRequestsPage() {
  const [requests, setRequests] = useState<SupportRequest[]>(INITIAL_REQUESTS);
  const userQuery = useQuery({
    queryKey: ["user-me"],
    queryFn: () => apiFetch<ApiUser>("/api/users/me"),
  });

  const pendingRequests = useMemo(() => {
    return requests.filter((r) => r.status === "PENDING");
  }, [requests]);

  const handleAction = (id: string, action: "ACCEPTED" | "PASSED") => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: action } : r))
    );
    alert(`Request ${action.toLowerCase()} successfully!`);
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
          Incoming Support Requests
        </h1>
        <p className="text-sm text-neutral-500">
          Accept matched requests from members queueing for peer-to-peer listening support.
        </p>
      </section>

      {/* Requests Queue */}
      <section className="bg-white border border-neutral-200 rounded-xl p-6 text-left shadow-2xs">
        <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-3">
          <h2 className="font-display text-lg font-bold text-neutral-800">
            Live Requests Queue
          </h2>
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
            {pendingRequests.length} active
          </span>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {pendingRequests.length > 0 ? (
              pendingRequests.map((req) => (
                <motion.article
                  key={req.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-lg border border-neutral-150 bg-[#fafafa] hover:border-neutral-200 transition"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f4ee] text-xs font-semibold text-[#2f745f]">
                      {req.userInitials}
                    </span>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-neutral-800">
                        Topic: {req.concern}
                      </p>
                      <div className="flex flex-wrap gap-2 text-[10px] text-neutral-400">
                        <span>Requested {req.requestedTime}</span>
                        <span>•</span>
                        <span>Languages: {req.languages.join(", ")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleAction(req.id, "ACCEPTED")}
                      className="rounded bg-[#2f745f] hover:bg-[#204e40] text-white text-[10px] uppercase font-bold px-4 py-2 transition shadow-3xs"
                    >
                      Accept & Chat
                    </button>
                    <button
                      onClick={() => handleAction(req.id, "PASSED")}
                      className="rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] uppercase font-bold px-4 py-2 transition"
                    >
                      Pass
                    </button>
                  </div>
                </motion.article>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 text-center space-y-4"
              >
                <span className="text-4xl block">💬</span>
                <p className="text-sm font-semibold text-neutral-500">
                  No support requests at the moment.
                </p>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  When members request anonymous peer listener matching, those requests will pop up live in this workspace list.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </FadeIn>
  );
}
