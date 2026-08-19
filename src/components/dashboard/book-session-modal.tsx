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
import { MatchingLoader } from "@/components/dashboard/matching-loader";

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
  initialBookingOption?: "SESSION" | "PACKAGE";
  initialPackageId?: string;
};

const EMPTY_HEALER: BookSessionHealer = {};
const STEP_LABELS_LOCKED = ["Booking Type", "Your Mood", "Scheduling", "Checkout"] as const;

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
  const [usePackage, setUsePackage] = useState(false);

  const formatWhen = useCallback(() => {
    if (!selectedTherapistSlot) return "—";
    try {
      const d = new Date(`${selectedTherapistSlot.date}T12:00:00`);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const day = d.getDate();
      const month = d.toLocaleDateString("en-US", { month: "short" });
      return `${dayName}, ${day} ${month} · ${formatTimeLabel(selectedTherapistSlot.start)} IST`;
    } catch (e) {
      return `${selectedTherapistSlot.date} · ${formatTimeLabel(selectedTherapistSlot.start)}`;
    }
  }, [selectedTherapistSlot]);

  // Selector Option: "SESSION" | "PACKAGE"
  const [selectedBookingOption, setSelectedBookingOption] = useState<"SESSION" | "PACKAGE" >("SESSION");
  const [selectedPackageToBuy, setSelectedPackageToBuy] = useState<any | null>(null);
  const [hasSetInitialPackage, setHasSetInitialPackage] = useState(false);
  const [showLoaderMode, setShowLoaderMode] = useState<"therapist" | "listener" | null>(null);

  const handleClose = useCallback(() => {
    setShowLoaderMode(null);
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
    setUsePackage(false);
    setSelectedBookingOption("SESSION");
    setSelectedPackageToBuy(null);
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

  const therapistPackagesQuery = useQuery({
    queryKey: ["booking-modal-therapist-packages", resolvedSelectedProviderId],
    queryFn: () => apiFetch<any[]>(`/api/packages?providerId=${resolvedSelectedProviderId}`),
    enabled: open && !!resolvedSelectedProviderId,
  });

  const adminPackagesQuery = useQuery({
    queryKey: ["booking-modal-admin-packages"],
    queryFn: () => apiFetch<any[]>(`/api/packages`),
    enabled: open,
  });

  const packagePurchaseMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPackageToBuy) throw new Error("No package selected");
      return apiMutation(`/api/packages/${selectedPackageToBuy.id}/purchase`, "POST");
    },
    onSuccess: async () => {
      await invalidatePostBookingQueries();
      handleClose();
    },
  });

  const skipSlotResetRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    setHasSetInitialPackage(false);

    if (requestedHealer.initialBookingOption === "PACKAGE") {
      setSelectedBookingOption("PACKAGE");
      setStep(1); // Go directly to Select Package (step 1)
    } else if (requestedHealer.preselection) {
      setSelectedBookingOption("SESSION");
      setStep(4); // Go directly to Confirm & Pay (step 4)
      skipSlotResetRef.current = true;
      setWeeklyDateKey(requestedHealer.preselection.dateYmd);
      setSelectedTherapistSlot({
        date: requestedHealer.preselection.dateYmd,
        start: normalizeTimeToHHmm(requestedHealer.preselection.start),
        end: normalizeTimeToHHmm(requestedHealer.preselection.end),
      });
    } else {
      setSelectedBookingOption("SESSION");
      setStep(0);
    }

    if (requestedHealer.providerId) {
      setSelectedProviderId(requestedHealer.providerId);
    }

    if (requestedHealer.initialNote?.trim()) {
      setNotes(requestedHealer.initialNote.trim());
    }
  }, [open, requestedHealer]);

  useEffect(() => {
    if (!open || !requestedHealer.initialPackageId || hasSetInitialPackage) return;

    const allPkgs = [
      ...(therapistPackagesQuery.data ?? []),
      ...(adminPackagesQuery.data ?? []),
    ];
    const match = allPkgs.find((pkg) => pkg.id === requestedHealer.initialPackageId);
    if (match) {
      setSelectedPackageToBuy(match);
      setSelectedBookingOption("PACKAGE");
      setStep(2); // Go directly to Confirm & Pay for package
      setHasSetInitialPackage(true);
    }
  }, [
    open,
    requestedHealer.initialPackageId,
    therapistPackagesQuery.data,
    adminPackagesQuery.data,
    hasSetInitialPackage,
  ]);

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
      (step === 2 || (step === 1 && !!requestedHealer.preselection)),
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

  const activePackage = useMemo(() => {
    const purchases = userMeQuery.data?.packagePurchases ?? [];
    return purchases.find((p: any) => {
      const isExpired = p.expiryDate ? new Date(p.expiryDate) < new Date() : false;
      const isActive = p.status === "ACTIVE";
      const matchesProvider = p.package.providerId === resolvedSelectedProviderId || p.package.providerId === null;
      const hasRemaining = p.allocations.some((a: any) => a.role === "THERAPIST" && a.remainingSessions > 0);
      return isActive && !isExpired && matchesProvider && hasRemaining;
    });
  }, [userMeQuery.data?.packagePurchases, resolvedSelectedProviderId]);

  // Sidebar Stepper labels dynamically map to the active choice pathway
  const stepLabels = useMemo((): readonly string[] => {
    if (selectedBookingOption === "PACKAGE") {
      return ["Booking Type", "Select Package", "Confirm & Pay"];
    }

    if (isListenerCheckIn) {
      return STEP_LABELS_LOCKED;
    }
    if (effectiveProviderLocked) {
      return ["Booking Type", "Your Mood", "Schedule", "Intake", "Confirm & Pay"];
    }
    return ["Booking Type", "Select Therapist", "Schedule", "Intake", "Confirm & Pay"];
  }, [selectedBookingOption, effectiveProviderLocked, isListenerCheckIn]);

  const canAdvance = useMemo(() => {
    if (step === 0) {
      return !!selectedBookingOption;
    }

    if (selectedBookingOption === "PACKAGE") {
      if (step === 1) {
        return !!selectedPackageToBuy;
      }
      if (step === 2) {
        const pricePaid = Number(selectedPackageToBuy?.price || 0) - Number(selectedPackageToBuy?.price || 0) * (Number(selectedPackageToBuy?.discount || 0) / 100);
        return walletAvailable >= pricePaid;
      }
      return false;
    }

    // Single Session Flow Step Check
    if (step === 1) {
      return !!resolvedSelectedProviderId && (effectiveProviderLocked ? !!mood : true);
    }
    if (step === 2) {
      if (isListenerCheckIn) {
        return !!selectedAvailability && customTimeStatus.state === "valid";
      }
      return !!selectedTherapistSlot;
    }
    if (step === 3) {
      if (isListenerCheckIn) {
        return (
          !!selectedProvider?.hourlyRate &&
          Number(selectedProvider.hourlyRate) > 0 &&
          sessionAmount > 0
        );
      }
      return intakeChiefConcern.trim().length >= 2;
    }
    if (step === 4) {
      const priced =
        (!!selectedProvider?.hourlyRate &&
        Number(selectedProvider.hourlyRate) > 0 &&
        sessionAmount > 0) || usePackage;
      if (!priced) return false;
      if (usePackage) return true;
      if (therapistPaymentMethod === "WALLET") {
        return walletAvailable >= sessionAmount;
      }
      return externalPaymentReady;
    }
    return false;
  }, [
    step,
    selectedBookingOption,
    selectedPackageToBuy,
    walletAvailable,
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
    therapistPaymentMethod,
    usePackage,
  ]);

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
        sessionAmount <= 0
      ) {
        throw new Error("Pick a slot and confirm pricing.");
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
        amount: usePackage ? 0 : sessionAmount,
        paymentMethod: usePackage ? "WALLET" : therapistPaymentMethod,
        usePackage,
        note: composedNote,
      });
    },
    onSuccess: async () => {
      await invalidatePostBookingQueries();
      setShowLoaderMode("therapist");
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
            aria-labelledby="book-session-title"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.35, ease: easeCalm }}
          >
          {showLoaderMode !== null ? (
            <MatchingLoader
              open={showLoaderMode !== null}
              mode={showLoaderMode}
              inline={true}
              onCancel={() => {
                setShowLoaderMode(null);
                handleClose();
              }}
              onComplete={() => {
                setShowLoaderMode(null);
                handleClose();
              }}
            />
          ) : (
            <>
              <aside
                className="hidden md:flex w-full md:w-[280px] shrink-0 flex-col border-r border-accent/80 bg-[#f4f1ec] p-6 md:p-8 overflow-y-auto"
              >
            <h2
              id="book-session-title"
              className="font-display text-xl font-semibold text-text-secondary md:text-2xl"
            >
              Book Session
            </h2>

            <nav className="mt-8 flex flex-col gap-0" aria-label="Booking steps">
              {stepLabels.map((label, index) => {
                const active = index === step;
                const done = index < step;
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
                        {index + 1}
                      </span>
                      {index < stepLabels.length - 1 ? (
                        <span
                          className="my-1 block h-8 w-px bg-text-primary/15"
                          aria-hidden
                        />
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
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">
                Your Healer
              </p>
              <div className="mt-3 flex items-center gap-3">
                <HealerAvatar healer={modalHealer} size="md" />
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-semibold text-text-secondary">
                    {modalHealer.name ?? "Choose a provider"}
                  </p>
                  <p className="truncate text-xs text-text-primary/60">
                    {modalHealer.specialty ?? "Provider directory"}
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col bg-white overflow-hidden">
            {/* Mobile Header (sticky at the top, hidden on desktop) */}
            <div className="flex flex-col border-b border-accent/60 bg-[#f4f1ec] px-5 py-3.5 md:hidden">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-text-secondary">
                  {selectedBookingOption === "PACKAGE" ? "Buy Package" : "Book Session"}
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
                {stepLabels.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      idx <= step ? "bg-text-secondary" : "bg-text-primary/10"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-[10px] font-bold text-text-primary/45 uppercase tracking-wider">
                  Step {step + 1} of {stepLabels.length}: {stepLabels[step]}
                </p>
              </div>
              
              {/* Your Healer Banner (shown below the progress bar in mobile header) */}
              <div className="mt-3 flex items-center gap-3 border-t border-accent/40 pt-2.5">
                <HealerAvatar healer={modalHealer} size="md" />
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-text-primary/40">
                    Your Healer
                  </p>
                  <p className="truncate text-xs font-bold text-text-secondary">
                    {modalHealer.name ?? "Choose a provider"}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative flex-1 overflow-y-auto overscroll-contain px-5 pb-4 pt-4 md:px-8 md:pt-5">
              <button
                type="button"
                onClick={handleClose}
                className="hidden md:block absolute right-4 top-4 rounded-full p-2 text-text-primary/45 transition-colors hover:bg-accent/50 hover:text-text-primary md:right-5 md:top-5"
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

              {/* STEP 0: Selection / Choice */}
              {step === 0 ? (
                <div className="mx-auto max-w-2xl pr-2 pt-2 text-left">
                  <h3 className="font-display text-3xl font-semibold text-text-primary md:text-4xl">
                    Choose booking type
                  </h3>
                  <p className="mt-2 text-sm text-text-primary/65 md:text-base">
                    Would you like to book a single one-on-one session or purchase a wellness package?
                  </p>

                  <div className="mt-8 grid gap-6 sm:grid-cols-2">
                    {/* Option 1: Book Individually */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBookingOption("SESSION");
                        setSelectedPackageToBuy(null); // Clear package selection
                        setStep(1); // Auto-advance to next step
                      }}
                      className={`flex flex-col items-start rounded-3xl border p-6 text-left transition duration-300 shadow-soft cursor-pointer ${
                        selectedBookingOption === "SESSION"
                          ? "border-text-secondary bg-text-secondary/[0.03] ring-2 ring-text-secondary/20 shadow-soft-hover"
                          : "border-accent/80 bg-white hover:border-primary/30 hover:shadow-soft-hover"
                      }`}
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-text-secondary">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </span>
                      <h4 className="font-display text-lg font-bold text-text-primary mt-5">
                        Book Individually
                      </h4>
                      <p className="mt-2 text-xs text-text-primary/60 leading-relaxed">
                        Book a single one-on-one consultation slot with your therapist and fill out a quick intake form.
                      </p>
                      <span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-text-secondary">
                        Start Session Flow →
                      </span>
                    </button>

                    {/* Option 2: Package Session */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBookingOption("PACKAGE");
                        // Clear session selection details
                        setSelectedTherapistSlot(null);
                        setIntakeChiefConcern("");
                        setIntakeGoals("");
                        setIntakePriorTherapy("");
                        setIntakeSafetyNote("");
                        setMood(null);
                        setNotes("");
                        setStep(1); // Auto-advance to next step
                      }}
                      className={`flex flex-col items-start rounded-3xl border p-6 text-left transition duration-300 shadow-soft cursor-pointer ${
                        selectedBookingOption === "PACKAGE"
                          ? "border-[#2f745f] bg-[#2f745f]/[0.03] ring-2 ring-[#2f745f]/20 shadow-soft-hover"
                          : "border-accent/80 bg-white hover:border-[#2f745f]/30 hover:shadow-soft-hover"
                      }`}
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef6eb] text-[#2f745f]">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </span>
                      <h4 className="font-display text-lg font-bold text-text-primary mt-5">
                        Package Session
                      </h4>
                      <p className="mt-2 text-xs text-text-primary/60 leading-relaxed">
                        Purchase a discounted bundle of sessions with your therapist or general admin wellness packages.
                      </p>
                      <span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-[#2f745f]">
                        View Available Packages →
                      </span>
                    </button>
                  </div>
                </div>
              ) : null}

              {/* STEP 1: Package Selection (if PACKAGE) or Mood/Therapist Selection (if SESSION) */}
              {step === 1 ? (
                selectedBookingOption === "PACKAGE" ? (
                  /* PACKAGE SELECTION BLOCK */
                  <div className="mx-auto max-w-2xl pr-2 pt-2 text-left">
                    <h3 className="font-display text-2xl font-semibold text-text-primary md:text-3xl">
                      Select a Wellness Package
                    </h3>
                    <p className="mt-1 text-xs text-text-primary/65 leading-relaxed">
                      Choose a multi-session bundle to save on consultations.
                    </p>

                    <div className="mt-6 space-y-6">
                      {therapistPackagesQuery.isLoading || adminPackagesQuery.isLoading ? (
                        <TimeSlotGridSkeleton count={3} />
                      ) : null}

                      {/* Therapist Specific Packages */}
                      {resolvedSelectedProviderId && (therapistPackagesQuery.data?.length ?? 0) > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2f745f] bg-[#eef6eb] px-3 py-1.5 rounded-lg inline-block">
                            Packages by {modalHealer.name}
                          </p>
                          <div className="mt-3 grid gap-4 sm:grid-cols-2">
                            {therapistPackagesQuery.data?.map((pkg) => {
                              const originalPrice = Number(pkg.price);
                              const discountPercent = Number(pkg.discount || 0);
                              const finalPrice = originalPrice - originalPrice * (discountPercent / 100);
                              const totalSessions = pkg.allocations?.reduce((sum: number, a: any) => sum + a.sessionCount, 0) ?? 0;
                              const active = selectedPackageToBuy?.id === pkg.id;

                              return (
                                <button
                                  key={pkg.id}
                                  type="button"
                                  onClick={() => setSelectedPackageToBuy(pkg)}
                                  className={`border rounded-calm p-4 text-left transition flex flex-col justify-between h-40 w-full cursor-pointer ${
                                    active
                                      ? "border-[#2f745f] bg-[#2f745f]/5"
                                      : "border-accent/70 bg-white hover:border-[#2f745f]/40"
                                  }`}
                                >
                                  <div>
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#2f745f] bg-[#eef6eb] px-2 py-0.5 rounded">
                                      {totalSessions} Sessions
                                    </span>
                                    <h4 className="font-display text-sm font-bold text-text-primary mt-1.5 truncate w-full">{pkg.title}</h4>
                                    <p className="text-[11px] text-text-primary/65 leading-snug line-clamp-2 mt-1">{pkg.description}</p>
                                  </div>
                                  <div className="mt-3 border-t border-accent/40 pt-3 flex items-center justify-between w-full">
                                    <div>
                                      <span className="font-display text-base font-bold text-text-primary">
                                        ₹{finalPrice}
                                      </span>
                                    </div>
                                    <span className={`text-[10px] font-bold rounded-full px-3 py-1 ${
                                      active ? "bg-[#2f745f] text-white" : "bg-accent/40 text-text-primary"
                                    }`}>
                                      {active ? "Selected" : "Select"}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* General Admin Packages */}
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-primary/45">
                          General Packages
                        </p>
                        <div className="mt-3 grid gap-4 sm:grid-cols-2">
                          {(adminPackagesQuery.data ?? []).map((pkg) => {
                            const originalPrice = Number(pkg.price);
                            const discountPercent = Number(pkg.discount || 0);
                            const finalPrice = originalPrice - originalPrice * (discountPercent / 100);
                            const totalSessions = pkg.allocations?.reduce((sum: number, a: any) => sum + a.sessionCount, 0) ?? 0;
                            const active = selectedPackageToBuy?.id === pkg.id;

                            return (
                              <button
                                key={pkg.id}
                                type="button"
                                onClick={() => setSelectedPackageToBuy(pkg)}
                                className={`border rounded-calm p-4 text-left transition flex flex-col justify-between h-40 w-full cursor-pointer ${
                                  active
                                    ? "border-text-secondary bg-text-secondary/5"
                                    : "border-accent/70 bg-white hover:border-[#2f745f]/40"
                                }`}
                              >
                                <div>
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-text-primary/50 bg-[#faf9f6] px-2 py-0.5 rounded border border-accent">
                                    {totalSessions} Sessions
                                  </span>
                                  <h4 className="font-display text-sm font-bold text-text-primary mt-1.5 truncate w-full">{pkg.title}</h4>
                                  <p className="text-[11px] text-text-primary/65 leading-snug line-clamp-2 mt-1">{pkg.description}</p>
                                </div>
                                <div className="mt-3 border-t border-accent/40 pt-3 flex items-center justify-between w-full">
                                  <div>
                                    <span className="font-display text-base font-bold text-text-primary">
                                      ₹{finalPrice}
                                    </span>
                                  </div>
                                  <span className={`text-[10px] font-bold rounded-full px-3 py-1 ${
                                    active ? "bg-text-secondary text-white" : "bg-accent/40 text-text-primary"
                                  }`}>
                                    {active ? "Selected" : "Select"}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ORIGINAL SINGLE SESSION FLOW - STEP 0 */
                  <div className="mx-auto max-w-2xl pr-2 pt-2 text-left">
                    {effectiveProviderLocked ? (
                      <>
                        <h3 className="font-display text-3xl font-semibold text-text-primary md:text-4xl">
                          Mood check-in
                        </h3>
                        <p className="mt-2 text-sm text-text-primary/65 md:text-base">
                          How are you feeling today? This helps us check in on your general wellness
                          before the session.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                          {MOOD_OPTIONS.map((option) => {
                            const active = mood === option.id;
                            return (
                              <motion.button
                                key={option.id}
                                type="button"
                                onClick={() => setMood(option.id)}
                                whileHover={{ y: -2, transition: hoverLiftTransition }}
                                whileTap={{ scale: 0.97 }}
                                className={`flex items-center gap-2.5 rounded-full border px-5 py-3 text-sm font-semibold transition-[border-color,box-shadow,background-color] duration-300 shadow-soft ${
                                  active
                                    ? "border-text-secondary bg-text-secondary text-white shadow-soft-hover"
                                    : "border-accent/80 bg-white hover:border-primary/30 hover:shadow-soft-hover"
                                }`}
                              >
                                <span className="text-lg leading-none" aria-hidden>
                                  {option.emoji}
                                </span>
                                <span>{option.label}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className="font-display text-3xl font-semibold text-text-primary md:text-4xl">
                          Pick your therapist
                        </h3>
                        <p className="mt-2 max-w-xl text-sm text-text-primary/65 md:text-base">
                          Choose from approved therapists below.
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
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-primary/45">
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
                        className="mt-2 w-full resize-y rounded-gentle border border-accent/80 bg-[#f4f3f1] px-4 py-3 text-sm text-text-primary placeholder:text-text-primary/35 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                      />
                    </div>
                  </div>
                )
              ) : null}

              {/* STEP 2: Time Slots Scheduling (if SESSION) or Package Checkout (if PACKAGE) */}
              {step === 2 ? (
                selectedBookingOption === "PACKAGE" && selectedPackageToBuy ? (
                  /* PACKAGE PURCHASE CONFIRMATION */
                  <div className="mx-auto max-w-2xl pr-2 pt-2 text-left">
                    <h3 className="font-display text-3xl font-semibold text-text-primary md:text-4xl">
                      Confirm Package Purchase
                    </h3>
                    <p className="mt-2 text-sm text-text-primary/65 md:text-base">
                      Complete payment to activate this package bundle. The price will be deducted from your wallet balance.
                    </p>

                    <div className="mt-8 space-y-6">
                      <div className="border border-accent/70 rounded-calm p-6 bg-white shadow-soft">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#2f745f] bg-[#eef6eb] px-2 py-0.5 rounded">
                          {selectedPackageToBuy.allocations?.reduce((sum: number, a: any) => sum + a.sessionCount, 0) ?? 0} Sessions
                        </span>
                        <h4 className="font-display text-xl font-bold text-text-primary mt-3">{selectedPackageToBuy.title}</h4>
                        <p className="text-sm text-text-primary/65 mt-2 leading-relaxed">{selectedPackageToBuy.description}</p>
                        
                        <div className="mt-5 border-t border-accent/40 pt-4 flex justify-between items-center text-sm font-semibold">
                          <span className="text-text-primary/60">Validity Period</span>
                          <span className="capitalize">{selectedPackageToBuy.durationValue} {selectedPackageToBuy.durationUnit.toLowerCase()}(s)</span>
                        </div>
                      </div>

                      <div className="rounded-gentle border border-accent bg-background px-4 py-3.5 text-sm text-text-primary/70">
                        <div className="flex justify-between items-center">
                          <span>Wallet Balance:</span>
                          <span className="font-semibold text-text-secondary">
                            {formatCurrency(walletAvailable)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-accent/40 font-bold text-base">
                          <span>Price to Pay:</span>
                          <span className="text-text-secondary">
                            {formatCurrency(
                              Number(selectedPackageToBuy.price) - 
                              Number(selectedPackageToBuy.price) * (Number(selectedPackageToBuy.discount || 0) / 100)
                            )}
                          </span>
                        </div>

                        {walletAvailable < (Number(selectedPackageToBuy.price) - Number(selectedPackageToBuy.price) * (Number(selectedPackageToBuy.discount || 0) / 100)) ? (
                          <p className="mt-3 text-[#cf4f45] text-xs font-semibold leading-relaxed">
                            Insufficient wallet balance. Please{" "}
                            <Link href="/dashboard/wallet" className="underline font-bold">
                              top up your wallet
                            </Link>{" "}
                            to buy this package.
                          </p>
                        ) : (
                          <p className="mt-3 text-text-primary/55 text-xs">
                            Upon clicking purchase, the final price will be deducted from your wallet balance.
                          </p>
                        )}
                      </div>

                      {packagePurchaseMutation.isError && (
                        <p className="text-xs font-semibold text-[#cf4f45] bg-[#fdf0ee] border border-red-200 rounded-xl p-3">
                          {(packagePurchaseMutation.error as any)?.message || "Failed to purchase package."}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  /* ORIGINAL SINGLE SESSION FLOW - STEP 1 (Schedule) */
                  <div className="mx-auto max-w-2xl pr-2 pt-2 text-left">
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

              {/* STEP 3: Intake Questions (if SESSION) */}
              {step === 3 && selectedBookingOption === "SESSION" ? (
                <div className="mx-auto max-w-2xl pr-2 pt-2 text-left">
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

              {/* STEP 4: Confirm & Pay (if SESSION) */}
              {step === 4 && selectedBookingOption === "SESSION" ? (
                !selectedProvider?.id ? (
                  <div className="py-10">
                    <p className="text-center font-display text-lg font-semibold text-text-primary mb-4">
                      Finding the perfect healer for you...
                    </p>
                    <MatchingLoader
                      open={true}
                      mode="therapist"
                      inline={true}
                      onCancel={() => handleClose()}
                      onComplete={() => {
                        handleClose();
                      }}
                    />
                  </div>
                ) : (
                  <div className="mx-auto max-w-2xl pr-2 pt-2 text-left">
                    {/* Green/Cream Details Card */}
                    <div className="rounded-3xl bg-[#f4f7f4] border border-[#d0e0d0]/40 p-6">
                      <div className="flex items-center gap-4">
                        <HealerAvatar healer={modalHealer} size="lg" />
                        <div className="min-w-0">
                          <h3 className="font-display text-xl font-bold text-text-secondary">
                            {selectedProvider.name ?? modalHealer.name ?? "Your Healer"}
                          </h3>
                          <p className="text-xs text-text-primary/65 mt-0.5">
                            {selectedProvider.specializations?.join(", ") ?? modalHealer.specialty ?? "Clinical Psychologist"} · {selectedProvider.languages?.join(" / ") ?? "English"}
                          </p>
                        </div>
                      </div>

                      <hr className="border-[#d0e0d0]/60 my-4" />

                      <div className="space-y-3.5 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-text-primary/65">Session</span>
                          <span className="font-semibold text-text-secondary">
                            {usePackage ? "Package session" : "One session"} · {therapistSlotDuration > 0 ? `${therapistSlotDuration} minutes` : "50 minutes"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-text-primary/65">When</span>
                          <span className="font-semibold text-text-secondary">
                            {formatWhen()}
                          </span>
                        </div>
                      </div>

                      <hr className="border-[#d0e0d0]/60 my-4" />

                      <div className="flex justify-between items-center">
                        <span className="font-display text-base font-semibold text-text-secondary">Total</span>
                        <span className="font-display text-2xl font-bold text-text-secondary">
                          {usePackage ? (
                            "Covered"
                          ) : (
                            formatCurrency(sessionAmount)
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Pay with Options */}
                    {!usePackage && (
                      <div className="mt-6">
                        <h4 className="font-semibold text-sm text-text-primary">Pay with</h4>
                        <div className="grid grid-cols-3 gap-3 mt-3">
                          {(
                            [
                              { 
                                id: "WALLET" as const, 
                                label: "Apna Wallet", 
                                hint: `Balance ${formatCurrency(walletAvailable)}`,
                                icon: (
                                  <svg className="w-5 h-5 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="16" rx="2" />
                                    <path d="M16 10h4v4h-4z" />
                                  </svg>
                                )
                              },
                              { 
                                id: "CARD" as const, 
                                label: "Card", 
                                hint: "Visa •••• 4218",
                                icon: (
                                  <svg className="w-5 h-5 text-text-primary/65" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="5" width="20" height="14" rx="2" />
                                    <line x1="2" y1="10" x2="22" y2="10" />
                                  </svg>
                                )
                              },
                              { 
                                id: "QR" as const, 
                                label: "UPI / QR", 
                                hint: "Scan to pay",
                                icon: (
                                  <svg className="w-5 h-5 text-text-primary/65" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="7" height="7" />
                                    <rect x="14" y="3" width="7" height="7" />
                                    <rect x="3" y="14" width="7" height="7" />
                                    <rect x="14" y="14" width="7" height="7" />
                                  </svg>
                                )
                              },
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
                                className={`flex flex-col items-start gap-2.5 rounded-2xl border p-4 text-left cursor-pointer transition ${
                                  active
                                    ? "border-emerald-600 bg-emerald-50/10 ring-2 ring-emerald-600/10"
                                    : "border-accent/80 bg-white hover:border-emerald-600/50"
                                }`}
                              >
                                {option.icon}
                                <div>
                                  <p className="text-xs font-bold text-text-primary">{option.label}</p>
                                  <p className="mt-0.5 text-[10px] text-text-primary/50 font-medium">{option.hint}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {therapistPaymentMethod === "WALLET" ? (
                          walletAvailable < sessionAmount && (
                            <div className="mt-4 rounded-2xl bg-[#fdf0ee] border border-red-200 px-4 py-3 text-xs text-[#cf4f45]">
                              You need {formatCurrency(sessionAmount - walletAvailable)} more.{" "}
                              <Link
                                href="/dashboard/wallet"
                                className="font-semibold underline underline-offset-2"
                              >
                                Top up wallet
                              </Link>
                            </div>
                          )
                        ) : (
                          <div className="mt-4 rounded-2xl bg-[#faf9f6] border border-accent/80 px-4 py-4 text-xs text-text-primary/70 flex justify-between items-center">
                            <span>
                              {therapistPaymentMethod === "QR"
                                ? `Scan the sanctuary QR to pay ${formatCurrency(sessionAmount)}.`
                                : `Card checkout for ${formatCurrency(sessionAmount)}.`}
                            </span>
                            <button
                              type="button"
                              onClick={() => setExternalPaymentReady(true)}
                              className="rounded-full bg-text-secondary px-3.5 py-1.5 text-[10px] font-bold text-white shadow-xs cursor-pointer hover:bg-text-secondary/90 transition"
                            >
                              {externalPaymentReady ? "Payment confirmed" : "Confirm payment"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Disclaimer */}
                    <div className="flex items-center gap-2 mt-5 text-[11px] text-text-primary/50 justify-center">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                      <span>Payments are encrypted. Your intake notes stay between you and your therapist.</span>
                    </div>

                    {bookingMutation.error ? (
                      <div className="mt-4 rounded-gentle bg-[#fdf0ee] px-4 py-4 text-sm font-medium text-[#cf4f45]">
                        {bookingMutation.error.message}
                      </div>
                    ) : null}
                  </div>
                )
              ) : null}
            </div>

            {!(step === 4 && selectedBookingOption === "SESSION" && !selectedProvider?.id) && (
              <div className="flex items-center justify-between gap-4 border-t border-accent/70 bg-white px-5 py-4 md:px-8">
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
                    onClick={() => {
                      setStep((current) => Math.max(0, current - 1));
                    }}
                    className="rounded-full border border-accent/90 px-5 py-2.5 text-sm font-semibold text-text-primary/75 transition-colors hover:bg-accent/40"
                  >
                    Back
                  </button>
                ) : null}
                <motion.button
                  type="button"
                  onClick={() => {
                    if (isLast) {
                      if (selectedBookingOption === "PACKAGE") {
                        packagePurchaseMutation.mutate();
                      } else {
                        bookingMutation.mutate();
                      }
                      return;
                    }
                    setStep((current) => current + 1);
                  }}
                  disabled={!canAdvance || bookingMutation.isPending || packagePurchaseMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-full bg-text-secondary px-6 py-2.5 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  transition={hoverLiftTransition}
                >
                  {isLast
                    ? bookingMutation.isPending || packagePurchaseMutation.isPending
                      ? "Submitting..."
                      : selectedBookingOption === "PACKAGE"
                        ? "Confirm Purchase"
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
            </div>
            )}
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
            </>
          )}
        </motion.div>
      </> ) : null}
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
