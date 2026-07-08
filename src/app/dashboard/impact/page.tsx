"use client";

import { useQuery } from "@tanstack/react-query";
import { FadeIn, hoverLiftTransition, morphTransition } from "@/components/ui/fade-in";
import { apiFetch } from "@/lib/api-client";
import type { ApiUser } from "@/types/api";
import { motion } from "framer-motion";

type Appreciation = {
  id: string;
  comment: string;
  date: string;
};

const MOCK_APPRECIATIONS: Appreciation[] = [
  { id: "a-1", comment: "Thank you for listening when I had no one else to talk to. Your kindness helped me through a tough night.", date: "2026-07-02" },
  { id: "a-2", comment: "Felt very validated and safe during our conversation. You are doing a wonderful volunteer work.", date: "2026-06-25" },
];

export default function ImpactPage() {
  const userQuery = useQuery({
    queryKey: ["user-me"],
    queryFn: () => apiFetch<ApiUser>("/api/users/me"),
  });

  const hoursVolunteered = 42;
  const livesSupported = 12;
  const satisfactionScore = 98;
  const streak = 5;

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
          My Listener Impact
        </h1>
        <p className="text-sm text-neutral-500">
          Track volunteer shifts, check peer appreciation feedback, and visualize your community milestones.
        </p>
      </section>

      {/* Impact stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 text-left shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Total Lives Supported</p>
          <p className="mt-2 text-3xl font-bold text-[#2f745f]">{livesSupported} Peers</p>
          <p className="mt-1 text-xs text-neutral-500">Conversations matched</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 text-left shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Hours Contributed</p>
          <p className="mt-2 text-3xl font-bold text-neutral-800">{hoursVolunteered} Hours</p>
          <p className="mt-1 text-xs text-neutral-500">Sanctuary shifts online</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 text-left shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Appreciation Rating</p>
          <p className="mt-2 text-3xl font-bold text-neutral-800">{satisfactionScore}% Positive</p>
          <p className="mt-1 text-xs text-neutral-500">Member feedback satisfaction</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr_1fr] text-left">
        {/* Appreciation wall */}
        <section className="bg-white border border-neutral-200 rounded-xl p-6 shadow-2xs space-y-4">
          <h2 className="font-display text-lg font-bold text-[#1c2826] border-b border-neutral-100 pb-3">
            Community Appreciation Wall
          </h2>
          {MOCK_APPRECIATIONS.length > 0 ? (
            <div className="space-y-3">
              {MOCK_APPRECIATIONS.map((app) => (
                <div key={app.id} className="p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                  <p className="text-xs italic text-neutral-600 leading-relaxed">&ldquo;{app.comment}&rdquo;</p>
                  <span className="block text-[10px] font-bold text-neutral-400 mt-2 text-right">Received {app.date}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-500 py-6 text-center">No appreciation logs posted yet.</p>
          )}
        </section>

        {/* Milestones Tracker */}
        <section className="bg-[#fcfdfd] border border-neutral-200 rounded-xl p-6 shadow-2xs space-y-4">
          <h3 className="font-display text-base font-bold text-neutral-800">
            Listener Streaks & Milestones
          </h3>
          <div className="space-y-4">
            <div className="bg-white p-3 rounded-lg border border-neutral-100">
              <span className="text-[10px] font-bold uppercase text-neutral-400">Current Volunteer Streak</span>
              <p className="text-lg font-bold text-neutral-800 mt-1">{streak} Days Active 🔥</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-neutral-100">
              <span className="text-[10px] font-bold uppercase text-neutral-400">Next Milestone</span>
              <p className="text-xs text-neutral-600 mt-1">
                Reach **15 lives supported** to unlock the *Sanctuary Shield Badge*.
              </p>
              <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden mt-2">
                <div className="bg-[#2f745f] h-full rounded-full" style={{ width: "80%" }} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </FadeIn>
  );
}
