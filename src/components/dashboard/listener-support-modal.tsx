"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { TimeSlotGridSkeleton } from "@/components/skeletons";
import { easeCalm, hoverLiftTransition, morphTransition } from "@/components/ui/fade-in";
import { apiFetch, apiMutation } from "@/lib/api-client";
import { formatShortDate } from "@/lib/display";

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
  const [submittedReference, setSubmittedReference] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStep(0);
    setMood("");
    setTopics([]);
    setTone("");
    setLanguage("English");
    setNote("");
    setDate(dateOptions[0]?.value ?? "");
    setTime("");
    setSubmittedReference(null);
  }, [dateOptions]);

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(reset, 250);
  }, [onClose, reset]);

  const slotsQuery = useQuery({
    queryKey: ["listener-slots", date],
    queryFn: () => apiFetch<SlotResponse>(`/api/listener-slots?date=${date}`),
    enabled: open && step === 2 && !!date,
  });

  const slots = slotsQuery.data?.slots ?? [];

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
        },
      ),
    onSuccess: (data) => {
      setSubmittedReference(data.id);
      setStep(3);
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
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: easeCalm }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="listener-support-title"
          onClick={handleClose}
        >
          <motion.div
            className="relative w-full max-w-2xl overflow-hidden rounded-calm bg-white shadow-soft-hover"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={morphTransition}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-accent/60 px-6 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-primary/55">
                  Anonymous Listener Support
                </p>
                <h2
                  id="listener-support-title"
                  className="mt-1 font-display text-2xl font-semibold text-text-primary"
                >
                  Talk to a Listener
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full p-2 text-text-primary/50 transition hover:bg-accent/60 hover:text-text-primary"
                aria-label="Close"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 5l10 10M15 5L5 15" />
                </svg>
              </button>
            </div>

            <ol className="flex items-center gap-3 border-b border-accent/40 bg-background/60 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-primary/55">
              {STEP_LABELS.map((label, index) => (
                <li
                  key={label}
                  className={`flex items-center gap-2 ${
                    index === step ? "text-text-secondary" : index < step ? "text-[#0f5147]" : ""
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                      index <= step
                        ? "bg-[#045b4f] text-white"
                        : "bg-white text-text-primary/50 ring-1 ring-accent"
                    }`}
                  >
                    {index + 1}
                  </span>
                  {label}
                </li>
              ))}
            </ol>

            <div className="max-h-[60vh] overflow-y-auto px-6 py-6">
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
                  <div>
                    <p className="text-sm font-semibold text-text-primary">When would you like to talk?</p>
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
                    <p className="text-sm font-semibold text-text-primary">Pick a time slot</p>
                    <p className="text-xs text-text-primary/55">
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

                  <div className="rounded-calm bg-background/60 px-4 py-3 text-xs text-text-primary/60">
                    A hold of <span className="font-semibold text-text-primary">50 healing points</span>
                    {" "}will be placed on your wallet while admins review and a listener confirms.
                    The amount is fully refunded if the request is declined.
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-center">
                  <motion.div
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e7f5ee] text-[#045b4f]"
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={hoverLiftTransition}
                  >
                    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </motion.div>
                  <p className="font-display text-2xl font-semibold text-text-primary">
                    Request sent
                  </p>
                  <p className="mx-auto max-w-md text-sm text-text-primary/70">
                    Thanks for opening up. Admins will match you with a listener shortly. You&apos;ll
                    see this conversation in your dashboard once it&apos;s confirmed — your listener&apos;s
                    identity stays private until after the session.
                  </p>
                  {submittedReference ? (
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-primary/45">
                      Reference: {submittedReference.slice(-8)}
                    </p>
                  ) : null}
                </div>
              )}

              {submitError && step !== 3 ? (
                <p className="mt-4 rounded-calm bg-[#fdecea] px-3 py-2 text-xs font-semibold text-[#cf4f45]">
                  {submitError}
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-between border-t border-accent/60 px-6 py-4">
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
                  className="rounded-full bg-[#045b4f] px-5 py-2 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 hover:shadow-[0_10px_28px_-8px_rgb(4_91_79/45%)]"
                >
                  Continue
                </button>
              ) : step === 2 ? (
                <button
                  type="button"
                  disabled={!canAdvance || submitMutation.isPending}
                  onClick={() => submitMutation.mutate()}
                  className="rounded-full bg-[#045b4f] px-5 py-2 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 hover:shadow-[0_10px_28px_-8px_rgb(4_91_79/45%)]"
                >
                  {submitMutation.isPending ? "Sending..." : "Send Request"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-full bg-[#045b4f] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-[0_10px_28px_-8px_rgb(4_91_79/45%)]"
                >
                  Done
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
