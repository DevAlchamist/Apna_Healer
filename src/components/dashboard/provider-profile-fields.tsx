"use client";

import type { ReactNode } from "react";
import {
  WeeklyAvailabilityFields,
  type WeeklyWindow,
} from "@/components/dashboard/professional-apply/weekly-availability-fields";
import type { TherapistLandingFormFields } from "@/lib/provider-profile-form";

const fieldLabel =
  "block text-xs font-semibold uppercase tracking-[0.12em] text-text-primary/45";
const fieldInput =
  "mt-1.5 w-full rounded-xl border border-accent/80 bg-white px-3 py-2.5 text-sm text-text-primary focus:border-[#2D5A4C] focus:outline-none";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-[#cf4f45]">{message}</p>;
}

function ProfileSection({
  title,
  compact,
  children,
}: {
  title: string;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`space-y-4 rounded-xl border border-[#2D5A4C]/12 bg-[#f8fbf9] ${compact ? "p-4" : "p-5"}`}>
      <h3 className="font-display text-lg font-semibold text-[#2D5A4C]">{title}</h3>
      {children}
    </div>
  );
}

type TherapistLandingFieldsProps = TherapistLandingFormFields & {
  onProfileDescription: (v: string) => void;
  onPhilosophyQuote: (v: string) => void;
  onExperienceDescription: (v: string) => void;
  onTestimonialQuote: (v: string) => void;
  onTestimonialAuthor: (v: string) => void;
  onRetentionRate: (v: string) => void;
  errors?: Record<string, string>;
  compact?: boolean;
  labelClassName?: string;
  inputClassName?: string;
  wrapSection?: boolean;
};

export function TherapistLandingFields({
  profileDescription,
  onProfileDescription,
  philosophyQuote,
  onPhilosophyQuote,
  experienceDescription,
  onExperienceDescription,
  testimonialQuote,
  onTestimonialQuote,
  testimonialAuthor,
  onTestimonialAuthor,
  retentionRate,
  onRetentionRate,
  errors = {},
  compact,
  labelClassName = fieldLabel,
  inputClassName = fieldInput,
  wrapSection = true,
}: TherapistLandingFieldsProps) {
  const fields = (
    <>
      <p className="text-sm text-text-primary/55">
        Optional content shown on your public therapist page at /therapists/your-id.
      </p>
      <label className={labelClassName}>
        Profile description
        <textarea
          value={profileDescription}
          onChange={(e) => onProfileDescription(e.target.value)}
          rows={compact ? 3 : 4}
          className={`${inputClassName} resize-y`}
          placeholder="Hero intro — how you guide clients toward emotional equilibrium."
        />
        <FieldError message={errors.profileDescription} />
      </label>
      <label className={labelClassName}>
        Philosophy quote
        <textarea
          value={philosophyQuote}
          onChange={(e) => onPhilosophyQuote(e.target.value)}
          rows={2}
          className={`${inputClassName} resize-y`}
          placeholder="A short quote that captures your philosophy of care."
        />
        <FieldError message={errors.philosophyQuote} />
      </label>
      <label className={labelClassName}>
        Experience description
        <textarea
          value={experienceDescription}
          onChange={(e) => onExperienceDescription(e.target.value)}
          rows={compact ? 3 : 4}
          className={`${inputClassName} resize-y`}
          placeholder="Narrative about your clinical focus and academic background."
        />
        <FieldError message={errors.experienceDescription} />
      </label>
      <label className={labelClassName}>
        Testimonial quote
        <textarea
          value={testimonialQuote}
          onChange={(e) => onTestimonialQuote(e.target.value)}
          rows={3}
          className={`${inputClassName} resize-y`}
          placeholder="A client or community quote about working with you."
        />
        <FieldError message={errors.testimonialQuote} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClassName}>
          Testimonial author
          <input
            value={testimonialAuthor}
            onChange={(e) => onTestimonialAuthor(e.target.value)}
            className={inputClassName}
            placeholder="Community member"
          />
          <FieldError message={errors.testimonialAuthor} />
        </label>
        <label className={labelClassName}>
          Retention / satisfaction rate
          <input
            value={retentionRate}
            onChange={(e) => onRetentionRate(e.target.value)}
            className={inputClassName}
            placeholder="98%"
          />
          <FieldError message={errors.retentionRate} />
        </label>
      </div>
    </>
  );

  if (!wrapSection) return <div className="space-y-4">{fields}</div>;

  return (
    <ProfileSection title="Public landing page" compact={compact}>
      {fields}
    </ProfileSection>
  );
}

type TherapistFieldsProps = TherapistLandingFormFields & {
  profileBio: string;
  onProfileBio: (v: string) => void;
  specialization: string;
  onSpecialization: (v: string) => void;
  certificationsRaw: string;
  onCertificationsRaw: (v: string) => void;
  experienceYears: string;
  onExperienceYears: (v: string) => void;
  hourlyRate: string;
  onHourlyRate: (v: string) => void;
  weekly: WeeklyWindow[];
  onWeekly: (v: WeeklyWindow[]) => void;
  onProfileDescription: (v: string) => void;
  onPhilosophyQuote: (v: string) => void;
  onExperienceDescription: (v: string) => void;
  onTestimonialQuote: (v: string) => void;
  onTestimonialAuthor: (v: string) => void;
  onRetentionRate: (v: string) => void;
  errors?: Record<string, string>;
  compact?: boolean;
};

