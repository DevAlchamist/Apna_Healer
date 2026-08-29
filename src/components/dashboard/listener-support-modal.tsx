"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { TimeSlotGridSkeleton } from "@/components/skeletons";
import { easeCalm, hoverLiftTransition, morphTransition } from "@/components/ui/fade-in";
import { apiFetch, apiMutation } from "@/lib/api-client";
import { formatShortDate } from "@/lib/display";
import { MatchingLoader } from "@/components/dashboard/matching-loader";

type ListenerSupportModalContextValue = {
  open: () => void;
  close: () => void;
};

const ListenerSupportModalContext =
  createContext<ListenerSupportModalContextValue | null>(null);

const MOOD_OPTIONS = [
  { id: "calm", emoji: "😌", label: "Calm" },
  { id: "anxious", emoji: "😟", label: "Anxious" },
  { id: "low", emoji: "😔", label: "Low" },
  { id: "overwhelmed", emoji: "😵", label: "Overwhelmed" },
  { id: "reflective", emoji: "🤔", label: "Reflective" },
  { id: "tired", emoji: "😴", label: "Tired" },
] as const;

const TOPIC_OPTIONS = [
  "Stress",
  "Anxiety",
  "Loneliness",
  "Relationships",
  "Work",
  "Family",
  "Sleep",
  "Self-worth",
  "Grief",
] as const;

const TONE_OPTIONS = [
  { id: "warm", label: "Warm & gentle" },
  { id: "grounded", label: "Calm & grounded" },
  { id: "energetic", label: "Energetic & encouraging" },
  { id: "neutral", label: "Just listen" },
] as const;

const LANGUAGE_OPTIONS = ["English", "Hindi", "Marathi", "Tamil", "Telugu", "Bengali", "Kannada"] as const;

type SlotResponse = {
  date: string;
  timezone: string;
  durationMin: number;
  slots: string[];
};

const STEP_LABELS = ["Mood", "Topic", "When", "Done"] as const;

