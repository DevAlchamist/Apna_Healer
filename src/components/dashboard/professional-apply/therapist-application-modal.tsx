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
  safeParseTherapistApplicationPayload,
  zodIssuesToFieldErrorMap,
} from "@/lib/validators/professional-application";

function splitList(raw: string) {
  return raw
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
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

export function TherapistApplicationModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [bio, setBio] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [certificationsRaw, setCertificationsRaw] = useState("");
  const [years, setYears] = useState("3");
  const [pricing, setPricing] = useState("1500");
  const [whyJoin, setWhyJoin] = useState("");
  const [documents, setDocuments] = useState<string[]>([""]);
  const [optionalLinksRaw, setOptionalLinksRaw] = useState("");
  const [weekly, setWeekly] = useState<WeeklyWindow[]>(defaultWeeklyAvailability);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setBio("");
    setSpecialization("");
    setCertificationsRaw("");
    setYears("3");
    setPricing("1500");
    setWhyJoin("");
    setDocuments([""]);
    setOptionalLinksRaw("");
    setWeekly(defaultWeeklyAvailability);
    setFieldErrors({});
  };

  const applicationData = useMemo(() => {
    const docUrls = documents.map((d) => d.trim()).filter(Boolean);
    const optionalLinks = splitList(optionalLinksRaw).filter(isValidHttpUrl);
    return {
      bio,
      specialization,
      certifications: splitList(certificationsRaw),
      yearsOfExperience: Number.parseInt(years, 10) || 0,
      pricing: Number.parseFloat(pricing) || 0,
      weeklyAvailability: weekly,
      documents: docUrls,
      whyJoin,
      ...(optionalLinks.length ? { optionalLinks } : {}),
    };
  }, [bio, certificationsRaw, documents, optionalLinksRaw, pricing, specialization, weekly, whyJoin, years]);

  const payload = useMemo(
    () => ({
      type: "THERAPIST" as const,
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
  const documentsFieldError = firstMatchingFieldError(fieldErrors, "documents");
  const optionalLinksFieldError = firstMatchingFieldError(fieldErrors, "optionalLinks");

  const submit = () => {
    const parsed = safeParseTherapistApplicationPayload(applicationData);
    if (!parsed.success) {
      setFieldErrors(zodIssuesToFieldErrorMap(parsed.error));
      return;
    }
    setFieldErrors({});
    mutation.mutate();
  };

  const footer = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-center text-[12px] leading-relaxed text-text-primary/48 sm:max-w-[15rem] sm:text-left">
        Have credentials ready as links. We may follow up if anything needs clarification.
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
          form="therapist-application-form"
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
      variant="therapist"
      eyebrow="Therapist track"
      title="Become a Therapist"
      description="Tell us about your practice, credentials, and how you want to show up for clients on Apna Healer."
      footer={footer}
    >
      <form
        id="therapist-application-form"
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

        <ApplicationFormSection title="Your story">
          <label className={applicationLabelClass}>
            <span>Professional bio</span>
            <textarea
              required
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                clearKeys("bio");
              }}
              rows={4}
              className={`${applicationInputClass} min-h-[7.5rem] resize-y ${inputTone(!!fieldErrors.bio)}`}
              placeholder="How you work, who you support, and what clients can expect."
            />
            <FieldError message={fieldErrors.bio} />
            <span className="text-[11px] font-medium text-text-primary/42">Minimum 20 characters.</span>
          </label>
          <label className={applicationLabelClass}>
            <span>Why join Apna Healer?</span>
            <textarea
              required
              value={whyJoin}
              onChange={(e) => {
                setWhyJoin(e.target.value);
                clearKeys("whyJoin");
              }}
              rows={3}
              className={`${applicationInputClass} resize-y ${inputTone(!!fieldErrors.whyJoin)}`}
              placeholder="What aligns between your practice and this community?"
            />
            <FieldError message={fieldErrors.whyJoin} />
          </label>
        </ApplicationFormSection>

        <ApplicationFormSection title="Practice details">
          <label className={applicationLabelClass}>
            <span>Specialization</span>
            <textarea
              required
              value={specialization}
              onChange={(e) => {
                setSpecialization(e.target.value);
                clearKeys("specialization");
              }}
              rows={2}
              className={`${applicationInputClass} resize-y ${inputTone(!!fieldErrors.specialization)}`}
              placeholder="Focus areas — anxiety, couples, trauma-informed care, etc."
            />
            <FieldError message={fieldErrors.specialization} />
          </label>
          <label className={applicationLabelClass}>
            <span>Education &amp; certifications</span>
            <input
              required
              value={certificationsRaw}
              onChange={(e) => {
                setCertificationsRaw(e.target.value);
                clearKeys("certifications");
              }}
              className={`${applicationInputClass} ${inputTone(!!fieldErrors.certifications)}`}
              placeholder="RCI registration, degrees, modalities — comma-separated"
            />
            <FieldError message={fieldErrors.certifications} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={applicationLabelClass}>
              <span>Years of experience</span>
              <input
                required
                type="number"
                min={0}
                max={60}
                value={years}
                onChange={(e) => {
                  setYears(e.target.value);
                  clearKeys("yearsOfExperience");
                }}
                className={`${applicationInputClass} ${inputTone(!!fieldErrors.yearsOfExperience)}`}
              />
              <FieldError message={fieldErrors.yearsOfExperience} />
            </label>
            <label className={applicationLabelClass}>
              <span>Session fee (₹ / hour)</span>
              <input
                required
                type="number"
                min={1}
                step={50}
                value={pricing}
                onChange={(e) => {
                  setPricing(e.target.value);
                  clearKeys("pricing");
                }}
                className={`${applicationInputClass} ${inputTone(!!fieldErrors.pricing)}`}
              />
              <FieldError message={fieldErrors.pricing} />
              <span className="text-[11px] font-medium text-text-primary/42">Must be greater than zero.</span>
            </label>
          </div>
        </ApplicationFormSection>

        <ApplicationFormSection title="Session timings & documents">
          <WeeklyAvailabilityFields
            value={weekly}
            onChange={(next) => {
              setWeekly(next);
              clearKeys("weeklyAvailability");
            }}
            disabled={mutation.isPending}
            errorMessage={weeklyFieldError}
          />
          <div className="space-y-3">
            <div className={applicationLabelClass}>
              <span>Credential & document links</span>
              <span className="-mt-1 text-[11px] font-medium text-text-primary/42">
                Optional but recommended — each link must be a valid http(s) URL.
              </span>
            </div>
            <FieldError message={documentsFieldError} />
            <div className="space-y-2.5">
              {documents.map((row, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    value={row}
                    onChange={(e) => {
                      const next = [...documents];
                      next[index] = e.target.value;
                      setDocuments(next);
                      clearKeys("documents");
                    }}
                    className={`${applicationInputClass} ${inputTone(!!fieldErrors[`documents.${index}`])}`}
                    placeholder="https://…"
                  />
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    className="shrink-0 rounded-xl border border-[#f0d9d6] bg-[#fff8f7] px-3 py-2 text-sm font-semibold text-[#b54a42] transition hover:bg-[#fde2df] disabled:opacity-40"
                    onClick={() => {
                      setDocuments(documents.filter((_, i) => i !== index));
                      clearKeys("documents");
                    }}
                    disabled={documents.length <= 1}
                    aria-label="Remove link row"
                  >
                    ×
                  </motion.button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="text-xs font-semibold text-[#3e725f] underline-offset-4 hover:underline"
              onClick={() => {
                setDocuments([...documents, ""]);
                clearKeys("documents");
              }}
            >
              + Add another document link
            </button>
          </div>
        </ApplicationFormSection>

        <ApplicationFormSection title="Optional links">
          <label className={applicationLabelClass}>
            <span>Website, LinkedIn, or portfolio</span>
            <input
              value={optionalLinksRaw}
              onChange={(e) => {
                setOptionalLinksRaw(e.target.value);
                clearKeys("optionalLinks");
              }}
              className={`${applicationInputClass} ${inputTone(!!optionalLinksFieldError)}`}
              placeholder="Comma-separated https URLs"
            />
            <FieldError message={optionalLinksFieldError} />
            <span className="text-[11px] font-medium text-text-primary/42">
              Invalid URLs are ignored when submitting; remaining links must be valid https or http URLs.
            </span>
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
