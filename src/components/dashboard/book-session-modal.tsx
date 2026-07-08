"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { normalizeTimeToHHmm } from "@/lib/time-format";
import { easeCalm, hoverLiftTransition, morphTransition } from "@/components/ui/fade-in";
import { apiFetch, apiMutation } from "@/lib/api-client";
import { formatCurrency, formatShortDate, toSentenceCase } from "@/lib/display";
import type { ApiProvider, ApiUser, BookingPaymentMethodValue } from "@/types/api";
import {
  BookingCalendar,
  type CalendarAvailabilityEntry,
} from "@/components/dashboard/booking-calendar";
import { BookingCalendarSkeleton, ProviderRowSkeleton, TimeSlotGridSkeleton } from "@/components/skeletons";

type LiveSlot = { start: string; end: string; isBooked: boolean };
type BookedRange = { start: string; end: string };
type LiveSlotsResponse = {
  providerId: string;
  date: string;
  timezone: string;
  slots: LiveSlot[];
  bookings: BookedRange[];
} | null;

type WeeklyTherapistSlotsPayload = {
  therapistId: string;
  date: string;
  timezone: string;
  slots: LiveSlot[];
};

const TIME_RE = /^([0-9]{1,2}):([0-9]{2})$/;

function parseTimeToMinutes(value: string): number | null {
  const match = TIME_RE.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function formatMinutesToTime(minutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Math.floor(minutes)));
  const h = Math.floor(clamped / 60).toString().padStart(2, "0");
  const m = (clamped % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function formatTimeLabel(time: string): string {
  const minutes = parseTimeToMinutes(time);
  if (minutes === null) return time;
  const period = minutes >= 12 * 60 ? "PM" : "AM";
  const hour12 = (() => {
    const hr = Math.floor(minutes / 60) % 12;
    return hr === 0 ? 12 : hr;
  })();
  const mins = minutes % 60;
  return `${hour12}:${mins.toString().padStart(2, "0")} ${period}`;
}

function rangesIntersect(
  a: { startMinutes: number; endMinutes: number },
  b: { startMinutes: number; endMinutes: number },
): boolean {
  return a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;
}

type ProviderRolePreference = "THERAPIST" | "LISTENER";

export type BookSessionPreselection = {
  /** Local calendar date YYYY-MM-DD */
  dateYmd: string;
  start: string;
  end: string;
};

export type BookSessionHealer = {
  providerId?: string;
  name?: string;
  specialty?: string;
  imageSrc?: string | null;
  preferredRole?: ProviderRolePreference;
  /** When set, schedule step opens with this slot already chosen. */
  preselection?: BookSessionPreselection;
  initialNote?: string;
};

const EMPTY_HEALER: BookSessionHealer = {};
const STEP_LABELS_LOCKED = ["Your Mood", "Scheduling", "Checkout"] as const;
const STEP_LABELS_THERAPIST_OPEN = [
  "Select Therapist",
  "Schedule",
  "Intake",
  "Confirm & Pay",
] as const;
const STEP_LABELS_THERAPIST_LOCKED = [
  "Your Mood",
  "Schedule",
  "Intake",
  "Confirm & Pay",
] as const;

function formatLocalYmd(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dateYmdToIsoNoonUtc(ymd: string): string {
  return new Date(`${ymd}T12:00:00.000Z`).toISOString();
}

function truncateForNote(text: string, max = 500): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}

const MOOD_OPTIONS = [
  { id: "calm", emoji: "😌", label: "Calm" },
  { id: "anxious", emoji: "😟", label: "Anxious" },
  { id: "tired", emoji: "😴", label: "Tired" },
  { id: "inspired", emoji: "✨", label: "Inspired" },
  { id: "reflective", emoji: "🤔", label: "Reflective" },
] as const;

type MoodId = (typeof MOOD_OPTIONS)[number]["id"];

type BookSessionModalContextValue = {
  open: (healer?: BookSessionHealer | null) => void;
  close: () => void;
};

const BookSessionModalContext = createContext<BookSessionModalContextValue | null>(null);

function getInitials(name?: string | null) {
  const source = name?.trim() || "AH";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function useBookSessionModal() {
  const ctx = useContext(BookSessionModalContext);
  if (!ctx) {
    throw new Error("useBookSessionModal must be used within BookSessionModalProvider");
  }
  return ctx;
}

function HealerAvatar({
  healer,
  size = "md",
}: {
  healer: BookSessionHealer;
  size?: "md" | "lg";
}) {
  const initials = getInitials(healer.name);
  const box = size === "lg" ? "h-14 w-14 text-sm" : "h-11 w-11 text-xs";

  if (healer.imageSrc) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={healer.imageSrc}
          alt=""
          className={`${box} shrink-0 rounded-full object-cover ring-2 ring-white/90`}
        />
      </>
    );
  }

  return (
    <div
      className={`flex ${box} shrink-0 items-center justify-center rounded-full bg-primary/25 font-bold text-text-secondary ring-2 ring-white/90`}
    >
      {initials}
    </div>
  );
}

function toHealer(provider: ApiProvider | null, fallback: BookSessionHealer) {
  if (provider) {
    return {
      providerId: provider.id,
      name: provider.name ?? "Verified provider",
      specialty: toSentenceCase(provider.role),
      imageSrc: provider.image,
      preferredRole: provider.role,
    } satisfies BookSessionHealer;
  }

  return {
    providerId: fallback.providerId,
    name: fallback.name ?? "Choose a provider",
    specialty: fallback.specialty ?? "Provider directory",
    imageSrc: fallback.imageSrc,
    preferredRole: fallback.preferredRole,
  } satisfies BookSessionHealer;
}

