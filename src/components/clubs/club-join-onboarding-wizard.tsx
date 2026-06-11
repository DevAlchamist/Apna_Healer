"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/display";
import type { ApiClubDetail, ApiClubOnboardingAnswerStep } from "@/types/api";

type ClubJoinOnboardingWizardProps = {
  club: ApiClubDetail;
  onSubmit: (payload: {
    message?: string;
    onboardingAnswers?: ApiClubOnboardingAnswerStep[];
  }) => void;
  isSubmitting: boolean;
  error: string | null;
};

type AnswerValue = string | string[];
type AnswerMap = Record<string, AnswerValue>;

function answerKey(stepId: string, questionId: string) {
  return `${stepId}:${questionId}`;
}

export function ClubJoinOnboardingWizard({
  club,
  onSubmit,
  isSubmitting,
  error,
}: ClubJoinOnboardingWizardProps) {
  const steps = club.onboardingSteps;
  const hasOnboarding = steps.length > 0;
  const totalScreens = hasOnboarding ? steps.length + 1 : 1;

  const [screenIndex, setScreenIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [message, setMessage] = useState("");

  const isPaymentScreen = hasOnboarding && screenIndex === steps.length;
  const currentStep = hasOnboarding && !isPaymentScreen ? steps[screenIndex] : null;

  const progressPercent = useMemo(
    () => Math.round(((screenIndex + 1) / totalScreens) * 100),
    [screenIndex, totalScreens],
  );

  function setAnswer(stepId: string, questionId: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [answerKey(stepId, questionId)]: value }));
  }

  function currentStepValid(): boolean {
    if (!currentStep) return message.trim().length >= 10;
    return currentStep.questions.every((q) => {
      if (!q.required) return true;
      const value = answers[answerKey(currentStep.id, q.id)];
      if (Array.isArray(value)) return value.length > 0;
      return (value ?? "").trim().length > 0;
    });
  }

  function buildPayload() {
    if (!hasOnboarding) {
      return { message: message.trim() };
    }

    const onboardingAnswers: ApiClubOnboardingAnswerStep[] = steps.map((step) => ({
      stepTitle: step.title,
      stepDescription: step.description,
      questions: step.questions.map((q) => ({
        questionId: q.id,
        question: q.question,
        answer: (() => {
          const value = answers[answerKey(step.id, q.id)];
          if (Array.isArray(value)) return value.filter(Boolean);
          return (value ?? "").trim();
        })(),
      })),
    }));

    return { onboardingAnswers };
  }

  function handleNext() {
    if (!currentStepValid()) return;
    if (isPaymentScreen || !hasOnboarding) {
      onSubmit(buildPayload());
      return;
    }
    setScreenIndex((i) => Math.min(i + 1, totalScreens - 1));
  }

  function handleBack() {
    setScreenIndex((i) => Math.max(i - 1, 0));
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.12em] text-[#9d9287]">
          <span>
            {isPaymentScreen
              ? "Membership payment"
              : hasOnboarding
                ? `Step ${screenIndex + 1} of ${steps.length}`
                : "Join request"}
          </span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#ebe6de]">
          <div
            className="h-full rounded-full bg-theme-button-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {currentStep ? (
        <div className="space-y-4">
          <div>
            <h3 className="font-display text-xl font-semibold text-[#243230]">{currentStep.title}</h3>
            {currentStep.description ? (
              <p className="mt-2 text-sm leading-6 text-text-primary/60">{currentStep.description}</p>
            ) : null}
          </div>

          {currentStep.questions.map((q) => (
            <label key={q.id} className="block text-sm font-medium text-text-primary/80">
              {q.question}
              {q.required ? <span className="text-theme-status-error"> *</span> : null}
              {q.type === "CHOICE" ? (
                <div className="mt-3 space-y-2 rounded-lg border border-[#ebe6de] bg-white p-3">
                  {(q.options ?? []).map((opt) => {
                    const key = answerKey(currentStep.id, q.id);
                    const current = answers[key];
                    const selected = Array.isArray(current)
                      ? current.includes(opt)
                      : current === opt;
                    const inputType = q.allowMultiple ? "checkbox" : "radio";

                    return (
                      <label
                        key={opt}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-[#243230] hover:bg-[#fbfaf7]"
                      >
                        <input
                          type={inputType}
                          name={q.allowMultiple ? undefined : key}
                          checked={selected}
                          onChange={(e) => {
                            if (q.allowMultiple) {
                              const arr = Array.isArray(current) ? current : [];
                              const next = e.target.checked
                                ? [...new Set([...arr, opt])]
                                : arr.filter((v) => v !== opt);
                              setAnswer(currentStep.id, q.id, next);
                            } else {
                              setAnswer(currentStep.id, q.id, opt);
                            }
                          }}
                          className="h-4 w-4 rounded border-[#d4cdc2] text-theme-status-success focus:ring-[#2f6f5b]/20"
                        />
                        <span className="flex-1">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <textarea
                  value={(answers[answerKey(currentStep.id, q.id)] as string | undefined) ?? ""}
                  onChange={(e) => setAnswer(currentStep.id, q.id, e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-gentle border border-accent/80 bg-background px-4 py-3 text-sm outline-none focus:border-primary/40"
                  placeholder="Your answer..."
                />
              )}
            </label>
          ))}
        </div>
      ) : isPaymentScreen ? (
        <div className="rounded-xl border border-[#e3f0eb] bg-[#f3faf7] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-theme-status-success">
            Final step
          </p>
          <h3 className="mt-2 font-display text-xl font-semibold text-[#243230]">
            Confirm membership
          </h3>
          <p className="mt-2 text-sm leading-6 text-text-primary/60">
            You are joining <strong>{club.title}</strong>. Upon approval, this amount will be
            charged from your wallet each month.
          </p>
          <div className="mt-5 flex items-baseline justify-between gap-4 rounded-lg bg-white px-4 py-4 shadow-[0_8px_24px_-20px_rgba(47,63,56,0.15)]">
            <span className="text-sm font-medium text-[#5c6664]">Monthly membership</span>
            <span className="font-display text-2xl font-semibold text-theme-status-success">
              {formatCurrency(club.monthlyFee)}
            </span>
          </div>
          <p className="mt-3 text-xs text-text-primary/50">
            Billing starts after the club owner approves your request.
          </p>
        </div>
      ) : (
        <label className="block text-sm font-medium text-text-primary/75">
          Why do you want to join?
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="mt-2 w-full rounded-gentle border border-accent/80 bg-background px-4 py-3 text-sm outline-none focus:border-primary/40"
            placeholder="Share what draws you to this circle..."
          />
        </label>
      )}

      {error ? <p className="text-sm text-theme-status-error">{error}</p> : null}

      <div className="flex justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={handleBack}
          disabled={screenIndex === 0 || isSubmitting}
          className="rounded-full border border-accent px-5 py-2 text-sm font-semibold text-text-primary/70 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          disabled={!currentStepValid() || isSubmitting}
          onClick={handleNext}
          className="rounded-full bg-text-secondary px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isSubmitting
            ? "Submitting…"
            : isPaymentScreen || !hasOnboarding
              ? "Submit request"
              : "Continue"}
        </button>
      </div>
    </div>
  );
}
