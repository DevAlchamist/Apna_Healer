"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiMutation } from "@/lib/api-client";
import type { ApiClubDetail, ApiClubOnboardingAnswerStep } from "@/types/api";
import { ClubJoinOnboardingWizard } from "@/components/clubs/club-join-onboarding-wizard";

type ClubJoinModalProps = {
  club: ApiClubDetail;
  open: boolean;
  onClose: () => void;
};

export function ClubJoinModal({ club, open, onClose }: ClubJoinModalProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [wizardKey, setWizardKey] = useState(0);

  useEffect(() => {
    if (!open) {
      setError(null);
      setWizardKey((k) => k + 1);
    }
  }, [open]);

  const joinMutation = useMutation({
    mutationFn: (payload: {
      message?: string;
      onboardingAnswers?: ApiClubOnboardingAnswerStep[];
    }) =>
      apiMutation<{ id: string }>("/api/clubs/join-requests", "POST", {
        clubId: club.id,
        ...payload,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["club", club.slug] });
      void queryClient.invalidateQueries({ queryKey: ["clubs"] });
      onClose();
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-calm bg-white p-6 shadow-soft">
        <h2 className="font-display text-2xl font-semibold text-text-primary">
          Join {club.title}
        </h2>
        <p className="mt-2 text-sm text-text-primary/60">
          {club.onboardingSteps.length > 0
            ? "Complete each step, then confirm your monthly membership."
            : "Tell the circle why you would like to join."}
        </p>

        <div className="mt-5">
          <ClubJoinOnboardingWizard
            key={wizardKey}
            club={club}
            onSubmit={(payload) => {
              setError(null);
              joinMutation.mutate(payload);
            }}
            isSubmitting={joinMutation.isPending}
            error={error}
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={joinMutation.isPending}
            className="text-sm font-semibold text-text-primary/55 hover:text-text-primary/80"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