function formatTimeLabel(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

function buildDateOptions(count: number): { value: string; label: string }[] {
  const today = new Date();
  return Array.from({ length: count }).map((_, idx) => {
    const date = new Date(today);
    date.setDate(today.getDate() + idx);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return {
      value: `${year}-${month}-${day}`,
      label: idx === 0 ? `Today · ${formatShortDate(date)}` : formatShortDate(date),
    };
  });
}

export function useListenerSupportModal() {
  const ctx = useContext(ListenerSupportModalContext);
  if (!ctx) {
    throw new Error(
      "useListenerSupportModal must be used inside ListenerSupportModalProvider",
    );
  }
  return ctx;
}

export function ListenerSupportModalProvider({ children }: { children: ReactNode }) {
  // openKey doubles as visibility (>=0 = open) and the React key used to force
  // a fresh modal instance per open, so internal state always starts clean.
  const [openKey, setOpenKey] = useState<number | null>(null);

  const value = useMemo<ListenerSupportModalContextValue>(
    () => ({
      open: () => setOpenKey(Date.now()),
      close: () => setOpenKey(null),
    }),
    [],
  );

  return (
    <ListenerSupportModalContext.Provider value={value}>
      {children}
      <ListenerSupportModal
        key={openKey ?? "closed"}
        open={openKey !== null}
        onClose={() => setOpenKey(null)}
      />
    </ListenerSupportModalContext.Provider>
  );
}

function ListenerSupportModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState<string>("");
  const [topics, setTopics] = useState<string[]>([]);
  const [tone, setTone] = useState<string>("");
  const [language, setLanguage] = useState<string>("English");
  const [note, setNote] = useState("");
  const dateOptions = useMemo(() => buildDateOptions(7), []);
  const [date, setDate] = useState<string>(dateOptions[0]?.value ?? "");
  const [time, setTime] = useState<string>("");
  const [timeOption, setTimeOption] = useState<"asap" | "slot">("asap");
  const [submittedReference, setSubmittedReference] = useState<string | null>(null);
  const [showLoader, setShowLoader] = useState(false);

  const reset = useCallback(() => {
    setStep(0);
    setMood("");
    setTopics([]);
    setTone("");
    setLanguage("English");
    setNote("");
    setDate(dateOptions[0]?.value ?? "");
    setTime("");
    setTimeOption("asap");
    setSubmittedReference(null);
    setShowLoader(false);
  }, [dateOptions]);

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(reset, 250);
  }, [onClose, reset]);

  const slotsQuery = useQuery({
    queryKey: ["listener-slots", date],
    queryFn: () => apiFetch<SlotResponse>(`/api/listener-slots?date=${date}`),
    enabled: open && (step === 2 || timeOption === "asap") && !!date,
  });

  const slots = slotsQuery.data?.slots ?? [];

  // Auto-select first available slot when in ASAP mode
  useEffect(() => {
    if (!open || timeOption !== "asap" || step !== 2) return;
    
    if (slots.length > 0) {
      if (!time || !slots.includes(time)) {
        setTime(slots[0]);
      }
      return;
    }
    
    // If the currently selected date has no slots, try the next date
    const currentIndex = dateOptions.findIndex((d) => d.value === date);
    if (currentIndex !== -1 && currentIndex < dateOptions.length - 1) {
      setDate(dateOptions[currentIndex + 1].value);
    }
  }, [open, timeOption, step, slots, date, dateOptions, time]);

  const submitMutation = useMutation({
    mutationFn: () =>
      apiMutation<{ id: string; status: string; amountHeld: string }>(
        "/api/listener-requests",
        "POST",
        {
          preferredDate: date,
          preferredTime: time,
          duration: 30,
          emotionalTags: [mood, ...topics].filter(Boolean),
          preferredTone: tone || null,
          preferredLanguage: language || null,
          note: note.trim() || null,
          isAsap: timeOption === "asap",
        },
      ),
    onSuccess: (data) => {
      setSubmittedReference(data.id);
      setShowLoader(true);
      queryClient.invalidateQueries({ queryKey: ["user-me"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-listener-requests"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });

  const canAdvance = useMemo(() => {
    if (step === 0) return !!mood;
    if (step === 1) return topics.length > 0 && !!tone;
    if (step === 2) return !!date && !!time;
    return true;
  }, [step, mood, topics.length, tone, date, time]);

  const submitError = submitMutation.error?.message ?? null;

  return (
    <AnimatePresence>
      {open ? (
        <>
          {/* Mobile Backdrop */}
          <motion.div
            className="fixed inset-0 z-[99] bg-black/40 backdrop-blur-xs md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 md:inset-0 z-[100] bg-[#faf9f5] flex flex-col md:flex-row rounded-t-[32px] md:rounded-none h-[92vh] md:h-full overflow-hidden shadow-2xl md:shadow-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="listener-support-title"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.35, ease: easeCalm }}
          >
          {showLoader || submitMutation.isPending ? (
            <MatchingLoader
              open={showLoader || submitMutation.isPending}
              mode="listener"
              inline={true}
              onCancel={() => {
                setShowLoader(false);
                handleClose();
              }}
              onComplete={() => {
                if (submittedReference) {
                  setShowLoader(false);
                  setStep(3);
                }
              }}
            />
          ) : (
            <>
              <aside className="hidden md:flex w-full md:w-[300px] shrink-0 flex-col border-r border-[#e8e4dc] bg-[#f7f7f2] p-6 md:p-7 overflow-y-auto">
            <h2
              id="listener-support-title"
              className="font-display text-lg font-semibold tracking-tight text-[#045b4f] md:text-xl"
            >
              Talk to a Listener
            </h2>
            <p className="mt-1 text-xs text-text-primary/55">
              Anonymous peer support, matched after a quick check-in.
            </p>

            <nav className="mt-10 flex flex-col gap-0" aria-label="Booking steps">
              {STEP_LABELS.map((label, index) => {
                const active = index === step;
                const done = index < step;
                return (
                  <div key={label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          active
                            ? "bg-[#045b4f] text-white shadow-sm"
                            : done
                              ? "bg-[#045b4f]/85 text-white"
                              : "border-2 border-neutral-200 bg-white text-neutral-400"
                        }`}
                      >
                        {index + 1}
                      </span>
                      {index < STEP_LABELS.length - 1 ? (
                        <span className="my-1.5 block min-h-[10px] w-px flex-1 bg-neutral-200" aria-hidden />
                      ) : null}
                    </div>
                    <p className={`pb-8 text-sm font-semibold leading-snug ${active ? "text-[#045b4f]" : "text-neutral-400"}`}>
                      {label}
                    </p>
                  </div>
                );
              })}
            </nav>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col bg-white overflow-hidden">
            {/* Mobile Header (sticky at the top, hidden on desktop) */}
            <div className="flex flex-col border-b border-accent/60 bg-[#f7f7f2] px-5 py-3.5 md:hidden">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-[#045b4f]">
                  Talk to a Listener
                </h2>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-full p-1.5 text-text-primary/45 transition-colors hover:bg-accent/50"
                  aria-label="Close"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <div className="flex gap-1.5 w-full mt-3" aria-hidden="true">
                {STEP_LABELS.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      idx <= step ? "bg-[#045b4f]" : "bg-text-primary/10"
                    }`}
                  />
                ))}
              </div>
              <p className="text-[10px] font-bold text-text-primary/45 mt-2 uppercase tracking-wider">
                Step {step + 1} of {STEP_LABELS.length}: {STEP_LABELS[step]}
              </p>
            </div>

            <div className="relative flex-1 overflow-y-auto overscroll-contain px-5 pb-4 pt-4 md:px-8 md:pt-5">
              {/* Close Button */}
              <div className="hidden md:flex justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-full p-2 text-text-primary/50 transition hover:bg-accent/60 hover:text-text-primary"
                  aria-label="Close"
                >
                  <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 5l10 10M15 5L5 15" />
                  </svg>
                </button>
              </div>

              {/* Step Content */}
              <div className="mx-auto max-w-xl pb-10">
                {step === 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-text-primary/70">
                      How are you feeling right now? Your check-in stays anonymous.
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {MOOD_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setMood(option.id)}
                          className={`flex flex-col items-center gap-1 rounded-calm border px-3 py-4 text-sm font-semibold transition ${
                            mood === option.id
                              ? "border-[#045b4f] bg-[#e7f5ee] text-[#0f5147] shadow-soft"
                              : "border-accent bg-white text-text-primary/75 hover:border-[#045b4f]/60"
                          }`}
                        >
                          <span className="text-2xl">{option.emoji}</span>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : step === 1 ? (
                  <div className="space-y-5">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        What would you like support with?
                      </p>
                      <p className="text-xs text-text-primary/55">Pick one or more.</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {TOPIC_OPTIONS.map((topic) => {
                          const active = topics.includes(topic);
                          return (
                            <button
                              key={topic}
                              type="button"
                              onClick={() =>
                                setTopics((current) =>
                                  active
                                    ? current.filter((entry) => entry !== topic)
                                    : [...current, topic],
                                )
                              }
                              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                active
                                  ? "border-[#045b4f] bg-[#045b4f] text-white"
                                  : "border-accent bg-white text-text-primary/70 hover:border-[#045b4f]/60"
                              }`}
                            >
                              {topic}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-text-primary">Preferred tone</p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {TONE_OPTIONS.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setTone(option.id)}
                            className={`rounded-calm border px-3 py-3 text-left text-sm font-semibold transition ${
                              tone === option.id
                                ? "border-[#045b4f] bg-[#e7f5ee] text-[#0f5147]"
                                : "border-accent bg-white text-text-primary/75 hover:border-[#045b4f]/60"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="listener-language"
                        className="text-sm font-semibold text-text-primary"
                      >
                        Preferred language
                      </label>
                      <select
                        id="listener-language"
                        value={language}
                        onChange={(event) => setLanguage(event.target.value)}
                        className="mt-2 w-full rounded-calm border border-accent bg-white px-3 py-2 text-sm text-text-primary focus:border-[#045b4f] focus:outline-none"
                      >
                        {LANGUAGE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="listener-note"
                        className="text-sm font-semibold text-text-primary"
                      >
                        Anything else (optional)
                      </label>
                      <textarea
                        id="listener-note"
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        rows={3}
                        maxLength={2000}
                        className="mt-2 w-full rounded-calm border border-accent bg-white px-3 py-2 text-sm text-text-primary focus:border-[#045b4f] focus:outline-none"
                        placeholder="Share whatever feels helpful — your listener will only see what you write here."
                      />
                    </div>
                  </div>
                ) : step === 2 ? (
                  <div className="space-y-5">
                    <p className="text-sm font-semibold text-text-primary">When would you like to talk?</p>
                    
                    {/* Time Selection Options */}
                    <div className="mt-2 grid grid-cols-2 gap-2 border border-accent/60 p-1 rounded-2xl bg-neutral-50">
                      <button
                        type="button"
                        onClick={() => {
                          setTimeOption("asap");
                          const now = new Date();
                          const y = now.getFullYear();
                          const m = (now.getMonth() + 1).toString().padStart(2, "0");
                          const d = now.getDate().toString().padStart(2, "0");
                          setDate(`${y}-${m}-${d}`);
                          setTime("");
                        }}
                        className={`rounded-xl py-2.5 px-3 text-xs font-bold text-center cursor-pointer transition ${
                          timeOption === "asap"
                            ? "bg-[#045b4f] text-white shadow-sm"
                            : "text-text-primary/75 hover:bg-accent/40"
                        }`}
                      >
                        As soon as someone is free
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTimeOption("slot");
                          setDate(dateOptions[0]?.value ?? "");
                          setTime("");
                        }}
                        className={`rounded-xl py-2.5 px-3 text-xs font-bold text-center cursor-pointer transition ${
                          timeOption === "slot"
                            ? "bg-[#045b4f] text-white shadow-sm"
                            : "text-text-primary/75 hover:bg-accent/40"
                        }`}
                      >
                        Pick a slot
                      </button>
                    </div>

                    {timeOption === "slot" ? (
                      <div className="space-y-5 mt-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-primary/45">Date Options</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {dateOptions.map((option) => {
                              const active = date === option.value;
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => {
                                    setDate(option.value);
                                    setTime("");
                                  }}
                                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                    active
                                      ? "border-[#045b4f] bg-[#045b4f] text-white"
                                      : "border-accent bg-white text-text-primary/70 hover:border-[#045b4f]/60"
                                  }`}
                                >
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-primary/45">Pick a time slot</p>
                          <p className="text-xs text-text-primary/55 mt-1">
                            Listener support is anonymous and lasts 30 minutes. We&apos;ll match you with an
                            available listener after a quick review.
                          </p>
                          {slotsQuery.isLoading ? (
                            <TimeSlotGridSkeleton count={6} />
                          ) : slots.length === 0 ? (
                            <div className="mt-3 rounded-calm border border-accent bg-background/60 px-4 py-3 text-sm text-text-primary/60">
                              No listeners are available for this date. Try another day.
                            </div>
                          ) : (
                            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                              {slots.map((slot) => {
                                const active = time === slot;
                                return (
                                  <button
                                    key={slot}
                                    type="button"
                                    onClick={() => setTime(slot)}
                                    className={`rounded-calm border px-3 py-2 text-sm font-semibold transition ${
                                      active
                                        ? "border-[#045b4f] bg-[#045b4f] text-white"
                                        : "border-accent bg-white text-text-primary/75 hover:border-[#045b4f]/60"
                                    }`}
                                  >
                                    {formatTimeLabel(slot)}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      time ? (
                        <div className="rounded-calm bg-[#e7f5ee] border border-[#045b4f]/25 px-4 py-3.5 text-xs text-[#0f5147]">
                          <p className="font-bold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#045b4f] animate-ping" />
                            Earliest match auto-selected
                          </p>
                          <p className="mt-1 text-text-primary/65">
                            Earliest available slot found: <span className="font-bold">{formatShortDate(new Date(date))} at {formatTimeLabel(time)}</span>
                          </p>
                        </div>
                      ) : (
                        slotsQuery.isLoading ? (
                          <p className="text-xs text-text-primary/55 animate-pulse">Scanning available listener calendar slots...</p>
                        ) : (
                          <div className="rounded-calm bg-[#fdf0ee] border border-red-200 px-4 py-3 text-xs text-[#cf4f45]">
                            No volunteer listeners are currently active or have open slots for the next 7 days.
                          </div>
                        )
                      )
                    )}

                    <div className="rounded-calm bg-background/60 px-4 py-3 text-xs text-text-primary/60">
                      A hold of <span className="font-semibold text-[#045b4f]">50 healing points</span>
                      {" "}will be placed on your wallet while admins review and a listener confirms.
                      The amount is fully refunded if the request is declined.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 text-left">
                    <div className="text-center">
                      <motion.div
                        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage-100 text-sage-700"
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={hoverLiftTransition}
                      >
                        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </motion.div>
                      <h3 className="mt-5 font-display text-2xl font-semibold text-text-primary">
                        A listener is on the way
                      </h3>
                      <p className="mt-2 text-sm text-text-primary/70 max-w-md mx-auto leading-relaxed">
                        Reaching out took the hardest part. We'll let you know the moment someone is ready for you.
                      </p>
                    </div>

                    {/* Lavender Request Details Card */}
                    <div className="rounded-3xl bg-[#f3f0fc] p-5 shadow-xs border border-violet-100">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-violet-600">
                        <span>Request</span>
                        <span>
                          #AH-LS-{submittedReference ? submittedReference.slice(-4) : "3086"}
                        </span>
                      </div>
                      <h4 className="font-display text-xl font-bold text-text-secondary mt-2.5">
                        {timeOption === "asap" ? (
                          "As soon as a listener is free"
                        ) : (
                          `${formatShortDate(new Date(date))} at ${formatTimeLabel(time)}`
                        )}
                      </h4>
                      <p className="text-xs text-text-primary/60 mt-1 font-medium">
                        {[mood, ...topics].filter((t) => t !== mood).join(", ") || "General support"} · {language}
                      </p>
                    </div>

                    {/* Bullet List points */}
                    <ul className="space-y-3 text-sm text-text-primary/80 pl-1">
                      <li className="flex items-start gap-3">
                        <span className="flex h-2 w-2 rounded-full bg-[#1f8a6e] mt-2 shrink-0" />
                        <span>We notify listeners who match your topics and tone.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex h-2 w-2 rounded-full bg-[#1f8a6e] mt-2 shrink-0" />
                        <span>You get a ping here as soon as one accepts.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex h-2 w-2 rounded-full bg-[#1f8a6e] mt-2 shrink-0" />
                        <span>Nothing starts until you open the chat yourself.</span>
                      </li>
                    </ul>

                    {/* Anonymous privacy note */}
                    <div className="flex gap-3 rounded-2xl bg-[#eef6eb]/50 p-4 border border-[#e8e4dc]">
                      <svg className="h-5 w-5 text-sage-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                      <p className="text-xs leading-relaxed text-text-primary/75">
                        You appear only as your nickname. Your listener never sees your name, number, or profile, and you can end the conversation at any time.
                      </p>
                    </div>
                  </div>
                )}

                {submitError && step !== 3 ? (
                  <p className="mt-4 rounded-calm bg-[#fdecea] px-3 py-2 text-xs font-semibold text-[#cf4f45]">
                    {submitError}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Bottom Actions Footer */}
            <div className="flex shrink-0 items-center justify-between border-t border-[#e8e4dc] bg-[#faf9f5] px-5 py-4 md:px-8">
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => (step === 0 ? handleClose() : setStep(step - 1))}
                  className="text-sm font-semibold text-text-primary/65 transition hover:text-text-primary"
                >
                  {step === 0 ? "Cancel" : "Back"}
                </button>
              ) : (
                <span />
              )}

              {step < 2 ? (
                <button
                  type="button"
                  disabled={!canAdvance}
                  onClick={() => setStep(step + 1)}
                  className="rounded-full bg-[#045b4f] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 hover:shadow-[0_10px_28px_-8px_rgb(4_91_79/45%)]"
                >
                  Continue
                </button>
              ) : step === 2 ? (
                <button
                  type="button"
                  disabled={!canAdvance || submitMutation.isPending}
                  onClick={() => submitMutation.mutate()}
                  className="inline-flex items-center gap-2 rounded-full bg-[#045b4f] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 hover:shadow-[0_10px_28px_-8px_rgb(4_91_79/45%)]"
                >
                  {submitMutation.isPending && (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/35 border-t-white" aria-hidden />
                  )}
                  {submitMutation.isPending ? "Sending..." : "Send Request"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-full bg-[#045b4f] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-[0_10px_28px_-8px_rgb(4_91_79/45%)]"
                >
                  Done
                </button>
              )}
            </div>
          </div>
            </>
          )}
        </motion.div>
      </> ) : null}
    </AnimatePresence>
  );
}