export function TherapistProfileFields({
  profileBio,
  onProfileBio,
  specialization,
  onSpecialization,
  certificationsRaw,
  onCertificationsRaw,
  experienceYears,
  onExperienceYears,
  hourlyRate,
  onHourlyRate,
  weekly,
  onWeekly,
  profileDescription,
  onProfileDescription,
  philosophyQuote,
  onPhilosophyQuote,
  experienceDescription,
  onExperienceDescription,
  testimonialQuote,
  onTestimonialQuote,
  testimonialAuthor,
  onTestimonialAuthor,
  retentionRate,
  onRetentionRate,
  errors = {},
  compact,
}: TherapistFieldsProps) {
  return (
    <>
      <ProfileSection title="Therapist practice" compact={compact}>
        <p className="text-sm text-text-primary/55">
          Session fee, weekly timings, and education are required for therapist accounts.
        </p>
        <label className={fieldLabel}>
          Professional bio
          <textarea
            value={profileBio}
            onChange={(e) => onProfileBio(e.target.value)}
            rows={compact ? 3 : 4}
            className={`${fieldInput} resize-y`}
            placeholder="How you work and who you support."
          />
          <FieldError message={errors.bio} />
        </label>
        <label className={fieldLabel}>
          Specialization
          <textarea
            value={specialization}
            onChange={(e) => onSpecialization(e.target.value)}
            rows={2}
            className={`${fieldInput} resize-y`}
            placeholder="Anxiety, couples, trauma-informed care…"
          />
          <FieldError message={errors.specialization} />
        </label>
        <label className={fieldLabel}>
          Education &amp; certifications
          <input
            value={certificationsRaw}
            onChange={(e) => onCertificationsRaw(e.target.value)}
            className={fieldInput}
            placeholder="Degrees, RCI registration, modalities — comma-separated"
          />
          <FieldError message={errors.certifications} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={fieldLabel}>
            Years of experience
            <input
              type="number"
              min={0}
              max={60}
              value={experienceYears}
              onChange={(e) => onExperienceYears(e.target.value)}
              className={fieldInput}
            />
            <FieldError message={errors.experienceYears} />
          </label>
          <label className={fieldLabel}>
            Session fee (₹ / hour)
            <input
              type="number"
              min={1}
              value={hourlyRate}
              onChange={(e) => onHourlyRate(e.target.value)}
              className={fieldInput}
            />
            <FieldError message={errors.hourlyRate} />
          </label>
        </div>
        <ProfileSection title="Session timings" compact>
          <WeeklyAvailabilityFields
            value={weekly}
            onChange={onWeekly}
            errorMessage={errors["weeklyAvailability"] ?? errors["weeklyAvailability.0"]}
          />
        </ProfileSection>
      </ProfileSection>
      <TherapistLandingFields
        profileDescription={profileDescription}
        onProfileDescription={onProfileDescription}
        philosophyQuote={philosophyQuote}
        onPhilosophyQuote={onPhilosophyQuote}
        experienceDescription={experienceDescription}
        onExperienceDescription={onExperienceDescription}
        testimonialQuote={testimonialQuote}
        onTestimonialQuote={onTestimonialQuote}
        testimonialAuthor={testimonialAuthor}
        onTestimonialAuthor={onTestimonialAuthor}
        retentionRate={retentionRate}
        onRetentionRate={onRetentionRate}
        errors={errors}
        compact={compact}
      />
    </>
  );
}

type ListenerFieldsProps = {
  profileBio: string;
  onProfileBio: (v: string) => void;
  languagesRaw: string;
  onLanguagesRaw: (v: string) => void;
  interestsRaw: string;
  onInterestsRaw: (v: string) => void;
  weekly: WeeklyWindow[];
  onWeekly: (v: WeeklyWindow[]) => void;
  errors?: Record<string, string>;
  compact?: boolean;
};

export function ListenerProfileFields({
  profileBio,
  onProfileBio,
  languagesRaw,
  onLanguagesRaw,
  interestsRaw,
  onInterestsRaw,
  weekly,
  onWeekly,
  errors = {},
  compact,
}: ListenerFieldsProps) {
  return (
    <ProfileSection title="Listener profile" compact={compact}>
      <p className="text-sm text-text-primary/55">
        Share your interests, languages, and when you are available to listen.
      </p>
      <label className={fieldLabel}>
        Listener bio
        <textarea
          value={profileBio}
          onChange={(e) => onProfileBio(e.target.value)}
          rows={compact ? 3 : 4}
          className={`${fieldInput} resize-y`}
          placeholder="How you show up for people who need a calm ear."
        />
        <FieldError message={errors.bio} />
      </label>
      <label className={fieldLabel}>
        Languages
        <input
          value={languagesRaw}
          onChange={(e) => onLanguagesRaw(e.target.value)}
          className={fieldInput}
          placeholder="English, Hindi, Urdu…"
        />
        <FieldError message={errors.languages} />
      </label>
      <label className={fieldLabel}>
        Interests &amp; strengths
        <input
          value={interestsRaw}
          onChange={(e) => onInterestsRaw(e.target.value)}
          className={fieldInput}
          placeholder="Grief, loneliness, mindfulness, student stress…"
        />
        <FieldError message={errors.emotionalStrengths} />
      </label>
      <ProfileSection title="Availability timings" compact>
        <WeeklyAvailabilityFields
          value={weekly}
          onChange={onWeekly}
          errorMessage={errors["weeklyAvailability"] ?? errors["weeklyAvailability.0"]}
        />
      </ProfileSection>
    </ProfileSection>
  );
}
