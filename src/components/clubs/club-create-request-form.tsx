"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiMutation } from "@/lib/api-client";

type ClubCreateRequestFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function ClubCreateRequestForm({ onSuccess, onCancel }: ClubCreateRequestFormProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [description, setDescription] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("299");
  const [questions, setQuestions] = useState("What brings you to this club?\nHow can we support your journey?");
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => {
      const onboardingSteps = questions
        .split("\n")
        .map((q) => q.trim())
        .filter(Boolean)
        .map((question, i) => ({ question, required: true, sortOrder: i }));

      return apiMutation("/api/clubs/creation-requests", "POST", {
        title,
        subtitle,
        purpose: purpose || null,
        description: description || null,
        heroImageUrl: heroImageUrl || null,
        monthlyFee: Number(monthlyFee),
        galleryUrls: [],
        onboardingSteps,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["club-creation-requests"] });
      onSuccess?.();
    },
    onError: (err: Error) => setError(err.message),
  });

  return (
    <form
      className="space-y-4 rounded-calm border border-accent/70 bg-white p-6"
      onSubmit={(e) => {
        e.preventDefault();
        createMutation.mutate();
      }}
    >
      <h2 className="font-display text-2xl font-semibold text-text-primary">Request a new club</h2>
      <p className="text-sm text-text-primary/60">
        Submit your club idea for admin review. Include onboarding questions members will answer.
      </p>
      <input
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Club title"
        className="w-full rounded-gentle border border-accent/80 px-4 py-2 text-sm"
      />
      <textarea
        required
        value={subtitle}
        onChange={(e) => setSubtitle(e.target.value)}
        placeholder="Short subtitle"
        rows={2}
        className="w-full rounded-gentle border border-accent/80 px-4 py-2 text-sm"
      />
      <textarea
        value={purpose}
        onChange={(e) => setPurpose(e.target.value)}
        placeholder="Purpose of the club"
        rows={2}
        className="w-full rounded-gentle border border-accent/80 px-4 py-2 text-sm"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Full description (optional)"
        rows={3}
        className="w-full rounded-gentle border border-accent/80 px-4 py-2 text-sm"
      />
      <input
        value={heroImageUrl}
        onChange={(e) => setHeroImageUrl(e.target.value)}
        placeholder="Hero image URL (optional)"
        className="w-full rounded-gentle border border-accent/80 px-4 py-2 text-sm"
      />
      <label className="block text-sm">
        Monthly fee (₹)
        <input
          type="number"
          min={1}
          value={monthlyFee}
          onChange={(e) => setMonthlyFee(e.target.value)}
          className="mt-1 w-full rounded-gentle border border-accent/80 px-4 py-2"
        />
      </label>
      <label className="block text-sm">
        Onboarding questions (one per line)
        <textarea
          value={questions}
          onChange={(e) => setQuestions(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-gentle border border-accent/80 px-4 py-2 text-sm"
        />
      </label>
      {error ? <p className="text-sm text-[#cf4f45]">{error}</p> : null}
      <div className="flex gap-3">
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
