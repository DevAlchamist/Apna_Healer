"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { morphTransition } from "@/components/ui/fade-in";

type Range = "week" | "month";

const WEEK_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
/** Demo values (0–100) — replace with mood check-in API when available. */
const WEEK_MOOD_VALUES = [48, 38, 58, 92, 55, 45, 32];
const MONTH_AGGREGATE_VALUES = [52, 61, 48, 70];
const MONTH_LABELS = ["W1", "W2", "W3", "W4"] as const;

export function WeeklyMoodTrend() {
  const [range, setRange] = useState<Range>("week");

  const { labels, values } = useMemo(() => {
    if (range === "week") {
      return { labels: [...WEEK_LABELS], values: WEEK_MOOD_VALUES };
    }
    return { labels: [...MONTH_LABELS], values: MONTH_AGGREGATE_VALUES };
  }, [range]);

  const max = Math.max(...values, 1);

  return (
    <section className="rounded-calm border border-accent/80 bg-[#faf8f4] p-6 shadow-soft transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-soft-hover md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-3xl font-semibold text-text-primary">Weekly Mood Trend</h2>
        <div
          className="flex shrink-0 items-center gap-0.5 rounded-full bg-white/90 p-1 shadow-sm ring-1 ring-accent/70"
          role="tablist"
          aria-label="Chart range"
        >
          <button
            type="button"
            role="tab"
            aria-selected={range === "week"}
            onClick={() => setRange("week")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              range === "week"
                ? "bg-white text-[#045b4f] shadow-sm ring-1 ring-[#045b4f]/20"
                : "text-text-primary/50 hover:text-text-primary/75"
            }`}
          >
            Week
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={range === "month"}
            onClick={() => setRange("month")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              range === "month"
                ? "bg-white text-[#045b4f] shadow-sm ring-1 ring-[#045b4f]/20"
                : "text-text-primary/50 hover:text-text-primary/75"
            }`}
          >
            Month
          </button>
        </div>
      </div>

      <div className="mx-auto mt-8 flex h-52 max-w-4xl items-stretch gap-1.5 sm:h-56 sm:gap-2 md:gap-3">
        {values.map((value, index) => {
          const label = labels[index] ?? "";
          const heightPct = (value / max) * 100;
          const intensity = value / 100;

          return (
            <div
              key={`${range}-${label}`}
              className="flex min-w-0 flex-1 flex-col items-stretch justify-end"
            >
              <div className="relative mx-auto w-full max-w-[3.25rem] flex-1 min-h-[7rem] sm:max-w-[4rem] sm:min-h-[8rem]">
                <motion.div
                  className="absolute bottom-0 left-0 right-0 rounded-t-xl bg-[#045b4f]"
                  initial={false}
                  animate={{
                    height: `${Math.max(heightPct, 10)}%`,
                    opacity: 0.28 + intensity * 0.72,
                  }}
                  transition={morphTransition}
                />
              </div>
              <p className="pt-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-text-primary/45">
                {label}
              </p>
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-xs leading-relaxed text-text-primary/50">
        Sample trend for the selected range. When you log daily moods, this chart will reflect your
        own data.
      </p>
    </section>
  );
}
