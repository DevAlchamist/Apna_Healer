"use client";

import { easeCalm, hoverLiftTransition, morphTransition } from "@/components/ui/fade-in";
import { AnimatePresence, motion } from "framer-motion";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type BookSessionHealer = {
  name: string;
  specialty: string;
  imageSrc?: string | null;
};

const DEFAULT_HEALER: BookSessionHealer = {
  name: "Dr. Sarah Chen",
  specialty: "Cognitive Health",
  imageSrc: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=160&q=80&auto=format&fit=crop",
};

const STEPS = ["Your Mood", "Scheduling", "Checkout"] as const;

const TIME_SLOTS = [
  { label: "09:00 AM" },
  { label: "11:30 AM" },
  { label: "02:00 PM" },
  { label: "04:30 PM" },
] as const;

const DAY_HEADERS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const;

const SLOT_BG = "bg-[#F8F7F4]";
const CELL_ROUNDED = "rounded-xl";

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
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

function isDemoDisabledDay(d: Date) {
  // Matches design: Nov 9–10 unavailable (grey, no pill)
  return d.getMonth() === 10 && (d.getDate() === 9 || d.getDate() === 10);
}

function SmallClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 8.25V12l3 1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const MOODS = [
  { id: "calm", label: "Calm", emoji: "😌" },
  { id: "anxious", label: "Anxious", emoji: "😰" },
  { id: "tired", label: "Tired", emoji: "😴" },
  { id: "inspired", label: "Inspired", emoji: "✨" },
  { id: "reflective", label: "Reflective", emoji: "🤔" },
] as const;

type BookSessionModalContextValue = {
  open: (healer?: BookSessionHealer | null) => void;
  close: () => void;
};

const BookSessionModalContext = createContext<BookSessionModalContextValue | null>(null);

export function useBookSessionModal() {
  const ctx = useContext(BookSessionModalContext);
  if (!ctx) {
    throw new Error("useBookSessionModal must be used within BookSessionModalProvider");
  }
  return ctx;
}

