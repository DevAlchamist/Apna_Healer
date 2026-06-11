"use client";

import { useId } from "react";
import type { OnboardingStepInput } from "@/server/services/club-utils";

export type OnboardingQuestionDraft = {
  id: string;
  question: string;
  required: boolean;
  type: "TEXT" | "CHOICE";
  options: string[];
  allowMultiple: boolean;
};

export type OnboardingStepDraft = {
  id: string;
  title: string;
  description: string;
  questions: OnboardingQuestionDraft[];
};

export function createQuestionDraft(
  partial?: Partial<Pick<OnboardingQuestionDraft, "question" | "required">>,
): OnboardingQuestionDraft {
  return {
    id: crypto.randomUUID(),
    question: partial?.question ?? "",
    required: partial?.required ?? true,
    type: "TEXT",
    options: [],
    allowMultiple: false,
  };
}

export function createOnboardingStepDraft(
  partial?: Partial<Pick<OnboardingStepDraft, "title" | "description" | "questions">>,
): OnboardingStepDraft {
  return {
    id: crypto.randomUUID(),
    title: partial?.title ?? "",
    description: partial?.description ?? "",
    questions: partial?.questions ?? [createQuestionDraft()],
  };
}

export const ONBOARDING_CHOICE_PRESETS: { label: string; options: string[] }[] = [
  { label: "Yes / No", options: ["Yes", "No"] },
  { label: "1 – 4", options: ["1", "2", "3", "4"] },
  { label: "1 – 5", options: ["1", "2", "3", "4", "5"] },
  { label: "Agree scale", options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"] },
  { label: "Frequency", options: ["Daily", "Weekly", "Monthly", "Rarely", "Never"] },
];

export const DEFAULT_ONBOARDING_STEPS: OnboardingStepDraft[] = [
  createOnboardingStepDraft({
    title: "About you",
    description: "Help the circle understand who you are and what you seek.",
    questions: [
      createQuestionDraft({ question: "What brings you to this circle?", required: true }),
      createQuestionDraft({ question: "What support are you hoping for?", required: true }),
    ],
  }),
  createOnboardingStepDraft({
    title: "Your commitment",
    description: "A few details so we can welcome you thoughtfully.",
    questions: [createQuestionDraft({ question: "How often can you participate?", required: true })],
  }),
];

export function onboardingStepsToPayload(steps: OnboardingStepDraft[]): OnboardingStepInput[] {
  return steps
    .map((step, index) => ({
      title: step.title.trim(),
      description: step.description.trim() || null,
      sortOrder: index,
      questions: step.questions
        .map((q, qi) => ({
          question: q.question.trim(),
          required: q.required,
          type: q.type,
          options: q.type === "CHOICE" ? q.options.map((o) => o.trim()).filter(Boolean) : [],
          allowMultiple: q.type === "CHOICE" ? q.allowMultiple : false,
          sortOrder: qi,
        }))
        .filter((q) => q.question.length > 0),
    }))
    .filter((step) => step.title.length > 0 && step.questions.length > 0);
}

type ClubOnboardingStepsEditorProps = {
  steps: OnboardingStepDraft[];
  onChange: (steps: OnboardingStepDraft[]) => void;
  labelClassName?: string;
  inputClassName?: string;
  textareaClassName?: string;
  maxSteps?: number;
};

export function ClubOnboardingStepsEditor({
  steps,
  onChange,
  labelClassName = "text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]",
  inputClassName = "mt-2 w-full rounded-xl border border-[#e4ddd3] bg-[#f8f6f2] px-3.5 py-2.5 text-sm text-[#243230] outline-none transition placeholder:text-[#b1a89d] focus:border-[#2f6f5b] focus:bg-white focus:ring-2 focus:ring-[#2f6f5b]/12",
  textareaClassName = "mt-2 w-full rounded-xl border border-[#e4ddd3] bg-[#f8f6f2] px-3.5 py-2.5 text-sm text-[#243230] outline-none transition placeholder:text-[#b1a89d] focus:border-[#2f6f5b] focus:bg-white focus:ring-2 focus:ring-[#2f6f5b]/12",
  maxSteps = 15,
}: ClubOnboardingStepsEditorProps) {
  const headingId = useId();

  function updateStep(stepId: string, patch: Partial<OnboardingStepDraft>) {
    onChange(steps.map((step) => (step.id === stepId ? { ...step, ...patch } : step)));
  }

  function removeStep(stepId: string) {
    onChange(steps.filter((step) => step.id !== stepId));
  }

  function moveStep(stepId: string, direction: "up" | "down") {
    const index = steps.findIndex((step) => step.id === stepId);
    if (index < 0) return;
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
  }

  function addStep() {
    if (steps.length >= maxSteps) return;
    onChange([...steps, createOnboardingStepDraft({ title: `Step ${steps.length + 1}` })]);
  }

  function updateQuestion(stepId: string, questionId: string, patch: Partial<OnboardingQuestionDraft>) {
    onChange(
      steps.map((step) =>
        step.id === stepId
          ? {
              ...step,
              questions: step.questions.map((q) =>
                q.id === questionId ? { ...q, ...patch } : q,
              ),
            }
          : step,
      ),
    );
  }

  function addQuestion(stepId: string) {
    onChange(
      steps.map((step) =>
        step.id === stepId
          ? { ...step, questions: [...step.questions, createQuestionDraft()] }
          : step,
      ),
    );
  }

  function removeQuestion(stepId: string, questionId: string) {
    onChange(
      steps.map((step) =>
        step.id === stepId
          ? { ...step, questions: step.questions.filter((q) => q.id !== questionId) }
          : step,
      ),
    );
  }

  function setChoiceOption(stepId: string, questionId: string, options: string[]) {
    updateQuestion(stepId, questionId, { options });
  }

  function addChoiceOption(stepId: string, questionId: string) {
    const step = steps.find((s) => s.id === stepId);
    const q = step?.questions.find((qq) => qq.id === questionId);
    if (!q) return;
    setChoiceOption(stepId, questionId, [...q.options, ""]);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p id={headingId} className={labelClassName}>
            Member onboarding flow
          </p>
          <p className="mt-1 text-sm text-[#6b7573]">
            Build steps with a name and description. Add as many questions as you need per step.
            Members see a payment step at the end.
          </p>
        </div>
        <button
          type="button"
          onClick={addStep}
          disabled={steps.length >= maxSteps}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#d4cdc2] bg-white px-4 py-2 text-sm font-semibold text-theme-status-success transition hover:border-[#2f745f]/35 hover:bg-[#f3faf7] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-base leading-none" aria-hidden>
            +
          </span>
          Add step
        </button>
      </div>

      <div className="mt-4 space-y-4" role="list" aria-labelledby={headingId}>
        {steps.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#e4ddd3] bg-[#f8f6f2] px-4 py-6 text-center text-sm text-[#6b7573]">
            No onboarding steps yet. Add at least one step with questions for new members.
          </div>
        ) : (
          steps.map((step, stepIndex) => (
            <div
              key={step.id}
              role="listitem"
              className="rounded-xl border border-[#ebe6de] bg-white p-4 shadow-[0_8px_24px_-20px_rgba(47,63,56,0.2)]"
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9d9287]">
                  Step {stepIndex + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveStep(step.id, "up")}
                    disabled={stepIndex === 0}
                    aria-label={`Move step ${stepIndex + 1} up`}
                    className="grid h-8 w-8 place-content-center rounded-lg text-[#6b7573] transition hover:bg-[#f3efe9] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStep(step.id, "down")}
                    disabled={stepIndex === steps.length - 1}
                    aria-label={`Move step ${stepIndex + 1} down`}
                    className="grid h-8 w-8 place-content-center rounded-lg text-[#6b7573] transition hover:bg-[#f3efe9] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStep(step.id)}
                    aria-label={`Remove step ${stepIndex + 1}`}
                    className="grid h-8 w-8 place-content-center rounded-lg text-[#9d9287] transition hover:bg-[#fdecea] hover:text-theme-status-error"
                  >
                    ×
                  </button>
                </div>
              </div>

              <label className="block text-sm font-medium text-[#243230]">
                Step name
                <input
                  value={step.title}
                  onChange={(e) => updateStep(step.id, { title: e.target.value })}
                  placeholder="e.g. About you"
                  className={inputClassName}
                />
              </label>

              <label className="mt-3 block text-sm font-medium text-[#243230]">
                Step description
                <textarea
                  value={step.description}
                  onChange={(e) => updateStep(step.id, { description: e.target.value })}
                  rows={2}
                  placeholder="What should members know before answering these questions?"
                  className={textareaClassName}
                />
              </label>

              <div className="mt-4 space-y-3 border-t border-[#f0eeea] pt-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9d9287]">
                    Questions in this step
                  </p>
                  <button
                    type="button"
                    onClick={() => addQuestion(step.id)}
                    className="text-xs font-semibold text-theme-status-success hover:underline"
                  >
                    + Add question
                  </button>
                </div>

                {step.questions.map((question, qIndex) => (
                  <div
                    key={question.id}
                    className="rounded-lg border border-[#f0eeea] bg-[#fbfaf7] p-3"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-[#b1a89d]">
                        Question {qIndex + 1}
                      </span>
                      {step.questions.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeQuestion(step.id, question.id)}
                          className="text-xs font-semibold text-theme-status-error hover:underline"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                    <input
                      value={question.question}
                      onChange={(e) =>
                        updateQuestion(step.id, question.id, { question: e.target.value })
                      }
                      placeholder="e.g. What are you hoping to explore?"
                      className={inputClassName}
                    />

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="block text-sm font-medium text-[#243230]">
                        Answer type
                        <select
                          value={question.type}
                          onChange={(e) => {
                            const nextType = e.target.value as "TEXT" | "CHOICE";
                            updateQuestion(step.id, question.id, {
                              type: nextType,
                              options: nextType === "CHOICE" ? (question.options.length ? question.options : ["Option 1", "Option 2"]) : [],
                              allowMultiple: nextType === "CHOICE" ? question.allowMultiple : false,
                            });
                          }}
                          className={inputClassName}
                        >
                          <option value="TEXT">Text input</option>
                          <option value="CHOICE">Multiple choice</option>
                        </select>
                      </label>

                      {question.type === "CHOICE" ? (
                        <label className="mt-7 inline-flex cursor-pointer items-center gap-2 text-sm text-[#5c6664]">
                          <input
                            type="checkbox"
                            checked={question.allowMultiple}
                            onChange={(e) =>
                              updateQuestion(step.id, question.id, { allowMultiple: e.target.checked })
                            }
                            className="h-4 w-4 rounded border-[#d4cdc2] text-theme-status-success focus:ring-[#2f6f5b]/20"
                          />
                          Allow multiple selections
                        </label>
                      ) : null}
                    </div>

                    <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm text-[#5c6664]">
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(e) =>
                          updateQuestion(step.id, question.id, { required: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-[#d4cdc2] text-theme-status-success focus:ring-[#2f6f5b]/20"
                      />
                      Required answer
                    </label>

                    {question.type === "CHOICE" ? (
                      <div className="mt-3 rounded-lg border border-[#efe9df] bg-white p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9d9287]">
                            Options
                          </p>
                          <button
                            type="button"
                            onClick={() => addChoiceOption(step.id, question.id)}
                            className="text-xs font-semibold text-theme-status-success hover:underline"
                          >
                            + Add option
                          </button>
                        </div>

                        <div className="mb-3 flex flex-wrap gap-2">
                          <span className="w-full text-[10px] font-semibold uppercase tracking-[0.1em] text-[#b1a89d]">
                            Quick presets
                          </span>
                          {ONBOARDING_CHOICE_PRESETS.map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() =>
                                setChoiceOption(step.id, question.id, [...preset.options])
                              }
                              className="rounded-full border border-[#e8e2d8] bg-[#faf8f4] px-2.5 py-1 text-[11px] font-semibold text-[#5c5348] transition hover:border-[#2f745f]/40 hover:text-theme-status-success"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>

                        <div className="space-y-2">
                          {(question.options.length ? question.options : ["Option 1", "Option 2"]).map((opt, oi) => (
                            <div key={`${question.id}-opt-${oi}`} className="flex items-center gap-2">
                              <input
                                value={opt}
                                onChange={(e) => {
                                  const next = [...(question.options.length ? question.options : ["Option 1", "Option 2"])];
                                  next[oi] = e.target.value;
                                  setChoiceOption(step.id, question.id, next);
                                }}
                                placeholder={`Option ${oi + 1}`}
                                className={inputClassName}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const next = (question.options.length ? question.options : ["Option 1", "Option 2"]).filter((_, idx) => idx !== oi);
                                  setChoiceOption(step.id, question.id, next.length ? next : ["Option 1", "Option 2"]);
                                }}
                                className="grid h-10 w-10 place-content-center rounded-lg text-[#9d9287] transition hover:bg-[#fdecea] hover:text-theme-status-error"
                                aria-label={`Remove option ${oi + 1}`}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
