"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { easeCalm, morphTransition } from "@/components/ui/fade-in";
import { ListenerProfileFields, TherapistProfileFields } from "@/components/dashboard/provider-profile-fields";
import { defaultWeeklyAvailability } from "@/components/dashboard/professional-apply/weekly-availability-fields";
import { apiFetch, apiMutation } from "@/lib/api-client";
import {
  buildListenerProfilePayload,
  buildTherapistProfilePayload,
  listenerFormFromUser,
  therapistFormFromUser,
  weeklyFromScheduleRows,
} from "@/lib/provider-profile-form";
import type { ApiUser } from "@/types/api";

const TIMEZONES = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Singapore",
  "Australia/Sydney",
  "Pacific/Auckland",
];

function timezoneOptions(current?: string | null) {
  const t = current?.trim();
  if (t && !TIMEZONES.includes(t)) return [t, ...TIMEZONES];
  return TIMEZONES;
}

type ProfileEditModalProps = {
  open: boolean;
  onClose: () => void;
  user: ApiUser | null | undefined;
};

type ScheduleResponse = {
  windows: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    timezone?: string | null;
  }>;
};

export function ProfileEditModal({ open, onClose, user }: ProfileEditModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [primaryFocus, setPrimaryFocus] = useState("");
  const [interestRaw, setInterestRaw] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [providerErrors, setProviderErrors] = useState<Record<string, string>>({});

  const [therapistBio, setTherapistBio] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [certificationsRaw, setCertificationsRaw] = useState("");
  const [experienceYears, setExperienceYears] = useState("3");
  const [hourlyRate, setHourlyRate] = useState("1500");
  const [therapistWeekly, setTherapistWeekly] = useState(defaultWeeklyAvailability);
  const [profileDescription, setProfileDescription] = useState("");
  const [philosophyQuote, setPhilosophyQuote] = useState("");
  const [experienceDescription, setExperienceDescription] = useState("");
  const [testimonialQuote, setTestimonialQuote] = useState("");
  const [testimonialAuthor, setTestimonialAuthor] = useState("");
  const [retentionRate, setRetentionRate] = useState("");

  const [listenerBio, setListenerBio] = useState("");
  const [languagesRaw, setLanguagesRaw] = useState("");
  const [interestsRaw, setInterestsRaw] = useState("");
  const [listenerWeekly, setListenerWeekly] = useState(defaultWeeklyAvailability);

  const isTherapist = user?.role === "THERAPIST";
  const isListener = user?.role === "LISTENER";

  const scheduleQuery = useQuery({
    queryKey: ["profile-weekly-schedule", user?.id, user?.role],
    queryFn: async () => {
      if (user?.role === "THERAPIST") {
        return apiFetch<ScheduleResponse>("/api/therapist-availability");
      }
      if (user?.role === "LISTENER") {
        return apiFetch<ScheduleResponse>("/api/listener-availability");
      }
      return { windows: [] };
    },
    enabled: open && (isTherapist || isListener),
  });

  const scheduleHydratedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      scheduleHydratedRef.current = false;
      return;
    }
    if (!user) return;

    setName(user.name?.trim() ?? "");
    setBio(user.bio?.trim() ?? "");
    setPhone(user.phone?.trim() ?? "");
    setCity(user.city?.trim() ?? "");
    setTimezone(user.timezone?.trim() || "Asia/Kolkata");
    setPrimaryFocus(user.primaryFocus?.trim() ?? "");
    setInterestRaw((user.interestTags ?? []).join(", "));
    setFormError(null);
    setProviderErrors({});

    const fallbackWeekly = defaultWeeklyAvailability;
    if (user.role === "THERAPIST") {
      const t = therapistFormFromUser(user, fallbackWeekly);
      setTherapistBio(t.profileBio);
      setSpecialization(t.specialization);
      setCertificationsRaw(t.certificationsRaw);
      setExperienceYears(t.experienceYears);
      setHourlyRate(t.hourlyRate);
      setTherapistWeekly(t.weekly);
      setProfileDescription(t.profileDescription);
      setPhilosophyQuote(t.philosophyQuote);
      setExperienceDescription(t.experienceDescription);
      setTestimonialQuote(t.testimonialQuote);
      setTestimonialAuthor(t.testimonialAuthor);
      setRetentionRate(t.retentionRate);
    }

    if (user.role === "LISTENER") {
      const l = listenerFormFromUser(user, fallbackWeekly);
      setListenerBio(l.profileBio);
      setLanguagesRaw(l.languagesRaw);
      setInterestsRaw(l.interestsRaw);
      setListenerWeekly(l.weekly);
    }
  }, [open, user?.id]);

  useEffect(() => {
    if (!open || !user || !scheduleQuery.isSuccess || scheduleHydratedRef.current) return;

    const weekly = weeklyFromScheduleRows(scheduleQuery.data?.windows ?? []);
    if (!weekly.length) return;

    scheduleHydratedRef.current = true;

    if (user.role === "THERAPIST") {
      const t = therapistFormFromUser(user, weekly);
      setTherapistWeekly(t.weekly);
    }
    if (user.role === "LISTENER") {
      const l = listenerFormFromUser(user, weekly);
      setListenerWeekly(l.weekly);
    }
  }, [open, user, scheduleQuery.isSuccess, scheduleQuery.data]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const save = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        name: name.trim() || undefined,
        bio: bio.trim(),
        phone: phone.trim(),
        city: city.trim(),
        timezone: timezone.trim(),
        primaryFocus: primaryFocus.trim(),
        interestTags: interestRaw
          .split(/[,]/)
          .map((s) => s.trim())
          .filter(Boolean),
      };

      if (isTherapist) {
        const built = buildTherapistProfilePayload({
          profileBio: therapistBio,
          specialization,
          certificationsRaw,
          experienceYears,
          hourlyRate,
          weekly: therapistWeekly,
          profileDescription,
          philosophyQuote,
          experienceDescription,
          testimonialQuote,
          testimonialAuthor,
          retentionRate,
        });
        if (!built.ok) {
          setProviderErrors(built.errors);
          throw new Error("Please complete your therapist practice details.");
        }
        setProviderErrors({});
        body.therapistProfile = built.data;
      }

      if (isListener) {
        const built = buildListenerProfilePayload({
          profileBio: listenerBio,
          languagesRaw,
          interestsRaw,
          weekly: listenerWeekly,
        });
        if (!built.ok) {
          setProviderErrors(built.errors);
          throw new Error("Please complete your listener profile details.");
        }
        setProviderErrors({});
        body.listenerProfile = built.data;
      }

      return apiMutation<ApiUser>("/api/users/me", "PATCH", body);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user-me"] });
      await queryClient.invalidateQueries({ queryKey: ["profile-weekly-schedule"] });
      onClose();
    },
    onError: (err: Error) => {
      setFormError(err.message);
    },
  });

  if (!user) return null;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-[#0d2f2a]/40 px-4 py-8 backdrop-blur-[4px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: easeCalm }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-edit-title"
          onClick={onClose}
        >
          <motion.div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[1.25rem] border border-white/50 bg-[#fdfbf7] p-6 shadow-[0_24px_64px_-24px_rgb(13_47_42/45%)] sm:p-8"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.99 }}
            transition={morphTransition}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-text-primary/50 shadow-sm transition hover:text-text-primary"
              aria-label="Close"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 5l10 10M15 5L5 15" />
              </svg>
            </button>

            <h2 id="profile-edit-title" className="font-display text-2xl font-semibold text-[#2D5A4C]">
              Edit profile
            </h2>
            <p className="mt-1 text-sm text-text-primary/60">
              Update how you appear across Apna Healer. Your email stays the same for sign-in.
            </p>

            <div className="mt-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-text-primary/40">Common</h3>
                <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-text-primary/45">
                  Display name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-accent/80 bg-white px-3 py-2.5 text-sm text-text-primary focus:border-[#2D5A4C] focus:outline-none"
                    maxLength={120}
                    autoComplete="name"
                  />
                </label>
                <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-text-primary/45">
                  Bio
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="A short story about your healing journey…"
                    className="mt-1.5 w-full resize-y rounded-xl border border-accent/80 bg-white px-3 py-2.5 text-sm text-text-primary focus:border-[#2D5A4C] focus:outline-none"
                  />
                </label>
                <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-text-primary/45">
                  Primary focus
                  <input
                    value={primaryFocus}
                    onChange={(e) => setPrimaryFocus(e.target.value)}
                    placeholder="e.g. Mindfulness · Anxiety support"
                    className="mt-1.5 w-full rounded-xl border border-accent/80 bg-white px-3 py-2.5 text-sm text-text-primary focus:border-[#2D5A4C] focus:outline-none"
                    maxLength={160}
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-text-primary/45">
                    Phone
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-accent/80 bg-white px-3 py-2.5 text-sm text-text-primary focus:border-[#2D5A4C] focus:outline-none"
                      maxLength={32}
                      inputMode="tel"
                      autoComplete="tel"
                    />
                  </label>
                  <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-text-primary/45">
                    City / region
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-accent/80 bg-white px-3 py-2.5 text-sm text-text-primary focus:border-[#2D5A4C] focus:outline-none"
                      maxLength={120}
                      autoComplete="address-level2"
                    />
                  </label>
                </div>
                <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-text-primary/45">
                  Timezone
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-accent/80 bg-white px-3 py-2.5 text-sm text-text-primary focus:border-[#2D5A4C] focus:outline-none"
                  >
                    {timezoneOptions(user.timezone).map((tz) => (
                      <option key={tz} value={tz}>
                        {tz.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-text-primary/45">
                  Interests (comma separated)
                  <input
                    value={interestRaw}
                    onChange={(e) => setInterestRaw(e.target.value)}
                    placeholder="Mindfulness, Inner calm, Restore"
                    className="mt-1.5 w-full rounded-xl border border-accent/80 bg-white px-3 py-2.5 text-sm text-text-primary focus:border-[#2D5A4C] focus:outline-none"
                  />
                </label>
              </div>

              {isTherapist ? (
                <TherapistProfileFields
                  profileBio={therapistBio}
                  onProfileBio={setTherapistBio}
                  specialization={specialization}
                  onSpecialization={setSpecialization}
                  certificationsRaw={certificationsRaw}
                  onCertificationsRaw={setCertificationsRaw}
                  experienceYears={experienceYears}
                  onExperienceYears={setExperienceYears}
                  hourlyRate={hourlyRate}
                  onHourlyRate={setHourlyRate}
                  weekly={therapistWeekly}
                  onWeekly={setTherapistWeekly}
                  profileDescription={profileDescription}
                  onProfileDescription={setProfileDescription}
                  philosophyQuote={philosophyQuote}
                  onPhilosophyQuote={setPhilosophyQuote}
                  experienceDescription={experienceDescription}
                  onExperienceDescription={setExperienceDescription}
                  testimonialQuote={testimonialQuote}
                  onTestimonialQuote={setTestimonialQuote}
                  testimonialAuthor={testimonialAuthor}
                  onTestimonialAuthor={setTestimonialAuthor}
                  retentionRate={retentionRate}
                  onRetentionRate={setRetentionRate}
                  errors={providerErrors}
                />
              ) : null}

              {isListener ? (
                <ListenerProfileFields
                  profileBio={listenerBio}
                  onProfileBio={setListenerBio}
                  languagesRaw={languagesRaw}
                  onLanguagesRaw={setLanguagesRaw}
                  interestsRaw={interestsRaw}
                  onInterestsRaw={setInterestsRaw}
                  weekly={listenerWeekly}
                  onWeekly={setListenerWeekly}
                  errors={providerErrors}
                />
              ) : null}
            </div>

            {formError ? (
              <p className="mt-4 text-sm font-semibold text-[#cf4f45]">{formError}</p>
            ) : null}

            <div className="mt-8 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={save.isPending}
                className="rounded-full border border-accent px-5 py-2.5 text-sm font-semibold text-text-primary/75 transition hover:bg-white disabled:opacity-50"
              >
                Cancel
              </button>
              <motion.button
                type="button"
                disabled={save.isPending || !name.trim()}
                onClick={() => {
                  setFormError(null);
                  save.mutate();
                }}
                className="rounded-full bg-[#2D5A4C] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50"
                whileHover={{ scale: save.isPending ? 1 : 1.02 }}
                whileTap={{ scale: save.isPending ? 1 : 0.98 }}
              >
                {save.isPending ? "Saving…" : "Save changes"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
