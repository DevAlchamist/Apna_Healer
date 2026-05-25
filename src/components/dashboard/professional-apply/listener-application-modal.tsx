"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiClientError, apiMutation } from "@/lib/api-client";
import type { ApiApplication } from "@/types/api";
import {
  ApplicationFormModal,
  ApplicationFormSection,
  applicationInputClass,
  applicationLabelClass,
} from "@/components/dashboard/professional-apply/application-form-modal";
import {
  WeeklyAvailabilityFields,
  defaultWeeklyAvailability,
  type WeeklyWindow,
} from "@/components/dashboard/professional-apply/weekly-availability-fields";
import {
  firstMatchingFieldError,
  safeParseListenerApplicationPayload,
  zodIssuesToFieldErrorMap,
} from "@/lib/validators/professional-application";

function splitList(raw: string) {
  return raw
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-[12px] font-medium text-[#b54a42]">{message}</p>;
}

function inputTone(hasError: boolean) {
  return hasError ? "border-[#e4a99f] ring-2 ring-[#cf4f45]/14" : "";
}

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ListenerApplicationModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [bio, setBio] = useState("");
  const [whyHelp, setWhyHelp] = useState("");
  const [languagesRaw, setLanguagesRaw] = useState("");
  const [strengthsRaw, setStrengthsRaw] = useState("");
  const [optionalExperience, setOptionalExperience] = useState("");
  const [optionalNote, setOptionalNote] = useState("");
  const [weekly, setWeekly] = useState<WeeklyWindow[]>(defaultWeeklyAvailability);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setBio("");
    setWhyHelp("");
    setLanguagesRaw("");
    setStrengthsRaw("");
    setOptionalExperience("");
    setOptionalNote("");
    setWeekly(defaultWeeklyAvailability);
    setFieldErrors({});
  };

  const applicationData = useMemo(
    () => ({
      bio,
      whyHelp,
      languages: splitList(languagesRaw),
      emotionalStrengths: splitList(strengthsRaw),
      weeklyAvailability: weekly,
      ...(optionalExperience.trim() ? { optionalExperience: optionalExperience.trim() } : {}),
      ...(optionalNote.trim() ? { optionalNote: optionalNote.trim() } : {}),
    }),
    [bio, languagesRaw, optionalExperience, optionalNote, strengthsRaw, weekly, whyHelp],
  );

  const payload = useMemo(
    () => ({
      type: "LISTENER" as const,
      applicationData,
    }),
    [applicationData],
  );

  const mutation = useMutation({
    mutationFn: () => apiMutation<ApiApplication>("/api/applications", "POST", payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user-me"] });
      reset();
      onClose();
    },
    onError: (error) => {
      if (error instanceof ApiClientError && error.code === "VALIDATION_ERROR" && error.issues) {
        const issues = error.issues as { fieldErrors?: Record<string, string[] | undefined> };
        const nested = issues.fieldErrors?.applicationData;
        if (Array.isArray(nested) && nested.length > 0) {
          setFieldErrors({ _form: nested.join(" ") });
        }
      }
    },
  });

  useEffect(() => {
    if (!open) return;
    setFieldErrors({});
    mutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset when dialog opens
  }, [open]);

  const clearKeys = (...keys: string[]) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      for (const key of keys) {
        delete next[key];
        for (const k of Object.keys(next)) {
          if (k.startsWith(`${key}.`)) {
            delete next[k];
          }
        }
      }
      delete next._form;
      return next;
    });
  };

  const weeklyFieldError = firstMatchingFieldError(fieldErrors, "weeklyAvailability");

  const submit = () => {
    const parsed = safeParseListenerApplicationPayload(applicationData);
    if (!parsed.success) {
      setFieldErrors(zodIssuesToFieldErrorMap(parsed.error));
      return;
    }
    setFieldErrors({});
    mutation.mutate();
  };

  const footer = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-center text-[12px] leading-relaxed text-text-primary/48 sm:max-w-[14rem] sm:text-left">
        Submissions are reviewed manually. You will see status updates on your profile.
      </p>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          disabled={mutation.isPending}
          onClick={onClose}
          className="rounded-full border border-[#dcd4c8] bg-white px-6 py-2.5 text-sm font-semibold text-[#4a5653] shadow-sm transition hover:bg-[#faf8f5] disabled:opacity-50"
        >
          Cancel
        </motion.button>
        <motion.button
          type="submit"
          form="listener-application-form"
          whileTap={{ scale: 0.98 }}
          disabled={mutation.isPending}
          className="rounded-full bg-[#3e725f] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_-14px_rgba(62,114,95,0.85)] transition hover:bg-[#356654] disabled:opacity-55"
        >
          {mutation.isPending ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/35 border-t-white" aria-hidden />
              Sending…
            </span>
          ) : (
            "Submit application"
          )}
        </motion.button>
      </div>
    </div>
  );

  return (
    <ApplicationFormModal
      open={open}
      onClose={onClose}
      variant="listener"
      eyebrow="Listener track"
      title="Become a Listener"
      description="Share how you hold calm, human space for others. Our team usually responds within a few business days."
      footer={footer}
    >
      <form
        id="listener-application-form"
        className="space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {fieldErrors._form ? (
          <div className="rounded-xl border border-[#f5d4d1] bg-[#fff5f4] px-4 py-3 text-sm font-medium text-[#b54a42]">
            {fieldErrors._form}
          </div>
        ) : null}

        <ApplicationFormSection title="About you">
          <label className={applicationLabelClass}>
            <span>Bio</span>
            <textarea
              required
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                clearKeys("bio");
              }}
              rows={4}
              className={`${applicationInputClass} min-h-[7.5rem] resize-y ${inputTone(!!fieldErrors.bio)}`}
              placeholder="Introduce yourself and your listening style."
            />
            <FieldError message={fieldErrors.bio} />
            <span className="text-[11px] font-medium text-text-primary/42">At least a few thoughtful sentences (minimum 20 characters).</span>
          </label>
          <label className={applicationLabelClass}>
            <span>Why do you want to help people?</span>
            <textarea
              required
              value={whyHelp}
              onChange={(e) => {
                setWhyHelp(e.target.value);
                clearKeys("whyHelp");
              }}
              rows={3}
              className={`${applicationInputClass} resize-y ${inputTone(!!fieldErrors.whyHelp)}`}
              placeholder="What draws you to peer listening on Apna Healer?"
            />
            <FieldError message={fieldErrors.whyHelp} />
          </label>
        </ApplicationFormSection>

        <ApplicationFormSection title="How you show up">
          <label className={applicationLabelClass}>
            <span>Languages</span>
            <input
              required
              value={languagesRaw}
              onChange={(e) => {
                setLanguagesRaw(e.target.value);
                clearKeys("languages");
              }}
              className={`${applicationInputClass} ${inputTone(!!fieldErrors.languages)}`}
              placeholder="e.g. English, Hindi, Urdu"
            />
            <FieldError message={fieldErrors.languages} />
            <span className="text-[11px] font-medium text-text-primary/42">Comma-separated list.</span>
          </label>
          <label className={applicationLabelClass}>
            <span>Interests &amp; strengths</span>
            <input
              required
              value={strengthsRaw}
              onChange={(e) => {
                setStrengthsRaw(e.target.value);
                clearKeys("emotionalStrengths");
              }}
              className={`${applicationInputClass} ${inputTone(!!fieldErrors.emotionalStrengths)}`}
              placeholder="e.g. empathy, patience, grounding"
            />
            <FieldError message={fieldErrors.emotionalStrengths} />
            <span className="text-[11px] font-medium text-text-primary/42">What you bring into difficult conversations.</span>
          </label>
        </ApplicationFormSection>

        <ApplicationFormSection title="Availability timings">
          <WeeklyAvailabilityFields
            value={weekly}
            onChange={(next) => {
              setWeekly(next);
              clearKeys("weeklyAvailability");
            }}
            disabled={mutation.isPending}
            errorMessage={weeklyFieldError}
          />
        </ApplicationFormSection>

        <ApplicationFormSection title="Optional">
          <label className={applicationLabelClass}>
            <span>Prior experience</span>
            <textarea
              value={optionalExperience}
              onChange={(e) => {
                setOptionalExperience(e.target.value);
                clearKeys("optionalExperience");
              }}
              rows={2}
              className={`${applicationInputClass} resize-y ${inputTone(!!fieldErrors.optionalExperience)}`}
              placeholder="Volunteering, helplines, peer support — anything relevant."
            />
            <FieldError message={fieldErrors.optionalExperience} />
          </label>
          <label className={applicationLabelClass}>
            <span>Note to reviewers</span>
            <textarea
              value={optionalNote}
              onChange={(e) => {
                setOptionalNote(e.target.value);
                clearKeys("optionalNote");
              }}
              rows={2}
              className={`${applicationInputClass} resize-y ${inputTone(!!fieldErrors.optionalNote)}`}
              placeholder="Anything else we should know when reviewing your application."
            />
            <FieldError message={fieldErrors.optionalNote} />
          </label>
        </ApplicationFormSection>

        {mutation.error && !(mutation.error instanceof ApiClientError && mutation.error.code === "VALIDATION_ERROR") ? (
          <div className="rounded-xl border border-[#f5d4d1] bg-[#fff5f4] px-4 py-3 text-sm font-medium text-[#b54a42]">
            {mutation.error.message}
          </div>
        ) : null}
      </form>
    </ApplicationFormModal>
  );
}
