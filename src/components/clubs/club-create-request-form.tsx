"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ClubFormFields } from "@/components/clubs/club-form-fields";
import {
  DEFAULT_ONBOARDING_STEPS,
} from "@/components/clubs/club-onboarding-steps-editor";
import { apiMutation } from "@/lib/api-client";
import { buildClubApiPayload, emptyClubForm, type ClubFormState } from "@/lib/club-form";

type ClubCreateRequestFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function ClubCreateRequestForm({ onSuccess, onCancel }: ClubCreateRequestFormProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ClubFormState>(() => ({
    ...emptyClubForm(),
    onboardingSteps: DEFAULT_ONBOARDING_STEPS,
  }));
  const [error, setError] = useState<string | null>(null);

  const fieldInput =
    "mt-2 w-full rounded-gentle border border-accent/80 bg-background px-4 py-2.5 text-sm outline-none focus:border-primary/40";
  const fieldLabel = "block text-xs font-semibold uppercase tracking-[0.12em] text-text-primary/45";

  const createMutation = useMutation({
    mutationFn: () => {
      if (form.onboardingSteps.length === 0) {
        throw new Error("Add at least one onboarding step with questions.");
      }
      return apiMutation("/api/clubs/creation-requests", "POST", buildClubApiPayload(form));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["club-creation-requests"] });
      onSuccess?.();
    },
    onError: (err: Error) => setError(err.message),
  });

  return (
    <form
      className="space-y-8 rounded-calm border border-accent/70 bg-white p-6"
      onSubmit={(e) => {
        e.preventDefault();
        createMutation.mutate();
      }}
    >
      <div>
        <h2 className="font-display text-2xl font-semibold text-text-primary">Request a new club</h2>
        <p className="mt-2 text-sm text-text-primary/60">
          Build the same sections visitors see on your public club page — cover image, story,
          landing content, testimonials, and member onboarding questions.
        </p>
      </div>

      <ClubFormFields
        form={form}
        onChange={(patch) => setForm((p) => ({ ...p, ...patch }))}
        labelClassName={fieldLabel}
        inputClassName={fieldInput}
      />

      {error ? <p className="text-sm text-theme-status-error">{error}</p> : null}

      <div className="flex gap-3 border-t border-accent/50 pt-6">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-accent px-5 py-2 text-sm font-semibold"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="rounded-full bg-text-secondary px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {createMutation.isPending ? "Submitting…" : "Submit for review"}
        </button>
      </div>
    </form>
  );
}
