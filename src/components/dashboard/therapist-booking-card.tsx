"use client";

import { useBookSessionModal } from "@/components/dashboard/book-session-modal";
import { useMemo, useState } from "react";

type TherapistBookingCardProps = {
  therapist: {
    name: string;
    role: string;
    fee: number;
    image: string;
  };
  availableTimes: readonly string[];
};

function addCalendarMonths(base: Date, delta: number) {
  return new Date(base.getFullYear(), base.getMonth() + delta, 1);
}

function getCalendarGridCells(viewMonthStart: Date): Date[] {
  const y = viewMonthStart.getFullYear();
  const m = viewMonthStart.getMonth();
  const firstOfMonth = new Date(y, m, 1);
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(y, m, 1 - mondayOffset);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push(d);
  }
  return cells;
}

function isSameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const dayHeaders = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;

export function TherapistBookingCard({
  therapist,
  availableTimes,
}: TherapistBookingCardProps) {
  const { open } = useBookSessionModal();
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date());
  const [selectedTime, setSelectedTime] = useState(availableTimes[0] ?? "09:00 AM");

  const calendarCells = useMemo(() => getCalendarGridCells(viewMonth), [viewMonth]);
  const monthTitle = useMemo(
    () =>
      viewMonth.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    [viewMonth],
  );

  return (
    <aside className="h-fit rounded-calm border border-accent/70 bg-white p-6 shadow-soft md:p-7">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-3xl font-semibold text-text-primary">Book a Session</h2>
          <p className="text-sm text-text-primary/55">Select your preferred window</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-text-primary/45">Per Session</p>
          <p className="font-display text-4xl font-semibold text-text-secondary">₹{therapist.fee}</p>
        </div>
      </div>

      <div className="mt-6 rounded-gentle border border-accent/70 bg-background/50 p-4">
        <div className="mb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setViewMonth((current) => addCalendarMonths(current, -1))}
            className="rounded-full bg-white p-2 text-text-primary/45 transition-colors hover:text-text-primary/75"
            aria-label="Previous month"
          >
            {"<"}
          </button>
          <p className="text-sm font-semibold text-text-primary">{monthTitle}</p>
          <button
            type="button"
            onClick={() => setViewMonth((current) => addCalendarMonths(current, 1))}
            className="rounded-full bg-white p-2 text-text-primary/45 transition-colors hover:text-text-primary/75"
            aria-label="Next month"
          >
            {">"}
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-text-primary/35">
          {dayHeaders.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1">
          {calendarCells.map((day) => {
            const inViewMonth =
              day.getMonth() === viewMonth.getMonth() &&
              day.getFullYear() === viewMonth.getFullYear();
            const isSelected =
              selectedDate !== null && isSameCalendarDay(day, selectedDate);
            return (
              <button
                key={`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`}
                type="button"
                onClick={() => {
                  if (!inViewMonth) {
                    setViewMonth(new Date(day.getFullYear(), day.getMonth(), 1));
                  }
                  setSelectedDate(day);
                }}
                className={`h-8 rounded-soft text-xs font-semibold transition-colors ${
                  isSelected
                    ? "bg-text-secondary text-white"
                    : inViewMonth
                      ? "bg-white text-text-primary/65 hover:bg-accent/45"
                      : "bg-transparent text-text-primary/35 hover:bg-white"
                }`}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-primary/45">Available Times</p>
        <div className="grid grid-cols-2 gap-2.5">
          {availableTimes.map((time) => (
            <button
              key={time}
              type="button"
              onClick={() => setSelectedTime(time)}
              className={`rounded-soft border px-3 py-2 text-sm font-semibold ${
                selectedTime === time
                  ? "border-text-secondary bg-primary/10 text-text-secondary"
                  : "border-accent/70 bg-white text-text-primary/70"
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          open({
            name: therapist.name,
            specialty: therapist.role,
            imageSrc: therapist.image,
          })
        }
        className="mt-7 w-full rounded-full bg-text-secondary px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-shadow duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[0_10px_28px_-8px_rgb(47_93_80/45%)]"
      >
        Start Booking
      </button>

      <p className="mt-3.5 text-center text-xs text-text-primary/45">
        {selectedDate
          ? `Selected: ${selectedDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })} at ${selectedTime}`
          : "You won't be charged yet. Free cancellation up to 24 hours before the session."}
      </p>
    </aside>
  );
}
