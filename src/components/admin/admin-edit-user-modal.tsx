"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { UserAvatarCircle } from "@/components/dashboard/user-avatar-circle";
import {
  WeeklyAvailabilityFields,
  defaultWeeklyAvailability,
} from "@/components/dashboard/professional-apply/weekly-availability-fields";
import { easeCalm, morphTransition } from "@/components/ui/fade-in";
import { TherapistLandingFields } from "@/components/dashboard/provider-profile-fields";
import { apiFetch, apiMutation } from "@/lib/api-client";
import { toSentenceCase } from "@/lib/display";
import {
  buildListenerProfilePayload,
  buildTherapistProfilePayload,
  listenerFormFromUser,
  listenerProfileLooksComplete,
  splitCommaList,
  therapistFormFromUser,
  therapistProfileLooksComplete,
  weeklyFromScheduleRows,
} from "@/lib/provider-profile-form";
import type { ApiUser, UserRole } from "@/types/api";

type ScheduleResponse = {
  windows: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    timezone?: string | null;
  }>;
};

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

const ROLES: UserRole[] = ["USER", "THERAPIST", "LISTENER", "ADMIN"];

const fieldLabel =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]";
const fieldInput =
  "mt-2 w-full rounded-xl border border-theme-muted bg-theme-surface-muted px-3.5 py-2.5 text-sm text-theme-heading outline-none transition placeholder:text-[#b1a89d] focus:border-[#2f6f5b] focus:bg-white focus:ring-2 focus:ring-[#2f6f5b]/12";

type AdminEditUserModalProps = {
  open: boolean;
  user: ApiUser | null;
  onClose: () => void;
};

function timezoneOptions(current?: string | null) {
  const t = current?.trim();
  if (t && !TIMEZONES.includes(t)) return [t, ...TIMEZONES];
  return TIMEZONES;
}

function formatUserBadgeId(user: ApiUser) {
  const tail = user.id.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
  const initials = (user.name || user.email || "U")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  if (tail.length >= 6) {
    return `${tail.slice(0, 3)}-${tail.slice(3, 6)}-${initials}`;
  }
  return `${tail}-${initials}`;
}

function SectionHeading({
  icon,
  title,
  aside,
}: {
  icon: ReactNode;
  title: string;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-wrap items-center justify-between gap-2 border-b border-theme-muted pb-3">
      <motion.div variants={itemVariants} className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f4ee] text-theme-status-success">
          {icon}
        </span>
        <h3 className={fieldLabel}>{title}</h3>
      </motion.div>
      {aside}
    </div>
  );
}

function TagInput({
  tags,
  onChange,
  placeholder = "Add tag…",
  error,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  error?: string;
}) {
  const [draft, setDraft] = useState("");

  const addTag = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    if (tags.some((t) => t.toLowerCase() === value.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...tags, value]);
    setDraft("");
  };

  return (
    <div>
      <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f4ee] px-3 py-1.5 text-[13px] font-medium text-[#1f5c4a]"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="rounded-full p-0.5 text-theme-status-success/70 transition hover:bg-[#d4ebe0] hover:text-[#0f5147]"
              aria-label={`Remove ${tag}`}
            >
              <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
                <path
                  d="M2 2l8 8M10 2L2 10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag(draft);
            } else if (e.key === "Backspace" && !draft && tags.length) {
              onChange(tags.slice(0, -1));
            }
          }}
          onBlur={() => addTag(draft)}
          placeholder={tags.length ? "" : placeholder}
          className="min-w-[88px] flex-1 rounded-full border border-dashed border-[#c9c2b6] bg-transparent px-3 py-1.5 text-sm text-theme-heading outline-none focus:border-[#2f6f5b] focus:bg-white"
        />
        <button
          type="button"
          onClick={() => addTag(draft)}
          className="rounded-full border border-dashed border-[#c9c2b6] px-3 py-1.5 text-[12px] font-semibold text-[#5c574f] transition hover:border-[#2f6f5b] hover:text-theme-status-success"
        >
          + Add
        </button>
      </motion.div>
      {error ? <p className="mt-1.5 text-xs font-medium text-theme-status-error">{error}</p> : null}
    </div>
  );
}

function VerifiedToggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center justify-between gap-3 rounded-xl border border-theme-muted bg-theme-surface-muted px-4 py-3 text-left transition ${
        disabled ? "cursor-not-allowed opacity-60" : "hover:border-[#c9c2b6]"
      }`}
    >
      <span className="flex items-center gap-2.5 text-sm font-medium text-[#3d3832]">
        <svg viewBox="0 0 20 20" className="h-4 w-4 text-theme-status-success" aria-hidden>
          <path
            fill="currentColor"
            d="M10 1.5l2.2 4.5 4.9.7-3.55 3.5.84 4.9L10 13.2l-4.39 2.4.84-4.9L2.9 6.7l4.9-.7L10 1.5z"
          />
        </svg>
        Verified status
      </span>
      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? "bg-theme-button-primary" : "bg-[#d5cfc4]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.04 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: morphTransition,
  },
} as const;

function AdminEditUserFormInner({ user, onClose }: { user: ApiUser; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isSelf = session?.user?.id === user.id;

  const [name, setName] = useState(user.name?.trim() ?? "");
  const [email, setEmail] = useState(user.email?.trim() ?? "");
  const [role, setRole] = useState<UserRole>(user.role);
  const [isVerified, setIsVerified] = useState(user.isVerified);
  const [bio, setBio] = useState(user.bio?.trim() ?? "");
  const [phone, setPhone] = useState(user.phone?.trim() ?? "");
  const [city, setCity] = useState(user.city?.trim() ?? "");
  const [timezone, setTimezone] = useState(user.timezone?.trim() || "Asia/Kolkata");
  const [primaryFocus, setPrimaryFocus] = useState(user.primaryFocus?.trim() ?? "");
  const [interestRaw, setInterestRaw] = useState((user.interestTags ?? []).join(", "));
  const [formError, setFormError] = useState<string | null>(null);
  const [providerErrors, setProviderErrors] = useState<Record<string, string>>({});

  const [therapistBio, setTherapistBio] = useState("");
  const [specializationTags, setSpecializationTags] = useState<string[]>([]);
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
  const [languageTags, setLanguageTags] = useState<string[]>([]);
  const [strengthTags, setStrengthTags] = useState<string[]>([]);
  const [listenerWeekly, setListenerWeekly] = useState(defaultWeeklyAvailability);

  const roleChanged = role !== user.role;
  const needsTherapistProfile =
    role === "THERAPIST" && (roleChanged || !therapistProfileLooksComplete(user.therapistProfile));
  const needsListenerProfile =
    role === "LISTENER" && (roleChanged || !listenerProfileLooksComplete(user.listenerProfile));

  const providerHint = useMemo(() => {
    if (needsTherapistProfile) {
      return "Assigning or updating a therapist requires fees, education, and session timings.";
    }
    if (needsListenerProfile) {
      return "Assigning or updating a listener requires interests, languages, and availability.";
    }
    return null;
  }, [needsTherapistProfile, needsListenerProfile]);

  const scheduleHydratedRef = useRef(false);
  const badgeId = useMemo(() => formatUserBadgeId(user), [user]);

  const scheduleQuery = useQuery({
    queryKey: ["admin-user-weekly-schedule", user.id, user.role],
    queryFn: () =>
      apiFetch<ScheduleResponse>(`/api/admin/users/${user.id}/weekly-schedule`),
    enabled: role === "THERAPIST" || role === "LISTENER",
  });

  useEffect(() => {
    scheduleHydratedRef.current = false;
    setName(user.name?.trim() ?? "");
    setEmail(user.email?.trim() ?? "");
    setRole(user.role);
    setIsVerified(user.isVerified);
    setBio(user.bio?.trim() ?? "");
    setPhone(user.phone?.trim() ?? "");
    setCity(user.city?.trim() ?? "");
    setTimezone(user.timezone?.trim() || "Asia/Kolkata");
    setPrimaryFocus(user.primaryFocus?.trim() ?? "");
    setInterestRaw((user.interestTags ?? []).join(", "));
    setFormError(null);
    setProviderErrors({});

    const fallbackWeekly = defaultWeeklyAvailability;
    const t = therapistFormFromUser(user, fallbackWeekly);
    setTherapistBio(t.profileBio);
    setSpecializationTags(splitCommaList(t.specialization));
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

    const l = listenerFormFromUser(user, fallbackWeekly);
    setListenerBio(l.profileBio);
    setLanguageTags(splitCommaList(l.languagesRaw));
    setStrengthTags(splitCommaList(l.interestsRaw));
    setListenerWeekly(l.weekly);
  }, [user.id]);

  useEffect(() => {
    if (!scheduleQuery.isSuccess || scheduleHydratedRef.current) return;
    const weekly = weeklyFromScheduleRows(scheduleQuery.data.windows ?? []);
    if (!weekly.length) return;

    scheduleHydratedRef.current = true;

    if (role === "THERAPIST" || user.role === "THERAPIST") {
      const t = therapistFormFromUser(user, weekly);
      setTherapistWeekly(t.weekly);
    }
    if (role === "LISTENER" || user.role === "LISTENER") {
      const l = listenerFormFromUser(user, weekly);
      setListenerWeekly(l.weekly);
    }
  }, [scheduleQuery.isSuccess, scheduleQuery.data, user, role]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const save = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: isSelf ? undefined : role,
        isVerified,
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

      if (role === "THERAPIST" && (needsTherapistProfile || user.role === "THERAPIST")) {
        const profileBio =
          therapistBio.trim() || bio.trim() || user.bio?.trim() || "Professional therapist on Apna Healer.";
        const built = buildTherapistProfilePayload({
          profileBio,
          specialization: specializationTags.join(", "),
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
          throw new Error("Complete therapist practice details before saving.");
        }
        setProviderErrors({});
        body.therapistProfile = built.data;
      }

      if (role === "LISTENER" && (needsListenerProfile || user.role === "LISTENER")) {
        const profileBio = listenerBio.trim() || bio.trim() || "Listener on Apna Healer.";
        const built = buildListenerProfilePayload({
          profileBio,
          languagesRaw: languageTags.join(", "),
          interestsRaw: strengthTags.join(", "),
          weekly: listenerWeekly,
        });
        if (!built.ok) {
          setProviderErrors(built.errors);
          throw new Error("Complete listener profile details before saving.");
        }
        setProviderErrors({});
        body.listenerProfile = built.data;
      }

      return apiMutation<ApiUser>(`/api/admin/users/${user.id}`, "PATCH", body);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-user-weekly-schedule", user.id] }),
      ]);
      onClose();
    },
    onError: (err: Error) => {
      setFormError(err.message);
    },
  });

  const displayName = name.trim() || user.name?.trim() || "Unnamed user";

  return (
    <motion.div
      className="fixed inset-0 z-95 flex items-center justify-center bg-[#0d2f2a]/40 px-4 py-8 backdrop-blur-[4px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: easeCalm }}
      role="presentation"
      onClick={onClose}
    >
      <motion.div
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[1.35rem] border border-white/60 bg-white shadow-[0_28px_80px_-24px_rgb(13_47_42/50%)]"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.99 }}
        transition={morphTransition}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-edit-user-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-theme-muted px-6 pb-5 pt-6 sm:px-8">
          <div className="flex items-start gap-4">
            <motion.div variants={itemVariants} className="relative shrink-0">
              <UserAvatarCircle
                name={user.name}
                email={user.email}
                image={user.image}
                className="h-[72px] w-[72px]"
                roundedClassName="rounded-full"
                fallbackClassName="bg-linear-to-br from-[#d9ebe2] to-[#9bc4ae] text-xl font-semibold text-[#0d2f2a]"
              />
              <span
                className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-theme-button-primary text-white shadow-sm"
                aria-hidden
              >
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 2l3 3-8 8H3v-3l8-8z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </motion.div>

            <motion.div variants={itemVariants} className="min-w-0 flex-1 pt-1">
              <h2
                id="admin-edit-user-title"
                className="font-display text-[22px] font-semibold tracking-tight text-theme-heading sm:text-2xl"
              >
                Edit User Profile
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-[15px] font-semibold text-[#3d3832]">{displayName}</span>
                <span className="rounded-md bg-[#f0ebe3] px-2 py-0.5 font-mono text-[11px] font-medium text-[#6a655d]">
                  {badgeId}
                </span>
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f4ee] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#1f5c4a]">
                    <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
                      <path
                        fill="currentColor"
                        d="M10 3.5L5 9 2.5 6.5l1-1L5 7l4-4.5 1 1z"
                      />
                    </svg>
                    Verified user
                  </span>
                ) : null}
              </div>
            </motion.div>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-2 text-[#8a8278] transition hover:bg-[#f4f0ea] hover:text-theme-heading"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {isSelf ? (
            <p className="mt-4 rounded-xl bg-[#eef6f1] px-3 py-2 text-xs text-theme-status-success">
              You cannot change your own role here. Another admin can adjust roles if needed.
            </p>
          ) : null}
        </div>

        <motion.div
          className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <section className="space-y-5">
            <SectionHeading
              icon={
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                  <path d="M10 10a3.5 3.5 0 100-7 3.5 3.5 0 000 7zm0 1.75c-2.33 0-7 1.17-7 3.5V17h14v-1.75c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
              }
              title="Account identity"
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className={fieldLabel}>Full name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={fieldInput}
                  autoComplete="off"
                />
              </label>

              <label className="block">
                <span className={fieldLabel}>Email address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fieldInput}
                  autoComplete="off"
                />
                <p className="mt-1.5 text-[11px] text-[#8a8278]">
                  Must be a valid organizational or personal email.
                </p>
              </label>

              <label className="block">
                <span className={fieldLabel}>Platform role</span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  disabled={isSelf}
                  className={`${fieldInput} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {toSentenceCase(r)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="block">
                <span className={fieldLabel}>Verified status</span>
                <div className="mt-2">
                  <VerifiedToggle checked={isVerified} onChange={setIsVerified} />
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 space-y-5">
            <SectionHeading
              icon={
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                  <path d="M4 4h12v2H4V4zm0 5h12v2H4V9zm0 5h8v2H4v-2z" />
                </svg>
              }
              title="Profile details"
            />

            <motion.div className="space-y-4 rounded-2xl border border-theme-muted bg-[#faf8f5] p-5">
                  <label className="block">
                    <span className={fieldLabel}>Bio</span>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      className={`${fieldInput} resize-y`}
                    />
                  </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={fieldLabel}>Phone</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={fieldInput}
                    autoComplete="tel"
                  />
                </label>
                <label className="block">
                  <span className={fieldLabel}>City / region</span>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={fieldInput}
                  />
                </label>
              </div>
              <label className="block">
                <span className={fieldLabel}>Timezone</span>
                <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className={fieldInput}
                    >
                      {timezoneOptions(user.timezone).map((tz) => (
                        <option key={tz} value={tz}>
                          {tz.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className={fieldLabel}>Primary focus</span>
                    <input
                      value={primaryFocus}
                      onChange={(e) => setPrimaryFocus(e.target.value)}
                      className={fieldInput}
                    />
                  </label>
                  <label className="block">
                    <span className={fieldLabel}>Interest tags</span>
                    <input
                      value={interestRaw}
                      onChange={(e) => setInterestRaw(e.target.value)}
                      placeholder="Comma-separated"
                      className={fieldInput}
                    />
                  </label>
            </motion.div>
          </section>

          {providerHint ? (
            <p className="mt-6 rounded-xl bg-[#eef6f1] px-4 py-2.5 text-xs font-medium text-theme-status-success">
              {providerHint}
            </p>
          ) : null}

          {role === "THERAPIST" ? (
            <section className="mt-8 space-y-5 rounded-2xl border border-theme-muted bg-[#f5f3ef] p-5 sm:p-6">
              <SectionHeading
                icon={
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                    <path d="M6 2h8l2 4v12H4V6l2-4zm1 0v4h6V2H7zm-1 6h8v2H6V8zm0 4h5v2H6v-2z" />
                  </svg>
                }
                title="Therapist profile"
              />

              <label className="block">
                <span className={fieldLabel}>Professional bio</span>
                <textarea
                  value={therapistBio}
                  onChange={(e) => setTherapistBio(e.target.value)}
                  rows={3}
                  className={`${fieldInput} resize-y`}
                  placeholder="How you work and who you support."
                />
                {providerErrors.bio ? (
                  <p className="mt-1 text-xs text-theme-status-error">{providerErrors.bio}</p>
                ) : null}
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className={fieldLabel}>Hourly rate (INR)</span>
                  <input
                    type="number"
                    min={1}
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className={fieldInput}
                  />
                  {providerErrors.hourlyRate ? (
                    <p className="mt-1 text-xs text-theme-status-error">{providerErrors.hourlyRate}</p>
                  ) : null}
                </label>
                <label className="block">
                  <span className={fieldLabel}>Years of experience</span>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className={fieldInput}
                  />
                  {providerErrors.experienceYears ? (
                    <p className="mt-1 text-xs text-theme-status-error">{providerErrors.experienceYears}</p>
                  ) : null}
                </label>
              </div>

              <div>
                <span className={fieldLabel}>Specializations (tags)</span>
                <div className="mt-2">
                  <TagInput
                    tags={specializationTags}
                    onChange={setSpecializationTags}
                    placeholder="e.g. Cognitive Behavioral"
                    error={providerErrors.specialization}
                  />
                </div>
              </div>

              <label className="block">
                <span className={fieldLabel}>Certifications &amp; external links</span>
                <textarea
                  value={certificationsRaw}
                  onChange={(e) => setCertificationsRaw(e.target.value)}
                  rows={3}
                  placeholder="MSc Clinical Psychology, Board Certified B-201, LinkedIn: in/username"
                  className={`${fieldInput} resize-y`}
                />
                {providerErrors.certifications ? (
                  <p className="mt-1 text-xs text-theme-status-error">{providerErrors.certifications}</p>
                ) : null}
              </label>

              <div className="rounded-xl border border-theme-muted bg-white/60 p-4">
                <p className={fieldLabel}>Session timings</p>
                <div className="mt-3">
                  <WeeklyAvailabilityFields
                    value={therapistWeekly}
                    onChange={setTherapistWeekly}
                    errorMessage={
                      providerErrors["weeklyAvailability"] ??
                      providerErrors["weeklyAvailability.0"]
                    }
                  />
                </div>
              </div>
            </section>
          ) : null}

          {role === "THERAPIST" ? (
            <section className="mt-8 rounded-2xl border border-theme-muted bg-[#f5f3ef] p-5 sm:p-6">
              <SectionHeading
                icon={
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                    <path d="M4 3h12v2H4V3zm0 4h12v2H4V7zm0 4h8v2H4v-2zm8 4h4v2h-4v-2z" />
                  </svg>
                }
                title="Public landing page"
              />
              <div className="mt-5">
                <TherapistLandingFields
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
                  labelClassName={`block ${fieldLabel}`}
                  inputClassName={fieldInput}
                  wrapSection={false}
                />
              </div>
            </section>
          ) : null}

          {role === "LISTENER" ? (
            <section className="mt-8 space-y-5 rounded-2xl border border-theme-muted bg-[#f5f3ef] p-5 sm:p-6">
              <SectionHeading
                icon={
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                    <path d="M10 2a6 6 0 00-6 6v3.5L2 14v2h16v-2l-2-2.5V8a6 6 0 00-6-6zm0 2a4 4 0 014 4v4.1l1 1.25V14H5v-2.65l1-1.25V8a4 4 0 014-4z" />
                  </svg>
                }
                title="Listener profile"
              />

              <label className="block">
                <span className={fieldLabel}>Professional bio</span>
                <textarea
                  value={listenerBio}
                  onChange={(e) => setListenerBio(e.target.value)}
                  rows={3}
                  className={`${fieldInput} resize-y`}
                />
                {providerErrors.bio ? (
                  <p className="mt-1 text-xs text-theme-status-error">{providerErrors.bio}</p>
                ) : null}
              </label>

              <div>
                <span className={fieldLabel}>Languages</span>
                <div className="mt-2">
                  <TagInput
                    tags={languageTags}
                    onChange={setLanguageTags}
                    placeholder="e.g. English"
                    error={providerErrors.languages}
                  />
                </div>
              </div>

              <div>
                <span className={fieldLabel}>Strengths &amp; interests</span>
                <div className="mt-2">
                  <TagInput
                    tags={strengthTags}
                    onChange={setStrengthTags}
                    placeholder="e.g. Active listening"
                    error={providerErrors.emotionalStrengths}
                  />
                </div>
              </div>


              <div className="rounded-xl border border-theme-muted bg-white/60 p-4">
                <p className={fieldLabel}>Availability timings</p>
                <div className="mt-3">
                  <WeeklyAvailabilityFields
                    value={listenerWeekly}
                    onChange={setListenerWeekly}
                    errorMessage={
                      providerErrors["weeklyAvailability"] ??
                      providerErrors["weeklyAvailability.0"]
                    }
                  />
                </div>
              </div>
            </section>
          ) : null}

          {formError ? (
            <p className="mt-6 text-sm font-medium text-theme-status-error" role="alert">
              {formError}
            </p>
          ) : null}
        </motion.div>

        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-theme-muted bg-[#faf8f5] px-6 py-4 sm:px-8">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-[#5c574f] transition hover:text-theme-heading"
          >
            Cancel changes
          </button>
          <button
            type="button"
            disabled={save.isPending}
            onClick={() => {
              setFormError(null);
              save.mutate();
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1e4a3d] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgb(30_74_61/55%)] transition hover:bg-[#173d32] disabled:opacity-60"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M4 4h10v2H4V4zm0 4h12v2H4V8zm0 4h8v2H4v-2zm8-6h4v10h-2V8h-2V6z" />
            </svg>
            {save.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function AdminEditUserModal({ open, user, onClose }: AdminEditUserModalProps) {
  return (
    <AnimatePresence>
      {open && user ? (
        <AdminEditUserFormInner key={user.id} user={user} onClose={onClose} />
      ) : null}
    </AnimatePresence>
  );
}
