"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ApiJournalStreak } from "@/types/api";

type JournalStreakCelebrationProps = {
  streak: ApiJournalStreak;
  onDismiss: () => void;
};

export function JournalStreakCelebration({ streak, onDismiss }: JournalStreakCelebrationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-calm border border-primary/30 bg-[linear-gradient(145deg,#f4f8f4,#e8f0ea)] p-8 text-center shadow-soft"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">
        Daily reflection saved
      </p>
      <h2 className="mt-3 font-display text-4xl font-semibold text-text-primary">
        {streak.currentStreak} day{streak.currentStreak === 1 ? "" : "s"} of presence
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-text-primary/70">
        You showed up for yourself today. That consistency builds a gentler inner rhythm—one
        entry at a time.
      </p>
      {streak.longestStreak > streak.currentStreak ? (
        <p className="mt-2 text-xs text-text-primary/50">
          Personal best: {streak.longestStreak} days
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/dashboard/journal"
          className="rounded-full bg-text-secondary px-8 py-3 text-sm font-semibold text-white"
        >
          View your garden
        </Link>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full border border-accent px-6 py-3 text-sm font-semibold text-text-primary/75"
        >
          Keep writing
        </button>
      </div>
    </motion.div>
  );
}
