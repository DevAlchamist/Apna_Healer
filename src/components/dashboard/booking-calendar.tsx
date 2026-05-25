"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";

import { hoverLiftTransition } from "@/components/ui/fade-in";

export type CalendarAvailabilityEntry = {
  id: string;
  date: string;
  timezone: string;
  slots: Array<{ start: string; end: string; isBooked: boolean }>;
};

type BookingCalendarProps = {
  availabilities: CalendarAvailabilityEntry[];
  selectedAvailabilityId: string | null;
  onSelect: (entry: CalendarAvailabilityEntry) => void;
  initialMonth?: Date;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function dateKey(value: Date): string {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, count: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

function startOfDay(value: Date): Date {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function buildAvailabilityIndex(entries: CalendarAvailabilityEntry[]) {
  const index = new Map<
    string,
    { entry: CalendarAvailabilityEntry; openCount: number }
  >();

  for (const entry of entries) {
    const localDate = new Date(entry.date);
    const key = dateKey(localDate);
    const openCount = entry.slots.filter((slot) => !slot.isBooked).length;
    index.set(key, { entry, openCount });
  }

  return index;
}

function buildMonthMatrix(month: Date): Date[] {
  const start = startOfMonth(month);
  const firstWeekday = start.getDay();
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - firstWeekday);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
}

export function BookingCalendar({
  availabilities,
  selectedAvailabilityId,
  onSelect,
  initialMonth,
}: BookingCalendarProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const availabilityIndex = useMemo(
    () => buildAvailabilityIndex(availabilities),
    [availabilities],
  );

  const earliestAvailableDate = useMemo(() => {
    const first = availabilities
      .map((entry) => new Date(entry.date))
      .sort((a, b) => a.getTime() - b.getTime())[0];
    return first ?? today;
  }, [availabilities, today]);

  const [visibleMonth, setVisibleMonth] = useState<Date>(() =>
    startOfMonth(initialMonth ?? earliestAvailableDate),
  );

  const monthMatrix = useMemo(() => buildMonthMatrix(visibleMonth), [visibleMonth]);

  const selectedKey = useMemo(() => {
    if (!selectedAvailabilityId) return null;
    const match = availabilities.find((entry) => entry.id === selectedAvailabilityId);
    return match ? dateKey(new Date(match.date)) : null;
  }, [availabilities, selectedAvailabilityId]);

  const isCurrentMonth = (day: Date) =>
    day.getMonth() === visibleMonth.getMonth() &&
    day.getFullYear() === visibleMonth.getFullYear();

  return (
    <div className="rounded-gentle border border-accent/70 bg-white p-4 shadow-soft md:p-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
          className="rounded-full p-2 text-text-primary/55 transition-colors hover:bg-accent/40 hover:text-text-primary"
          aria-label="Previous month"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="font-display text-base font-semibold text-text-primary md:text-lg">
          {MONTH_NAMES[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
        </p>
        <button
          type="button"
          onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
          className="rounded-full p-2 text-text-primary/55 transition-colors hover:bg-accent/40 hover:text-text-primary"
          aria-label="Next month"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-text-primary/45">
        {WEEKDAYS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {monthMatrix.map((day) => {
          const key = dateKey(day);
          const inMonth = isCurrentMonth(day);
          const past = day.getTime() < today.getTime();
          const entry = availabilityIndex.get(key);
          const hasOpen = !!entry && entry.openCount > 0;
          const allBooked = !!entry && entry.openCount === 0;
          const selectable = inMonth && !past && hasOpen;
          const selected = selectedKey === key;
          const isToday = day.getTime() === today.getTime();

          let background = "bg-transparent";
          let textTone = "text-text-primary/35";

          if (selected) {
            background = "bg-text-secondary text-white shadow-soft";
            textTone = "text-white";
          } else if (selectable) {
            background = "bg-white hover:bg-primary/10";
            textTone = "text-text-primary";
          } else if (allBooked && inMonth) {
            background = "bg-[#f4f3f1]";
            textTone = "text-text-primary/40 line-through";
          } else if (inMonth) {
            textTone = "text-text-primary/55";
          }

          return (
            <motion.button
              key={key}
              type="button"
              disabled={!selectable}
              onClick={() => entry && selectable && onSelect(entry.entry)}
              whileHover={selectable ? { y: -2 } : undefined}
              whileTap={selectable ? { scale: 0.96 } : undefined}
              transition={hoverLiftTransition}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-gentle border text-sm font-semibold transition-colors duration-200 ${
                selected
                  ? "border-transparent"
                  : selectable
                    ? "border-accent/60"
                    : "border-transparent"
              } ${background} ${textTone} ${
                !selectable ? "cursor-not-allowed" : "cursor-pointer"
              }`}
              aria-pressed={selected || undefined}
              aria-label={day.toDateString()}
            >
              <span className="leading-none">{day.getDate()}</span>
              {isToday && !selected ? (
                <span className="absolute inset-1 rounded-gentle ring-1 ring-text-secondary/50" aria-hidden />
              ) : null}
              {hasOpen ? (
                <span
                  className={`absolute bottom-1.5 h-1.5 w-1.5 rounded-full ${
                    selected ? "bg-white" : "bg-[#22c997]"
                  }`}
                  aria-hidden
                />
              ) : null}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] font-medium text-text-primary/55">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22c997]" aria-hidden />
          Open slots
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-3 rounded-sm bg-[#f4f3f1]" aria-hidden />
          Fully booked
        </span>
      </div>
    </div>
  );
}