function BookSessionModal({
  open,
  onClose,
  requestedHealer,
}: {
  open: boolean;
  onClose: () => void;
  requestedHealer: BookSessionHealer;
}) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [notes, setNotes] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState(requestedHealer.providerId ?? "");
  const [selectedAvailabilityId, setSelectedAvailabilityId] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedEndTime, setSelectedEndTime] = useState("");

  const isProviderLocked = !!requestedHealer.providerId;
  /** Anonymous listener support is booked via `ListenerSupportModal`, not this modal. */
  const isListenerCheckIn = false;

  const [mood, setMood] = useState<MoodId | null>(null);

  const [weeklyDateKey, setWeeklyDateKey] = useState(() => formatLocalYmd(new Date()));
  const [selectedTherapistSlot, setSelectedTherapistSlot] = useState<{
    date: string;
    start: string;
    end: string;
  } | null>(null);
  const [intakeChiefConcern, setIntakeChiefConcern] = useState("");
  const [intakeGoals, setIntakeGoals] = useState("");
  const [intakePriorTherapy, setIntakePriorTherapy] = useState("");
  const [intakeSafetyNote, setIntakeSafetyNote] = useState("");
  const [therapistPaymentMethod, setTherapistPaymentMethod] =
    useState<BookingPaymentMethodValue>("WALLET");
  const [externalPaymentReady, setExternalPaymentReady] = useState(false);

  const handleClose = useCallback(() => {
    setMood(null);
    setNotes("");
    setStep(0);
    setSelectedAvailabilityId("");
    setSelectedTime("");
    setSelectedEndTime("");
    setWeeklyDateKey(formatLocalYmd(new Date()));
    setSelectedTherapistSlot(null);
    setIntakeChiefConcern("");
    setIntakeGoals("");
    setIntakePriorTherapy("");
    setIntakeSafetyNote("");
    setTherapistPaymentMethod("WALLET");
    setExternalPaymentReady(false);
    onClose();
  }, [onClose]);

  const providersQuery = useQuery({
    queryKey: ["book-session-modal-providers"],
    queryFn: () => apiFetch<ApiProvider[]>("/api/providers?role=THERAPIST&take=24"),
    enabled: open && !isProviderLocked && !isListenerCheckIn,
  });

  const userMeQuery = useQuery({
    queryKey: ["user-me"],
    queryFn: () => apiFetch<ApiUser>("/api/users/me"),
    enabled: open,
  });

  const walletAvailable = Number(userMeQuery.data?.wallet?.availableBalance ?? 0);

  const listenerCandidatesQuery = useQuery({
    queryKey: ["book-session-listener-candidates"],
    queryFn: () => apiFetch<ApiProvider[]>("/api/providers?role=LISTENER&take=12"),
    enabled: open && isListenerCheckIn,
  });

  const autoMatchedListenerId = useMemo(() => {
    if (!isListenerCheckIn) return "";
    const list = listenerCandidatesQuery.data ?? [];
    return list[0]?.id ?? "";
  }, [isListenerCheckIn, listenerCandidatesQuery.data]);

  const effectiveProviderLocked = isProviderLocked || isListenerCheckIn;

  const providers = useMemo(() => providersQuery.data ?? [], [providersQuery.data]);
  const filteredProviders = providers;

  const resolvedSelectedProviderId = useMemo(() => {
    if (isProviderLocked && requestedHealer.providerId) {
      return requestedHealer.providerId;
    }

    if (isListenerCheckIn) {
      return autoMatchedListenerId;
    }

    if (filteredProviders.some((provider) => provider.id === selectedProviderId)) {
      return selectedProviderId;
    }

    const requestedProvider =
      (requestedHealer.providerId
        ? filteredProviders.find((provider) => provider.id === requestedHealer.providerId)
        : undefined) ??
      (requestedHealer.name
        ? filteredProviders.find((provider) => provider.name === requestedHealer.name)
        : undefined);

    return requestedProvider?.id ?? filteredProviders[0]?.id ?? "";
  }, [
    autoMatchedListenerId,
    filteredProviders,
    isListenerCheckIn,
    isProviderLocked,
    requestedHealer.name,
    requestedHealer.providerId,
    selectedProviderId,
  ]);

  const skipSlotResetRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    if (requestedHealer.providerId) {
      setSelectedProviderId(requestedHealer.providerId);
    }

    const pre = requestedHealer.preselection;
    if (pre) {
      skipSlotResetRef.current = true;
      setWeeklyDateKey(pre.dateYmd);
      setSelectedTherapistSlot({
        date: pre.dateYmd,
        start: normalizeTimeToHHmm(pre.start),
        end: normalizeTimeToHHmm(pre.end),
      });
    }

    if (requestedHealer.initialNote?.trim()) {
      setNotes(requestedHealer.initialNote.trim());
    }
  }, [open, requestedHealer]);

  useEffect(() => {
    if (!open || isListenerCheckIn) return;
    if (skipSlotResetRef.current) {
      skipSlotResetRef.current = false;
      return;
    }
    setSelectedTherapistSlot(null);
  }, [weeklyDateKey, resolvedSelectedProviderId, open, isListenerCheckIn]);

  const providerDetailQuery = useQuery({
    queryKey: ["book-session-modal-provider-detail", resolvedSelectedProviderId],
    queryFn: () => apiFetch<ApiProvider>(`/api/providers/${resolvedSelectedProviderId}`),
    enabled: open && !!resolvedSelectedProviderId,
  });

  const initialActiveAvailability = useMemo(() => {
    const list = providerDetailQuery.data?.availability ?? [];
    return (
      list.find((entry) => entry.id === selectedAvailabilityId) ??
      list.find((entry) => entry.slots.some((slot) => !slot.isBooked)) ??
      list[0] ??
      null
    );
  }, [providerDetailQuery.data, selectedAvailabilityId]);

  const liveSlotsQuery = useQuery({
    queryKey: [
      "book-session-modal-live-slots",
      resolvedSelectedProviderId,
      initialActiveAvailability?.id ?? "",
    ],
    queryFn: async () => {
      if (!initialActiveAvailability) return null;
      return apiFetch<LiveSlotsResponse>(
        `/api/providers/${resolvedSelectedProviderId}/slots?date=${encodeURIComponent(initialActiveAvailability.date)}`,
      );
    },
    enabled:
      open &&
      !!resolvedSelectedProviderId &&
      !!initialActiveAvailability &&
      isListenerCheckIn,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  const weeklySlotsQuery = useQuery({
    queryKey: [
      "book-session-therapist-weekly-slots",
      resolvedSelectedProviderId,
      weeklyDateKey,
    ],
    queryFn: () =>
      apiFetch<WeeklyTherapistSlotsPayload>(
        `/api/therapists/${resolvedSelectedProviderId}/weekly-slots?date=${encodeURIComponent(weeklyDateKey)}`,
      ),
    enabled:
      open &&
      !isListenerCheckIn &&
      !!resolvedSelectedProviderId &&
      (step === 1 || !!requestedHealer.preselection),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  const weeklyFreeSlots = useMemo(
    () => (weeklySlotsQuery.data?.slots ?? []).filter((slot) => !slot.isBooked),
    [weeklySlotsQuery.data?.slots],
  );

  const selectedProvider = providerDetailQuery.data ?? null;
  const selectedProviderPreview =
    selectedProvider ??
    providers.find((provider) => provider.id === resolvedSelectedProviderId) ??
    null;
  const modalHealer = toHealer(selectedProviderPreview, requestedHealer);
  const availability = useMemo(
    () => selectedProvider?.availability ?? [],
    [selectedProvider?.availability],
  );
  const selectedAvailability = useMemo(
    () =>
      availability.find((entry) => entry.id === selectedAvailabilityId) ??
      availability.find((entry) => entry.slots.some((slot) => !slot.isBooked)) ??
      availability[0] ??
      null,
    [availability, selectedAvailabilityId],
  );
  const liveSlotsMatch = useMemo(() => {
    const live = liveSlotsQuery.data;
    if (!live || !selectedAvailability) return null;
    if (
      new Date(live.date).toDateString() !==
      new Date(selectedAvailability.date).toDateString()
    ) {
      return null;
    }
    return live;
  }, [liveSlotsQuery.data, selectedAvailability]);
  const effectiveSlots = useMemo(
    () => liveSlotsMatch?.slots ?? selectedAvailability?.slots ?? [],
    [liveSlotsMatch, selectedAvailability],
  );
  const activeBookingRanges = useMemo(
    () => liveSlotsMatch?.bookings ?? [],
    [liveSlotsMatch],
  );
  const availableWindows = useMemo(
    () => effectiveSlots.filter((slot) => !slot.isBooked),
    [effectiveSlots],
  );

  const MIN_SESSION_MINUTES = 15;

  // Earliest start and latest end across all windows for the selected day.
  const dayBounds = useMemo(() => {
    if (availableWindows.length === 0) return null;
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const window of availableWindows) {
      const startMinutes = parseTimeToMinutes(window.start);
      const endMinutes = parseTimeToMinutes(window.end);
      if (startMinutes === null || endMinutes === null) continue;
      if (startMinutes < min) min = startMinutes;
      if (endMinutes > max) max = endMinutes;
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
    return { min, max };
  }, [availableWindows]);

  const resolvedStart = useMemo(() => {
    if (!dayBounds || !selectedTime.trim()) return "";
    const candidate = parseTimeToMinutes(selectedTime);
    if (candidate === null) return "";
    const maxStart = Math.max(dayBounds.min, dayBounds.max - MIN_SESSION_MINUTES);
    const clamped = Math.max(dayBounds.min, Math.min(candidate, maxStart));
    return formatMinutesToTime(clamped);
  }, [dayBounds, selectedTime]);

  const resolvedEnd = useMemo(() => {
    const startMinutes = parseTimeToMinutes(resolvedStart);
    if (!dayBounds || startMinutes === null) return "";
    const candidate = parseTimeToMinutes(selectedEndTime);
    if (candidate === null) {
      const defaultDuration = selectedProvider?.role === "LISTENER" ? 30 : 60;
      const defaultEnd = Math.min(startMinutes + defaultDuration, dayBounds.max);
      return formatMinutesToTime(Math.max(startMinutes + MIN_SESSION_MINUTES, defaultEnd));
    }
    const minEnd = startMinutes + MIN_SESSION_MINUTES;
    const clamped = Math.min(Math.max(candidate, minEnd), dayBounds.max);
    return formatMinutesToTime(clamped);
  }, [resolvedStart, dayBounds, selectedEndTime, selectedProvider?.role]);

  const bookingDuration = useMemo(() => {
    const start = parseTimeToMinutes(resolvedStart);
    const end = parseTimeToMinutes(resolvedEnd);
    if (start === null || end === null) return 0;
    return Math.max(0, end - start);
  }, [resolvedStart, resolvedEnd]);

  type CustomTimeStatus =
    | { state: "valid" }
    | { state: "out-of-window" }
    | { state: "too-short" }
    | { state: "conflict"; conflict: BookedRange }
    | { state: "no-time" };

  const customTimeStatus = useMemo((): CustomTimeStatus => {
    if (!dayBounds) return { state: "no-time" };
    const start = parseTimeToMinutes(resolvedStart);
    const end = parseTimeToMinutes(resolvedEnd);
    if (start === null || end === null) return { state: "no-time" };
    if (end - start < MIN_SESSION_MINUTES) return { state: "too-short" };
    // The chosen [start, end] must fit fully inside ONE published window.
    const containingWindow = availableWindows.find((window) => {
      const ws = parseTimeToMinutes(window.start);
      const we = parseTimeToMinutes(window.end);
      if (ws === null || we === null) return false;
      return ws <= start && end <= we;
    });
    if (!containingWindow) return { state: "out-of-window" };

    const conflict = activeBookingRanges.find((range) => {
      const rangeStart = parseTimeToMinutes(range.start);
      const rangeEnd = parseTimeToMinutes(range.end);
      if (rangeStart === null || rangeEnd === null) return false;
      return rangesIntersect(
        { startMinutes: start, endMinutes: end },
        { startMinutes: rangeStart, endMinutes: rangeEnd },
      );
    });
    if (conflict) return { state: "conflict", conflict };
    return { state: "valid" };
  }, [activeBookingRanges, availableWindows, resolvedEnd, resolvedStart, dayBounds]);

  const hourlyRateNumber = selectedProvider?.hourlyRate
    ? Number(selectedProvider.hourlyRate)
    : 0;

  const therapistSlotDuration = useMemo(() => {
    if (!selectedTherapistSlot) return 0;
    const start = parseTimeToMinutes(selectedTherapistSlot.start);
    const end = parseTimeToMinutes(selectedTherapistSlot.end);
    if (start === null || end === null) return 0;
    return Math.max(0, end - start);
  }, [selectedTherapistSlot]);

  const paymentDurationMinutes = useMemo(() => {
    if (isListenerCheckIn) return bookingDuration;
    return therapistSlotDuration;
  }, [bookingDuration, isListenerCheckIn, therapistSlotDuration]);

  const sessionAmount = useMemo(
    () => Math.round((hourlyRateNumber * paymentDurationMinutes) / 60 * 100) / 100,
    [hourlyRateNumber, paymentDurationMinutes],
  );

  const stepLabels = useMemo((): readonly string[] => {
    if (isListenerCheckIn) return STEP_LABELS_LOCKED;
    if (effectiveProviderLocked) return STEP_LABELS_THERAPIST_LOCKED;
    return STEP_LABELS_THERAPIST_OPEN;
  }, [effectiveProviderLocked, isListenerCheckIn]);

  const canAdvance = useMemo(() => {
    if (isListenerCheckIn) {
      if (step === 0) {
        return (
          !!resolvedSelectedProviderId && (effectiveProviderLocked ? !!mood : true)
        );
      }
      if (step === 1) {
        return !!selectedAvailability && customTimeStatus.state === "valid";
      }
      if (step === 2) {
        return (
          !!selectedProvider?.hourlyRate &&
          Number(selectedProvider.hourlyRate) > 0 &&
          sessionAmount > 0
        );
      }
      return false;
    }

    if (step === 0) {
      return !!resolvedSelectedProviderId && (effectiveProviderLocked ? !!mood : true);
    }
    if (step === 1) return !!selectedTherapistSlot;
    if (step === 2) return intakeChiefConcern.trim().length >= 2;
    if (step === 3) {
      const priced =
        !!selectedProvider?.hourlyRate &&
        Number(selectedProvider.hourlyRate) > 0 &&
        sessionAmount > 0;
      if (!priced) return false;
      if (therapistPaymentMethod === "WALLET") {
        return walletAvailable >= sessionAmount;
      }
      return externalPaymentReady;
    }
    return false;
  }, [
    customTimeStatus.state,
    effectiveProviderLocked,
    externalPaymentReady,
    intakeChiefConcern,
    isListenerCheckIn,
    mood,
    resolvedSelectedProviderId,
    selectedAvailability,
    selectedProvider?.hourlyRate,
    selectedTherapistSlot,
    sessionAmount,
    step,
    therapistPaymentMethod,
    walletAvailable,
  ]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  useEffect(() => {
    if (open) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
    return;
  }, [open]);

  const invalidatePostBookingQueries = useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["book-session-modal-providers"] }),
        queryClient.invalidateQueries({ queryKey: ["book-session-modal-provider-detail"] }),
        queryClient.invalidateQueries({ queryKey: ["provider-directory"] }),
        queryClient.invalidateQueries({ queryKey: ["provider-detail"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-bookings"] }),
        queryClient.invalidateQueries({ queryKey: ["consultations-bookings"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-listeners"] }),
        queryClient.invalidateQueries({ queryKey: ["wallet"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-shell-transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["user-me"] }),
      ]),
    [queryClient],
  );

  const bookingMutation = useMutation({
    mutationFn: async () => {
      const moodLabel =
        MOOD_OPTIONS.find((option) => option.id === mood)?.label ?? null;
      const trimmedNotes = notes.trim();

      if (
        !selectedProvider ||
        !selectedTherapistSlot ||
        therapistSlotDuration <= 0 ||
        sessionAmount <= 0 ||
        intakeChiefConcern.trim().length < 2
      ) {
        throw new Error("Pick a slot, complete intake, and confirm pricing.");
      }

      const intakeLines = [
        `Chief concern: ${intakeChiefConcern.trim()}`,
        intakeGoals.trim() && `Goals: ${intakeGoals.trim()}`,
        intakePriorTherapy.trim() && `Prior therapy: ${intakePriorTherapy.trim()}`,
        intakeSafetyNote.trim() && `Safety / access: ${intakeSafetyNote.trim()}`,
        trimmedNotes && `Notes: ${trimmedNotes}`,
      ].filter(Boolean) as string[];

      const intakeBlock = `Intake\n${intakeLines.join("\n")}`;
      const composedNote = truncateForNote(
        moodLabel ? `Mood: ${moodLabel}\n${intakeBlock}` : intakeBlock,
      );

      return apiMutation("/api/bookings", "POST", {
        providerId: selectedProvider.id,
        type: "THERAPIST",
        requestedDate: dateYmdToIsoNoonUtc(selectedTherapistSlot.date),
        requestedTime: selectedTherapistSlot.start,
        duration: therapistSlotDuration,
        amount: sessionAmount,
        paymentMethod: therapistPaymentMethod,
        note: composedNote,
      });
    },
    onSuccess: async () => {
      await invalidatePostBookingQueries();
      handleClose();
    },
    onError: () => {
      void queryClient.invalidateQueries({
        queryKey: ["book-session-modal-live-slots"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["book-session-modal-provider-detail"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["book-session-therapist-weekly-slots"],
      });
    },
  });


  const isLast = step === stepLabels.length - 1;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-100 bg-[#faf9f5] flex flex-col md:flex-row overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="book-session-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.35, ease: easeCalm }}
        >
          <aside
            className={
              isListenerCheckIn
                ? "flex w-full md:w-[300px] shrink-0 flex-col border-r border-[#e8e4dc] bg-[#f7f7f2] p-6 md:p-7 overflow-y-auto"
                : "flex w-full md:w-[280px] shrink-0 flex-col border-r border-accent/80 bg-[#f4f1ec] p-6 md:p-8 overflow-y-auto"
            }
          >
              <h2
                id="book-session-title"
                className={
                  isListenerCheckIn
                    ? "font-display text-lg font-semibold tracking-tight text-[#2f5d50] md:text-xl"
                    : "font-display text-xl font-semibold text-text-secondary md:text-2xl"
                }
              >
                Book Session
              </h2>

              <nav className={isListenerCheckIn ? "mt-10 flex flex-col gap-0" : "mt-8 flex flex-col gap-0"} aria-label="Booking steps">
                {stepLabels.map((label, index) => {
                  const active = index === step;
                  const done = index < step;
                  return (
                    <div key={label} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className={
                            isListenerCheckIn
                              ? `flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                                  active
                                    ? "bg-[#2f5d50] text-white shadow-sm"
                                    : done
                                      ? "bg-[#2f5d50]/85 text-white"
                                      : "border-2 border-neutral-200 bg-white text-neutral-400"
                                }`
                              : `flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                                  active
                                    ? "bg-text-secondary text-white"
                                    : done
                                      ? "bg-text-secondary/80 text-white"
                                      : "border-2 border-text-primary/20 bg-white text-text-primary/40"
                                }`
                          }
                        >
                          {index + 1}
                        </span>
                        {index < stepLabels.length - 1 ? (
                          <span
                            className={
                              isListenerCheckIn
                                ? "my-1.5 block min-h-[10px] w-px flex-1 bg-neutral-200"
                                : "my-1 block h-8 w-px bg-text-primary/15"
                            }
                            aria-hidden
                          />
                        ) : null}
                      </div>
                      <p
                        className={
                          isListenerCheckIn
                            ? `pb-8 text-sm font-semibold leading-snug ${
                                active ? "text-[#2f5d50]" : "text-neutral-400"
                              }`
                            : `pb-6 text-sm font-semibold leading-snug ${
                                active ? "text-text-secondary" : "text-text-primary/45"
                              }`
                        }
                      >
                        {label}
                      </p>
                    </div>
                  );
                })}
              </nav>

              <div
                className={
                  isListenerCheckIn
                    ? "mt-auto rounded-2xl bg-white p-4 shadow-[0_8px_30px_-12px_rgb(43_43_43/18%)] ring-1 ring-black/[0.05] md:p-5"
                    : "mt-auto rounded-gentle bg-primary/15 p-3 md:p-4"
                }
              >
                <p
                  className={
                    isListenerCheckIn
                      ? "text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500"
                      : "text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary"
                  }
                >
                  Your Healer
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <HealerAvatar healer={modalHealer} size={isListenerCheckIn ? "lg" : "md"} />
                  <div className="min-w-0">
                    <p
                      className={
                        isListenerCheckIn
                          ? "truncate font-display text-base font-semibold text-[#2b2b2b]"
                          : "truncate font-display text-base font-semibold text-text-secondary"
                      }
                    >
                      {modalHealer.name ?? "Choose a provider"}
                    </p>
                    <p
                      className={
                        isListenerCheckIn
                          ? "truncate text-xs font-medium text-[#2f5d50]"
                          : "truncate text-xs text-text-primary/60"
                      }
                    >
                      {modalHealer.specialty ?? "Provider directory"}
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            <div
              className={
                isListenerCheckIn
                  ? "flex min-w-0 flex-1 flex-col bg-white overflow-hidden"
                  : "flex min-w-0 flex-1 flex-col bg-white overflow-hidden"
              }
            >
              <div className="relative flex-1 overflow-y-auto overscroll-contain px-5 pb-4 pt-4 md:px-8 md:pt-5">
                <button
                  type="button"
                  onClick={handleClose}
                  className={
                    isListenerCheckIn
                      ? "absolute right-5 top-5 rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-[#2b2b2b]"
                      : "absolute right-4 top-4 rounded-full p-2 text-text-primary/45 transition-colors hover:bg-accent/50 hover:text-text-primary md:right-5 md:top-5"
                  }
                  aria-label="Close"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>

                {step === 0 ? (
                  <div className="pr-2 pt-2">
                    {effectiveProviderLocked ? (
                      <>
                        <h3
                          className={
                            isListenerCheckIn
                              ? "font-display text-3xl font-semibold tracking-tight text-[#2b2b2b] md:text-[2.15rem]"
                              : "font-display text-3xl font-semibold text-text-primary md:text-4xl"
                          }
                        >
                          How are you feeling today?
                        </h3>
                        <p
                          className={
                            isListenerCheckIn
                              ? "mt-2 max-w-xl text-sm leading-relaxed text-neutral-500 md:text-[15px]"
                              : "mt-2 max-w-xl text-sm text-text-primary/65 md:text-base"
                          }
                        >
                          Help us match your session energy with your current state of mind.
                        </p>

                        <div
                          className={
                            isListenerCheckIn
                              ? "mt-8 grid grid-cols-2 gap-3 sm:gap-3.5"
                              : "mt-8 flex flex-wrap gap-3"
                          }
                        >
                          {MOOD_OPTIONS.map((option) => {
                            const active = mood === option.id;
                            return (
                              <motion.button
                                key={option.id}
                                type="button"
                                onClick={() => setMood(option.id)}
                                className={
                                  isListenerCheckIn
                                    ? `relative flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left transition-colors duration-200 ${
                                        active
                                          ? "border-[#2f5d50] bg-[#eef4ef] shadow-[inset_0_0_0_1px_rgba(47,93,80,0.12)]"
                                          : "border-transparent bg-[#f3f3f1] hover:bg-[#ececea]"
                                      }`
                                    : `inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors duration-200 ${
                                        active
                                          ? "bg-[#cfe8d4] text-text-secondary ring-1 ring-text-secondary/30"
                                          : "bg-[#eae8e4] text-text-primary/65 hover:bg-accent/60"
                                      }`
                                }
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                transition={hoverLiftTransition}
                              >
                                <span
                                  className={
                                    isListenerCheckIn
                                      ? "text-2xl leading-none"
                                      : "text-base leading-none"
                                  }
                                  aria-hidden
                                >
                                  {option.emoji}
                                </span>
                                <span
                                  className={
                                    isListenerCheckIn
                                      ? "flex-1 text-sm font-semibold text-[#2b2b2b]"
                                      : "text-sm font-semibold"
                                  }
                                >
                                  {option.label}
                                </span>
                                {isListenerCheckIn ? (
                                  <span
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                                      active
                                        ? "border-[#2f5d50] bg-[#2f5d50]"
                                        : "border-neutral-300 bg-white"
                                    }`}
                                    aria-hidden
                                  >
                                    {active ? (
                                      <span className="h-2 w-2 rounded-full bg-white" />
                                    ) : null}
                                  </span>
                                ) : null}
                              </motion.button>
                            );
                          })}
                        </div>

                        {isListenerCheckIn && listenerCandidatesQuery.isLoading ? (
                          <p className="mt-6 text-xs text-text-primary/55">
                            Finding an available listener…
                          </p>
                        ) : null}
                        {isListenerCheckIn &&
                        !listenerCandidatesQuery.isLoading &&
                        (listenerCandidatesQuery.data?.length ?? 0) === 0 ? (
                          <p className="mt-6 rounded-gentle bg-[#fdf0ee] px-4 py-3 text-sm font-medium text-[#cf4f45]">
                            No listeners are online right now. Please try again in a few minutes.
                          </p>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <h3 className="font-display text-3xl font-semibold text-text-primary md:text-4xl">
                          Pick your therapist
                        </h3>
                        <p className="mt-2 max-w-xl text-sm text-text-primary/65 md:text-base">
                          Choose from approved therapists below. Looking to talk to a peer listener
                          instead? Open the live listener strip on your dashboard.
                        </p>

                        <div className="mt-8 flex items-center justify-between">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-primary/45">
                            Available Therapists
                          </p>
                          {!providersQuery.isLoading && !providersQuery.error ? (
                            <div className="flex items-center gap-2 text-xs font-semibold text-[#1f8a6e]">
                              <motion.span
                                className="inline-block h-2 w-2 rounded-full bg-[#22c997]"
                                animate={{ opacity: [0.6, 1, 0.6], scale: [0.9, 1.15, 0.9] }}
                                transition={{
                                  duration: 1.9,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                              />
                              <span>{filteredProviders.length} Available Now</span>
                            </div>
                          ) : null}
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {providersQuery.isLoading ? (
                            Array.from({ length: 4 }).map((_, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-3 rounded-calm border border-accent/70 bg-white px-3 py-3 shadow-soft"
                              >
                                <ProviderRowSkeleton />
                              </div>
                            ))
                          ) : providersQuery.error ? (
                            <div className="rounded-gentle bg-[#fdf0ee] px-4 py-4 text-sm font-medium text-[#cf4f45] sm:col-span-2">
                              {providersQuery.error.message}
                            </div>
                          ) : filteredProviders.length > 0 ? (
                            filteredProviders.map((provider, index) => {
                              const active = provider.id === resolvedSelectedProviderId;
                              const specialty =
                                provider.specializations[0] ??
                                provider.languages[0] ??
                                "Therapy support";

                              return (
                                <motion.button
                                  key={provider.id}
                                  type="button"
                                  onClick={() => setSelectedProviderId(provider.id)}
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{
                                    duration: 0.3,
                                    ease: easeCalm,
                                    delay: 0.04 + index * 0.03,
                                  }}
                                  whileHover={{ y: -3, transition: hoverLiftTransition }}
                                  className={`flex items-center gap-3 rounded-calm border px-3 py-3 text-left shadow-soft transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                                    active
                                      ? "border-text-secondary bg-primary/10 shadow-soft-hover"
                                      : "border-accent/70 bg-white hover:border-primary/30 hover:shadow-soft-hover"
                                  }`}
                                >
                                  <span className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e8f4ee] text-sm font-semibold text-text-secondary">
                                    {provider.image ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={provider.image}
                                        alt={provider.name ?? "Therapist"}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <span>{getInitials(provider.name)}</span>
                                    )}
                                    <span
                                      className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#22c997]"
                                      aria-hidden
                                    />
                                  </span>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-text-primary">
                                      {provider.name ?? "Verified therapist"}
                                    </p>
                                    <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-text-primary/55">
                                      {specialty}
                                    </p>
                                  </div>
                                </motion.button>
                              );
                            })
                          ) : (
                            <div className="rounded-calm border border-accent/70 bg-white px-4 py-3 text-sm text-text-primary/60 shadow-soft sm:col-span-2">
                              No therapists are available right now. Please try again in a few
                              minutes.
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <div className="mt-10">
                      <p
                        className={
                          isListenerCheckIn
                            ? "text-sm font-semibold text-[#2b2b2b]"
                            : "text-xs font-semibold uppercase tracking-[0.2em] text-text-primary/45"
                        }
                      >
                        Additional Notes
                      </p>
                      <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        rows={5}
                        placeholder={
                          effectiveProviderLocked
                            ? "Tell us more about your week… (Optional)"
                            : "Tell the provider what you'd like support with… (Optional)"
                        }
                        className={
                          isListenerCheckIn
                            ? "mt-2.5 w-full resize-y rounded-2xl border border-[#e8e4dc] bg-[#f5f5f3] px-4 py-3.5 text-sm text-[#2b2b2b] placeholder:text-neutral-400 focus:border-[#2f5d50]/40 focus:outline-none focus:ring-2 focus:ring-[#2f5d50]/15"
                            : "mt-2 w-full resize-y rounded-gentle border border-accent/80 bg-[#f4f3f1] px-4 py-3 text-sm text-text-primary placeholder:text-text-primary/35 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                        }
                      />
                    </div>
                  </div>
                ) : null}

                {step === 1 ? (
                  isListenerCheckIn ? (
                    <div className="mx-auto max-w-2xl pr-2 pt-2">
                      <h3 className="font-display text-3xl font-semibold tracking-tight text-[#2b2b2b] md:text-[2.15rem]">
                        Pick an open slot
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-neutral-500 md:text-[15px]">
                        Scheduling comes directly from the provider&apos;s published availability and
                        is checked live against other bookings.
                      </p>

                      {providerDetailQuery.isLoading ? (
                        <BookingCalendarSkeleton />
                      ) : providerDetailQuery.error ? (
                        <div className="mt-8 rounded-gentle bg-[#fdf0ee] px-4 py-4 text-sm font-medium text-[#cf4f45]">
                          {providerDetailQuery.error.message}
                        </div>
                      ) : availability.length === 0 ? (
                        <div className="mt-8 rounded-gentle bg-[#f4f3f1] px-4 py-4 text-sm text-text-primary/60">
                          This provider has not published availability yet.
                        </div>
                      ) : (
                        <div className="mt-6 grid gap-5 md:grid-cols-[1.05fr_1fr]">
                          <BookingCalendar
                            availabilities={availability as CalendarAvailabilityEntry[]}
                            selectedAvailabilityId={selectedAvailability?.id ?? null}
                            onSelect={(entry) => {
                              setSelectedAvailabilityId(entry.id);
                              setSelectedTime("");
                              setSelectedEndTime("");
                            }}
                          />

                          <div className="rounded-2xl border border-[#e8e4dc] bg-white p-4 shadow-[0_6px_28px_-14px_rgb(43_43_43/14%)] md:p-5">
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-primary/45">
                                Schedule
                              </p>
                              {liveSlotsQuery.isFetching ? (
                                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-primary/45">
                                  Refreshing…
                                </span>
                              ) : selectedAvailability ? (
                                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-primary/45">
                                  {selectedAvailability.timezone}
                                </span>
                              ) : null}
                            </div>

                            {selectedAvailability ? (
                              <p className="mt-1 text-sm font-semibold text-text-primary">
                                {formatShortDate(selectedAvailability.date)}
                              </p>
                            ) : (
                              <p className="mt-1 text-sm text-text-primary/55">
                                Pick a day from the calendar to see available hours.
                              </p>
                            )}

                            {liveSlotsQuery.error ? (
                              <div className="mt-4 rounded-gentle bg-[#fdf0ee] px-3 py-2 text-xs font-medium text-[#cf4f45]">
                                {liveSlotsQuery.error.message}
                              </div>
                            ) : null}

                            {availableWindows.length > 0 ? (
                              <>
                                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-primary/45">
                                  Available hours
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {availableWindows.map((window) => (
                                    <span
                                      key={`${window.start}-${window.end}`}
                                      className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-text-secondary"
                                    >
                                      {formatTimeLabel(window.start)} —{" "}
                                      {formatTimeLabel(window.end)}
                                    </span>
                                  ))}
                                </div>

                                <div className="mt-5 flex flex-wrap items-end gap-3">
                                  <label className="flex flex-col">
                                    <span className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-primary/45">
                                      Start
                                    </span>
                                    <input
                                      type="time"
                                      value={selectedTime}
                                      min={
                                        dayBounds ? formatMinutesToTime(dayBounds.min) : undefined
                                      }
                                      max={
                                        dayBounds
                                          ? formatMinutesToTime(dayBounds.max - MIN_SESSION_MINUTES)
                                          : undefined
                                      }
                                      step={300}
                                      onChange={(event) => setSelectedTime(event.target.value)}
                                      className="rounded-gentle border border-accent/60 bg-[#f8f7f4] px-3 py-2 text-sm font-semibold text-text-primary focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                                    />
                                  </label>
                                  <label className="flex flex-col">
                                    <span className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-primary/45">
                                      End
                                    </span>
                                    <input
                                      type="time"
                                      value={selectedEndTime}
                                      min={(() => {
                                        const start = parseTimeToMinutes(selectedTime);
                                        if (start === null) return undefined;
                                        return formatMinutesToTime(start + MIN_SESSION_MINUTES);
                                      })()}
                                      max={
                                        dayBounds ? formatMinutesToTime(dayBounds.max) : undefined
                                      }
                                      step={300}
                                      onChange={(event) => setSelectedEndTime(event.target.value)}
                                      className="rounded-gentle border border-accent/60 bg-[#f8f7f4] px-3 py-2 text-sm font-semibold text-text-primary focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                                    />
                                  </label>
                                  <div className="flex flex-col">
                                    <span className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-primary/45">
                                      Duration
                                    </span>
                                    <span className="inline-flex h-[38px] items-center rounded-gentle bg-[#f4f3f1] px-3 text-sm font-semibold text-text-primary/70">
                                      {bookingDuration > 0 ? `${bookingDuration} min` : "—"}
                                    </span>
                                  </div>
                                </div>

                                {customTimeStatus.state === "conflict" ? (
                                  <div className="mt-3 rounded-gentle bg-[#fdf0ee] px-3 py-2 text-xs font-medium text-[#cf4f45]">
                                    Conflicts with another session at{" "}
                                    {formatTimeLabel(customTimeStatus.conflict.start)} —{" "}
                                    {formatTimeLabel(customTimeStatus.conflict.end)}. Try a different
                                    time.
                                  </div>
                                ) : customTimeStatus.state === "out-of-window" ? (
                                  <div className="mt-3 rounded-gentle bg-[#fdf0ee] px-3 py-2 text-xs font-medium text-[#cf4f45]">
                                    Selected time falls outside the provider&apos;s available hours.
                                  </div>
                                ) : customTimeStatus.state === "too-short" ? (
                                  <div className="mt-3 rounded-gentle bg-[#fdf0ee] px-3 py-2 text-xs font-medium text-[#cf4f45]">
                                    End time must be at least {MIN_SESSION_MINUTES} minutes after
                                    start.
                                  </div>
                                ) : customTimeStatus.state === "valid" ? (
                                  <p className="mt-3 text-xs font-medium text-[#1f8a6e]">
                                    Looks good — this time is free.
                                  </p>
                                ) : null}

                                {activeBookingRanges.length > 0 ? (
                                  <div className="mt-4">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-primary/40">
                                      Already booked on this day
                                    </p>
                                    <ul className="mt-1 space-y-1 text-xs text-text-primary/55">
                                      {activeBookingRanges.map((range) => (
                                        <li
                                          key={`${range.start}-${range.end}`}
                                          className="rounded-full bg-[#f4f3f1] px-3 py-1"
                                        >
                                          {formatTimeLabel(range.start)} —{" "}
                                          {formatTimeLabel(range.end)}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : null}
                              </>
                            ) : selectedAvailability ? (
                              <div className="mt-4 rounded-gentle bg-[#f4f3f1] px-4 py-3 text-sm text-text-primary/60">
                                No available hours for this day. Try another date.
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mx-auto max-w-2xl pr-2 pt-2">
                      <h3 className="font-display text-3xl font-semibold text-text-primary md:text-4xl">
                        Pick a session slot
                      </h3>
                      <p className="mt-2 text-sm text-text-primary/65 md:text-base">
                        Times follow this therapist&apos;s weekly template and are checked live
                        against existing bookings.
                      </p>

                      {providerDetailQuery.isLoading ? (
                        <BookingCalendarSkeleton />
                      ) : providerDetailQuery.error ? (
                        <div className="mt-8 rounded-gentle bg-[#fdf0ee] px-4 py-4 text-sm font-medium text-[#cf4f45]">
                          {providerDetailQuery.error.message}
                        </div>
                      ) : (
                        <div className="mt-8 space-y-6 rounded-gentle border border-accent/70 bg-white p-5 shadow-soft md:p-6">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <label className="flex flex-col gap-1">
                              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-primary/45">
                                Date
                              </span>
                              <input
                                type="date"
                                value={weeklyDateKey}
                                min={formatLocalYmd(new Date())}
                                max={formatLocalYmd(
                                  new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                                )}
                                onChange={(event) => setWeeklyDateKey(event.target.value)}
                                className="rounded-gentle border border-accent/60 bg-[#f8f7f4] px-3 py-2 text-sm font-semibold text-text-primary focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                              />
                            </label>
                            {weeklySlotsQuery.data?.timezone ? (
                              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-primary/45">
                                Timezone: {weeklySlotsQuery.data.timezone}
                              </p>
                            ) : null}
                          </div>

                          {weeklySlotsQuery.isFetching ? (
                            <p className="text-xs font-semibold text-text-primary/55">
                              Refreshing slots…
                            </p>
                          ) : null}

                          {weeklySlotsQuery.error ? (
                            <div className="rounded-gentle bg-[#fdf0ee] px-3 py-2 text-xs font-medium text-[#cf4f45]">
                              {weeklySlotsQuery.error.message}
                            </div>
                          ) : null}

                          {weeklySlotsQuery.isLoading && !weeklySlotsQuery.data ? (
                            <TimeSlotGridSkeleton count={9} />
                          ) : weeklyFreeSlots.length > 0 ? (
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-primary/45">
                                Open slots
                              </p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {weeklyFreeSlots.map((slot) => {
                                  const selected =
                                    selectedTherapistSlot?.date === weeklyDateKey &&
                                    normalizeTimeToHHmm(selectedTherapistSlot.start) ===
                                      normalizeTimeToHHmm(slot.start) &&
                                    normalizeTimeToHHmm(selectedTherapistSlot.end) ===
                                      normalizeTimeToHHmm(slot.end);
                                  return (
                                    <button
                                      key={`${slot.start}-${slot.end}`}
                                      type="button"
                                      onClick={() =>
                                        setSelectedTherapistSlot({
                                          date: weeklyDateKey,
                                          start: normalizeTimeToHHmm(slot.start),
                                          end: normalizeTimeToHHmm(slot.end),
                                        })
                                      }
                                      className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                                        selected
                                          ? "bg-text-secondary text-white ring-2 ring-text-secondary/30"
                                          : "bg-primary/15 text-text-secondary hover:bg-primary/25"
                                      }`}
                                    >
                                      {formatTimeLabel(slot.start)} — {formatTimeLabel(slot.end)}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-gentle bg-[#f4f3f1] px-4 py-3 text-sm text-text-primary/60">
                              No open slots on this day. Try another date.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                ) : null}

                {step === 2 && isListenerCheckIn ? (
                  <div className="pr-2 pt-2">
                    <h3 className="font-display text-3xl font-semibold tracking-tight text-[#2b2b2b] md:text-[2.15rem]">
                      Review request
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-500 md:text-[15px]">
                      Confirm the provider, timing, and amount. Payment is deducted from your wallet
                      and held until the session is completed or cancelled.
                    </p>

                    <div className="mt-8 space-y-3 rounded-2xl border border-[#e8e4dc] bg-[#fafaf8] p-5 text-sm text-neutral-600 md:p-6">
                      <p>
                        <span className="font-semibold text-[#2f5d50]">With:</span>{" "}
                        {selectedProvider?.name ?? modalHealer.name ?? "Choose a provider"}
                      </p>
                      <p>
                        <span className="font-semibold text-[#2f5d50]">Role:</span>{" "}
                        {selectedProvider
                          ? toSentenceCase(selectedProvider.role)
                          : (modalHealer.specialty ?? "Provider directory")}
                      </p>
                      {selectedAvailability ? (
                        <p>
                          <span className="font-semibold text-[#2f5d50]">Date:</span>{" "}
                          {formatShortDate(selectedAvailability.date)}
                        </p>
                      ) : null}
                      {resolvedStart && resolvedEnd ? (
                        <p>
                          <span className="font-semibold text-[#2f5d50]">Time:</span>{" "}
                          {formatTimeLabel(resolvedStart)} — {formatTimeLabel(resolvedEnd)}
                        </p>
                      ) : null}
                      <p>
                        <span className="font-semibold text-[#2f5d50]">Duration:</span>{" "}
                        {bookingDuration > 0 ? `${bookingDuration} min` : "—"}
                      </p>
                      <p>
                        <span className="font-semibold text-[#2f5d50]">Amount:</span>{" "}
                        {sessionAmount > 0
                          ? formatCurrency(sessionAmount)
                          : selectedProvider?.hourlyRate
                            ? formatCurrency(selectedProvider.hourlyRate)
                            : "Pricing unavailable"}
                      </p>
                      {notes.trim() ? (
                        <p>
                          <span className="font-semibold text-[#2f5d50]">Notes:</span>{" "}
                          {notes}
                        </p>
                      ) : null}
                    </div>

                    {!selectedProvider?.hourlyRate ? (
                      <div className="mt-4 rounded-gentle bg-[#fdf0ee] px-4 py-4 text-sm text-[#cf4f45]">
                        This provider has not configured session pricing yet, so direct booking is
                        disabled for now.
                      </div>
                    ) : null}

                    {bookingMutation.error ? (
                      <div className="mt-4 rounded-gentle bg-[#fdf0ee] px-4 py-4 text-sm font-medium text-[#cf4f45]">
                        {bookingMutation.error.message}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {step === 2 && !isListenerCheckIn ? (
                  <div className="mx-auto max-w-2xl pr-2 pt-2">
                    <h3 className="font-display text-3xl font-semibold text-text-primary md:text-4xl">
                      Quick intake
                    </h3>
                    <p className="mt-2 text-sm text-text-primary/65 md:text-base">
                      A few details help your therapist prepare. This is shared with them as part of
                      your booking note.
                    </p>

                    <div className="mt-8 space-y-5">
                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-text-primary/45">
                          What brings you in? <span className="text-[#cf4f45]">*</span>
                        </span>
                        <textarea
                          value={intakeChiefConcern}
                          onChange={(event) => setIntakeChiefConcern(event.target.value)}
                          rows={4}
                          required
                          placeholder="In a sentence or two…"
                          className="mt-2 w-full resize-y rounded-gentle border border-accent/80 bg-[#f4f3f1] px-4 py-3 text-sm text-text-primary placeholder:text-text-primary/35 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                        />
                        {intakeChiefConcern.trim().length > 0 &&
                        intakeChiefConcern.trim().length < 2 ? (
                          <p className="mt-1 text-xs font-medium text-[#cf4f45]">
                            Please add a bit more detail.
                          </p>
                        ) : null}
                      </label>

                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-text-primary/45">
                          Goals for therapy (optional)
                        </span>
                        <textarea
                          value={intakeGoals}
                          onChange={(event) => setIntakeGoals(event.target.value)}
                          rows={3}
                          className="mt-2 w-full resize-y rounded-gentle border border-accent/80 bg-[#f4f3f1] px-4 py-3 text-sm text-text-primary placeholder:text-text-primary/35 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                        />
                      </label>

                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-text-primary/45">
                          Prior therapy (optional)
                        </span>
                        <textarea
                          value={intakePriorTherapy}
                          onChange={(event) => setIntakePriorTherapy(event.target.value)}
                          rows={2}
                          placeholder="Have you worked with a therapist before?"
                          className="mt-2 w-full resize-y rounded-gentle border border-accent/80 bg-[#f4f3f1] px-4 py-3 text-sm text-text-primary placeholder:text-text-primary/35 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                        />
                      </label>

                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-text-primary/45">
                          Safety or access needs (optional)
                        </span>
                        <textarea
                          value={intakeSafetyNote}
                          onChange={(event) => setIntakeSafetyNote(event.target.value)}
                          rows={2}
                          placeholder="Anything we should know to keep the session comfortable?"
                          className="mt-2 w-full resize-y rounded-gentle border border-accent/80 bg-[#f4f3f1] px-4 py-3 text-sm text-text-primary placeholder:text-text-primary/35 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                        />
                      </label>
                    </div>
                  </div>
                ) : null}

                {step === 3 && !isListenerCheckIn ? (
                  <div className="pr-2 pt-2">
                    <h3 className="font-display text-3xl font-semibold text-text-primary md:text-4xl">
                      Confirm &amp; pay
                    </h3>
                    <p className="mt-2 text-sm text-text-primary/65 md:text-base">
                      Pay from your wallet or complete a direct QR / card payment before the
                      booking request is sent to your therapist.
                    </p>

                    <motion.div className="mt-6 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-primary/45">
                        Payment method
                      </p>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {(
                          [
                            { id: "WALLET" as const, label: "Wallet", hint: "Uses healing points" },
                            { id: "QR" as const, label: "UPI / QR", hint: "Pay directly" },
                            { id: "CARD" as const, label: "Card", hint: "Pay directly" },
                          ] as const
                        ).map((option) => {
                          const active = therapistPaymentMethod === option.id;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => {
                                setTherapistPaymentMethod(option.id);
                                setExternalPaymentReady(option.id !== "WALLET");
                              }}
                              className={`rounded-gentle border px-4 py-3 text-left transition ${
                                active
                                  ? "border-text-secondary bg-text-secondary/10 ring-2 ring-text-secondary/20"
                                  : "border-accent/80 bg-white hover:border-primary/40"
                              }`}
                            >
                              <p className="text-sm font-semibold text-text-primary">{option.label}</p>
                              <p className="mt-1 text-xs text-text-primary/55">{option.hint}</p>
                            </button>
                          );
                        })}
                      </div>

                      {therapistPaymentMethod === "WALLET" ? (
                        <div className="rounded-gentle border border-accent/80 bg-background/80 px-4 py-3 text-sm text-text-primary/70">
                          <p>
                            Wallet balance:{" "}
                            <span className="font-semibold text-text-secondary">
                              {formatCurrency(walletAvailable)}
                            </span>
                          </p>
                          {walletAvailable < sessionAmount ? (
                            <p className="mt-2 text-[#cf4f45]">
                              You need {formatCurrency(sessionAmount - walletAvailable)} more.{" "}
                              <Link
                                href="/dashboard/wallet"
                                className="font-semibold underline underline-offset-2"
                              >
                                Top up wallet
                              </Link>
                            </p>
                          ) : (
                            <p className="mt-2 text-text-primary/55">
                              {formatCurrency(sessionAmount)} will be held until your session is
                              completed or cancelled.
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-gentle border border-accent/80 bg-background/80 px-4 py-4 text-sm text-text-primary/70">
                          <p>
                            {therapistPaymentMethod === "QR"
                              ? `Scan the sanctuary QR to pay ${formatCurrency(sessionAmount)}.`
                              : `Card checkout for ${formatCurrency(sessionAmount)}.`}{" "}
                            Confirm below once payment is complete (demo gateway).
                          </p>
                          <button
                            type="button"
                            onClick={() => setExternalPaymentReady(true)}
                            className="mt-3 rounded-full bg-text-secondary px-4 py-2 text-xs font-semibold text-white"
                          >
                            Confirm payment received
                          </button>
                        </div>
                      )}
                    </motion.div>

                    <div className="mt-8 space-y-3 rounded-gentle border border-accent/80 bg-background/80 p-5 text-sm text-text-primary/70">
                      <p>
                        <span className="font-semibold text-text-secondary">With:</span>{" "}
                        {selectedProvider?.name ?? modalHealer.name ?? "Choose a provider"}
                      </p>
                      <p>
                        <span className="font-semibold text-text-secondary">Role:</span>{" "}
                        {selectedProvider
                          ? toSentenceCase(selectedProvider.role)
                          : (modalHealer.specialty ?? "Therapist")}
                      </p>
                      {selectedTherapistSlot ? (
                        <p>
                          <span className="font-semibold text-text-secondary">Date:</span>{" "}
                          {formatShortDate(`${selectedTherapistSlot.date}T12:00:00`)}
                        </p>
                      ) : null}
                      {selectedTherapistSlot ? (
                        <p>
                          <span className="font-semibold text-text-secondary">Time:</span>{" "}
                          {formatTimeLabel(selectedTherapistSlot.start)} —{" "}
                          {formatTimeLabel(selectedTherapistSlot.end)}
                        </p>
                      ) : null}
                      <p>
                        <span className="font-semibold text-text-secondary">Duration:</span>{" "}
                        {therapistSlotDuration > 0 ? `${therapistSlotDuration} min` : "—"}
                      </p>
                      <p>
                        <span className="font-semibold text-text-secondary">Amount:</span>{" "}
                        {sessionAmount > 0
                          ? formatCurrency(sessionAmount)
                          : selectedProvider?.hourlyRate
                            ? formatCurrency(selectedProvider.hourlyRate)
                            : "Pricing unavailable"}
                      </p>
                      {intakeChiefConcern.trim() ? (
                        <p>
                          <span className="font-semibold text-text-secondary">Chief concern:</span>{" "}
                          {intakeChiefConcern.trim()}
                        </p>
                      ) : null}
                      {notes.trim() ? (
                        <p>
                          <span className="font-semibold text-text-secondary">Notes:</span>{" "}
                          {notes}
                        </p>
                      ) : null}
                    </div>

                    {!selectedProvider?.hourlyRate ? (
                      <div className="mt-4 rounded-gentle bg-[#fdf0ee] px-4 py-4 text-sm text-[#cf4f45]">
                        This provider has not configured session pricing yet, so direct booking is
                        disabled for now.
                      </div>
                    ) : null}

                    {bookingMutation.error ? (
                      <div className="mt-4 rounded-gentle bg-[#fdf0ee] px-4 py-4 text-sm font-medium text-[#cf4f45]">
                        {bookingMutation.error.message}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div
                className={
                  isListenerCheckIn
                    ? "flex items-center justify-between gap-4 border-t border-[#eceae4] bg-white px-6 py-5 md:px-8"
                    : "flex items-center justify-between gap-4 border-t border-accent/70 bg-white px-5 py-4 md:px-8"
                }
              >
                {isListenerCheckIn ? (
                  <>
                    {step > 0 ? (
                      <button
                        type="button"
                        onClick={() => setStep((current) => Math.max(0, current - 1))}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 transition-colors hover:text-[#2b2b2b]"
                      >
                        <span aria-hidden>←</span>
                        Back
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleClose}
                        className="text-sm font-semibold text-neutral-500 transition-colors hover:text-[#2b2b2b]"
                      >
                        Cancel
                      </button>
                    )}
                    <motion.button
                      type="button"
                      onClick={() => {
                        if (isLast) {
                          bookingMutation.mutate();
                          return;
                        }
                        setStep((current) => current + 1);
                      }}
                      disabled={!canAdvance || bookingMutation.isPending}
                      className="inline-flex items-center gap-2 rounded-full bg-[#2f5d50] px-7 py-3 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      transition={hoverLiftTransition}
                    >
                      {isLast
                        ? bookingMutation.isPending
                          ? "Submitting..."
                          : "Request Booking"
                        : "Next Step"}
                      {!isLast ? (
                        <span className="text-base leading-none" aria-hidden>
                          →
                        </span>
                      ) : null}
                    </motion.button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="text-sm font-semibold text-text-primary/55 transition-colors hover:text-text-primary"
                    >
                      Cancel
                    </button>
                    <div className="flex items-center gap-3">
                      {step > 0 ? (
                        <button
                          type="button"
                          onClick={() => setStep((current) => Math.max(0, current - 1))}
                          className="rounded-full border border-accent/90 px-5 py-2.5 text-sm font-semibold text-text-primary/75 transition-colors hover:bg-accent/40"
                        >
                          Back
                        </button>
                      ) : null}
                      <motion.button
                        type="button"
                        onClick={() => {
                          if (isLast) {
                            bookingMutation.mutate();
                            return;
                          }
                          setStep((current) => current + 1);
                        }}
                        disabled={!canAdvance || bookingMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-full bg-text-secondary px-6 py-2.5 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        transition={hoverLiftTransition}
                      >
                        {isLast
                          ? bookingMutation.isPending
                            ? "Submitting..."
                            : therapistPaymentMethod === "WALLET"
                              ? "Confirm & hold wallet"
                              : "Complete booking"
                          : "Next Step"}
                        {!isLast ? (
                          <span className="text-lg leading-none" aria-hidden>
                            →
                          </span>
                        ) : null}
                      </motion.button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {!isListenerCheckIn ? (
              <motion.div
                className="pointer-events-none absolute bottom-16 right-6 z-2 hidden max-w-[220px] rounded-gentle border border-accent/80 bg-white/95 p-3 text-xs text-text-primary/70 shadow-soft md:block"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...morphTransition, delay: 0.15 }}
              >
                <div className="flex items-start gap-2">
                  <span className="text-text-secondary" aria-hidden>
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    >
                      <path
                        d="M4 10v4a8 8 0 0012.5 6.5M8 8h.01M12 8h.01M16 8h.01"
                        strokeLinecap="round"
                      />
                      <path
                        d="M16 3l4 4-4 4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div>
                    <p className="font-semibold text-text-secondary">Live flow</p>
                    <p className="mt-0.5 leading-relaxed">
                      Therapist bookings support wallet, QR, or card payment. Listener bookings
                      always deduct from your wallet balance.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function BookSessionModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [healer, setHealer] = useState<BookSessionHealer>(EMPTY_HEALER);
  const [modalKey, setModalKey] = useState(0);

  const close = useCallback(() => setOpen(false), []);

  const openModal = useCallback((healerArg?: BookSessionHealer | null) => {
    setHealer(healerArg ?? EMPTY_HEALER);
    setModalKey((current) => current + 1);
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ open: openModal, close }), [openModal, close]);

  return (
    <BookSessionModalContext.Provider value={value}>
      {children}
      <BookSessionModal
        key={modalKey}
        open={open}
        onClose={close}
        requestedHealer={healer}
      />
    </BookSessionModalContext.Provider>
  );
}