function HealerAvatar({ healer }: { healer: BookSessionHealer }) {
  const initials = healer.name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (healer.imageSrc) {
    return (
      <img
        src={healer.imageSrc}
        alt=""
        className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white/80"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/25 text-xs font-bold text-text-secondary ring-2 ring-white/80">
      {initials}
    </div>
  );
}

function BookSessionModal({
  open,
  onClose,
  healer,
}: {
  open: boolean;
  onClose: () => void;
  healer: BookSessionHealer;
}) {
  const [step, setStep] = useState(0);
  const [moodId, setMoodId] = useState<(typeof MOODS)[number]["id"]>("calm");
  const [notes, setNotes] = useState("");
  const [viewMonth, setViewMonth] = useState(() => new Date(2023, 10, 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date(2023, 10, 3));
  const [selectedTime, setSelectedTime] = useState<(typeof TIME_SLOTS)[number]["label"]>("09:00 AM");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return;
  }, [open]);

  const isLast = step === STEPS.length - 1;

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
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 md:p-6" role="dialog" aria-modal="true" aria-labelledby="book-session-title">
          <motion.button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: easeCalm }}
            onClick={onClose}
          />

          <motion.div
            className="relative z-1 flex w-full max-w-[920px] overflow-hidden rounded-calm bg-white shadow-[0_24px_80px_-24px_rgb(43_43_43/35%)]"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.4, ease: easeCalm }}
          >
            <aside className="flex w-[min(100%,260px)] shrink-0 flex-col border-r border-accent/80 bg-[#f4f1ec] p-5 md:w-[280px] md:p-6">
              <h2 id="book-session-title" className="font-display text-xl font-semibold text-text-secondary md:text-2xl">
                Book Session
              </h2>

              <nav className="mt-8 flex flex-col gap-0" aria-label="Booking steps">
                {STEPS.map((label, i) => {
                  const active = i === step;
                  const done = i < step;
                  return (
                    <div key={label} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            active
                              ? "bg-text-secondary text-white"
                              : done
                                ? "bg-text-secondary/80 text-white"
                                : "border-2 border-text-primary/20 bg-white text-text-primary/40"
                          }`}
                        >
                          {i + 1}
                        </span>
                        {i < STEPS.length - 1 ? (
                          <span className="my-1 block h-8 w-px bg-text-primary/15" aria-hidden />
                        ) : null}
                      </div>
                      <p
                        className={`pb-6 text-sm font-semibold leading-snug ${
                          active ? "text-text-secondary" : "text-text-primary/45"
                        }`}
                      >
                        {label}
                      </p>
                    </div>
                  );
                })}
              </nav>

              <div className="mt-auto rounded-gentle bg-primary/15 p-3 md:p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">Your Healer</p>
                <div className="mt-3 flex items-center gap-3">
                  <HealerAvatar healer={healer} />
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-semibold text-text-secondary">{healer.name}</p>
                    <p className="truncate text-xs text-text-primary/60">{healer.specialty}</p>
                  </div>
                </div>
              </div>
            </aside>

            <div className="flex min-h-[min(70vh,560px)] min-w-0 flex-1 flex-col">
              <div className="relative flex-1 overflow-y-auto overscroll-contain px-5 pb-4 pt-4 md:px-8 md:pt-5">
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-4 top-4 rounded-full p-2 text-text-primary/45 transition-colors hover:bg-accent/50 hover:text-text-primary md:right-5 md:top-5"
                  aria-label="Close"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>

                {step === 0 ? (
                  <div className="pr-2 pt-2">
                    <h3 className="font-display text-3xl font-semibold text-text-primary md:text-4xl">
                      How are you feeling today?
                    </h3>
                    <p className="mt-2 max-w-xl text-sm text-text-primary/65 md:text-base">
                      Help us match your session energy with your current state of mind.
                    </p>

                    <div className="mt-8 flex flex-wrap gap-2.5">
                      {MOODS.map((m) => {
                        const selected = moodId === m.id;
                        return (
                          <motion.button
                            key={m.id}
                            type="button"
                            onClick={() => setMoodId(m.id)}
                            className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors duration-300 ${
                              selected
                                ? "bg-primary/25 text-text-secondary ring-1 ring-primary/35"
                                : "bg-[#eae8e4] text-text-primary/70 hover:bg-accent/60"
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            transition={hoverLiftTransition}
                          >
                            <span className="text-lg leading-none">{m.emoji}</span>
                            {m.label}
                          </motion.button>
                        );
                      })}
                    </div>

                    <div className="mt-10">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-primary/45">Additional Notes</p>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={5}
                        placeholder="Tell us more about your week... (Optional)"
                        className="mt-2 w-full resize-y rounded-gentle border border-accent/80 bg-[#f4f3f1] px-4 py-3 text-sm text-text-primary placeholder:text-text-primary/35 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                      />
                    </div>
                  </div>
                ) : null}

                {step === 1 ? (
                  <div className="mx-auto max-w-md pr-2 pt-2">
                    <div className="rounded-gentle border border-accent/60 bg-white px-4 pb-5 pt-4 md:px-5">
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setViewMonth((d) => addCalendarMonths(d, -1))}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-primary/40 transition-colors hover:bg-[#F8F7F4] hover:text-text-primary/70"
                          aria-label="Previous month"
                        >
                          <span className="text-lg leading-none">&lt;</span>
                        </button>
                        <p className="text-center text-sm font-bold tracking-tight text-text-primary md:text-base">
                          {monthTitle}
                        </p>
                        <button
                          type="button"
                          onClick={() => setViewMonth((d) => addCalendarMonths(d, 1))}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-primary/40 transition-colors hover:bg-[#F8F7F4] hover:text-text-primary/70"
                          aria-label="Next month"
                        >
                          <span className="text-lg leading-none">&gt;</span>
                        </button>
                      </div>

                      <div className="mt-5 grid grid-cols-7 gap-1.5 text-center">
                        {DAY_HEADERS.map((d) => (
                          <span
                            key={d}
                            className="pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#a89b8c]"
                          >
                            {d}
                          </span>
                        ))}
                      </div>

                      <div className="mt-1 grid grid-cols-7 gap-1.5">
                        {calendarCells.map((d) => {
                          const inViewMonth = d.getMonth() === viewMonth.getMonth() && d.getFullYear() === viewMonth.getFullYear();
                          const isDisabled = inViewMonth && isDemoDisabledDay(d);
                          const isSelected = selectedDate !== null && isSameCalendarDay(d, selectedDate);
                          const isLeadingTrail = !inViewMonth;

                          if (isDisabled) {
                            return (
                              <div
                                key={`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`}
                                className="flex h-9 items-center justify-center text-xs font-semibold text-text-primary/25"
                              >
                                {d.getDate()}
                              </div>
                            );
                          }

                          if (isLeadingTrail) {
                            return (
                              <button
                                key={`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`}
                                type="button"
                                onClick={() => {
                                  setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                                  setSelectedDate(d);
                                }}
                                className={`flex h-9 items-center justify-center text-xs font-semibold text-text-primary/25 transition-colors hover:text-text-primary/45 ${CELL_ROUNDED}`}
                              >
                                {d.getDate()}
                              </button>
                            );
                          }

                          return (
                            <motion.button
                              key={`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`}
                              type="button"
                              onClick={() => setSelectedDate(d)}
                              className={`flex h-9 items-center justify-center text-xs font-semibold transition-colors ${CELL_ROUNDED} ${
                                isSelected
                                  ? "bg-[#3D6351] text-white shadow-sm"
                                  : `${SLOT_BG} text-text-primary/80 hover:bg-accent/50`
                              }`}
                              whileHover={{ scale: isSelected ? 1 : 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              transition={hoverLiftTransition}
                            >
                              {d.getDate()}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-8">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a89b8c]">Available Times</p>
                      <div className="mt-3 grid grid-cols-2 gap-2.5">
                        {TIME_SLOTS.map((slot) => {
                          const active = selectedTime === slot.label;
                          return (
                            <motion.button
                              key={slot.label}
                              type="button"
                              onClick={() => setSelectedTime(slot.label)}
                              className={`flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-colors ${
                                active
                                  ? `border-2 border-[#3D6351] ${SLOT_BG} text-[#3D6351]`
                                  : `${SLOT_BG} text-text-primary/75 hover:bg-accent/40`
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              transition={hoverLiftTransition}
                            >
                              {active ? <SmallClockIcon className="h-4 w-4 shrink-0" /> : null}
                              {slot.label}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="pr-2 pt-2">
                    <h3 className="font-display text-3xl font-semibold text-text-primary md:text-4xl">Checkout</h3>
                    <p className="mt-2 text-sm text-text-primary/65 md:text-base">
                      Review your session details and complete secure payment.
                    </p>
                    <div className="mt-8 space-y-3 rounded-gentle border border-accent/80 bg-background/80 p-5 text-sm text-text-primary/70">
                      <p>
                        <span className="font-semibold text-text-secondary">Mood:</span>{" "}
                        {MOODS.find((m) => m.id === moodId)?.label}
                      </p>
                      {selectedDate ? (
                        <p>
                          <span className="font-semibold text-text-secondary">Date:</span>{" "}
                          {selectedDate.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      ) : null}
                      <p>
                        <span className="font-semibold text-text-secondary">Time:</span> {selectedTime}
                      </p>
                      {notes.trim() ? (
                        <p>
                          <span className="font-semibold text-text-secondary">Notes:</span> {notes}
                        </p>
                      ) : null}
                      <p>
                        <span className="font-semibold text-text-secondary">With:</span> {healer.name}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-accent/70 bg-white px-5 py-4 md:px-8">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-sm font-semibold text-text-primary/55 transition-colors hover:text-text-primary"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-3">
                  {step > 0 ? (
                    <button
                      type="button"
                      onClick={() => setStep((s) => Math.max(0, s - 1))}
                      className="rounded-full border border-accent/90 px-5 py-2.5 text-sm font-semibold text-text-primary/75 transition-colors hover:bg-accent/40"
                    >
                      Back
                    </button>
                  ) : null}
                  <motion.button
                    type="button"
                    onClick={() => {
                      if (isLast) {
                        onClose();
                        return;
                      }
                      setStep((s) => s + 1);
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-text-secondary px-6 py-2.5 text-sm font-semibold text-white shadow-sm"
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    transition={hoverLiftTransition}
                  >
                    {isLast ? "Complete" : "Next Step"}
                    {!isLast ? (
                      <span className="text-lg leading-none" aria-hidden>
                        →
                      </span>
                    ) : null}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="pointer-events-none fixed bottom-6 right-6 z-2 hidden max-w-[200px] rounded-gentle border border-accent/80 bg-white/95 p-3 text-xs text-text-primary/70 shadow-soft md:block"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...morphTransition, delay: 0.15 }}
          >
            <div className="flex items-start gap-2">
              <span className="text-text-secondary" aria-hidden>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M4 10v4a8 8 0 0012.5 6.5M8 8h.01M12 8h.01M16 8h.01" strokeLinecap="round" />
                  <path d="M16 3l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <p className="font-semibold text-text-secondary">Need help?</p>
                <p className="mt-0.5 leading-relaxed">Our care team is here if anything feels unclear.</p>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

export function BookSessionModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [healer, setHealer] = useState<BookSessionHealer>(DEFAULT_HEALER);
  const [modalKey, setModalKey] = useState(0);

  const close = useCallback(() => setOpen(false), []);

  const openModal = useCallback((healerArg?: BookSessionHealer | null) => {
    setHealer(healerArg && healerArg.name ? healerArg : DEFAULT_HEALER);
    setModalKey((current) => current + 1);
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ open: openModal, close }), [openModal, close]);

  return (
    <BookSessionModalContext.Provider value={value}>
      {children}
      <BookSessionModal key={modalKey} open={open} onClose={close} healer={healer} />
    </BookSessionModalContext.Provider>
  );
}
