"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { UserAvatarCircle } from "@/components/dashboard/user-avatar-circle";
import { morphTransition } from "@/components/ui/fade-in";
import { formatCurrency, formatShortDate } from "@/lib/display";
import type { ApiClubCreationRequest } from "@/types/api";

type AdminClubCreationReviewModalProps = {
  open: boolean;
  request: ApiClubCreationRequest | null;
  isPending: boolean;
  onClose: () => void;
  onReview: (status: "APPROVED" | "REJECTED") => void;
};

function questionTypeLabel(type: "TEXT" | "CHOICE", allowMultiple: boolean): string {
  if (type === "TEXT") return "Text answer";
  return allowMultiple ? "Multiple choice (checkboxes)" : "Single choice (radio)";
}

export function AdminClubCreationReviewModal({
  open,
  request,
  isPending,
  onClose,
  onReview,
}: AdminClubCreationReviewModalProps) {
  if (!open || !request) return null;

  const proposer = request.user?.name ?? request.user?.email ?? "Member";
  const description =
    request.description?.trim() ||
    request.purpose?.trim() ||
    request.subtitle?.trim() ||
    "No description provided.";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center bg-[#1a2322]/50 p-4 sm:items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="club-creation-review-title"
          className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[24px] border border-theme-muted bg-white shadow-[0_24px_64px_-24px_rgba(0,0,0,0.35)]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={morphTransition}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative h-44 shrink-0 bg-[#e8ebe9] sm:h-52">
            {request.heroImageUrl ? (
              <Image
                src={request.heroImageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-medium text-theme-muted">
                No cover image
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 grid h-9 w-9 place-content-center rounded-full bg-white/90 text-lg text-[#3d4543] shadow-sm transition hover:bg-white"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9d9287]">
              Club creation request
            </p>
            <h2
              id="club-creation-review-title"
              className="mt-2 font-display text-2xl font-semibold tracking-[-0.02em] text-theme-heading"
            >
              {request.title}
            </h2>
            {request.subtitle?.trim() ? (
              <p className="mt-1 text-sm font-medium text-theme-muted">{request.subtitle}</p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-theme-muted">
              <span className="inline-flex items-center gap-2">
                <UserAvatarCircle
                  name={request.user?.name}
                  email={request.user?.email}
                  image={request.user?.image}
                  className="h-7 w-7"
                />
                <span>
                  Proposed by <span className="font-semibold text-theme-status-success">{proposer}</span>
                </span>
              </span>
              <span>·</span>
              <span>{formatShortDate(request.createdAt)}</span>
              <span>·</span>
              <span className="font-semibold text-theme-heading">
                {Number(request.monthlyFee) > 0
                  ? `${formatCurrency(request.monthlyFee)}/mo`
                  : "Free to join"}
              </span>
            </div>

            <section className="mt-6 space-y-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9d9287]">
                  Description
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-theme-muted">{description}</p>
              </div>

              {request.purpose?.trim() && request.purpose.trim() !== description ? (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9d9287]">
                    Purpose
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-theme-muted">
                    {request.purpose}
                  </p>
                </div>
              ) : null}

              {request.galleryUrls.length > 0 ? (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9d9287]">
                    Gallery ({request.galleryUrls.length})
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {request.galleryUrls.map((url) => (
                      <div
                        key={url}
                        className="relative h-20 w-28 overflow-hidden rounded-xl border border-theme-muted bg-[#f0f0ed]"
                      >
                        <Image src={url} alt="" fill className="object-cover" sizes="112px" unoptimized />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {request.reviews.length > 0 ? (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9d9287]">
                    Testimonials ({request.reviews.length})
                  </h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {request.reviews.map((review) => (
                      <blockquote
                        key={`${review.authorLabel}-${review.quote.slice(0, 24)}`}
                        className="rounded-xl border border-theme-muted bg-theme-surface-muted p-4 text-sm"
                      >
                        <p className="leading-7 text-theme-muted">&ldquo;{review.quote}&rdquo;</p>
                        <footer className="mt-3 text-xs font-semibold text-theme-status-success">
                          — {review.authorLabel}
                        </footer>
                      </blockquote>
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9d9287]">
                  Onboarding ({request.onboardingStepCount} steps ·{" "}
                  {request.onboardingQuestionCount} questions)
                </h3>
                {request.onboardingSteps.length === 0 ? (
                  <p className="mt-2 text-sm text-theme-muted">No onboarding steps configured.</p>
                ) : (
                  <div className="mt-3 space-y-4">
                    {request.onboardingSteps.map((step, si) => (
                      <article
                        key={`${step.title}-${si}`}
                        className="rounded-xl border border-theme-muted bg-theme-surface-muted p-4"
                      >
                        <p className="text-sm font-semibold text-theme-heading">
                          Step {si + 1}: {step.title}
                        </p>
                        {step.description ? (
                          <p className="mt-1 text-sm text-theme-muted">{step.description}</p>
                        ) : null}
                        <ul className="mt-3 space-y-3">
                          {step.questions.map((q, qi) => (
                            <li
                              key={`${q.question}-${qi}`}
                              className="rounded-lg border border-[#f0eeea] bg-white px-3 py-2.5 text-sm"
                            >
                              <p className="font-medium text-theme-heading">
                                {qi + 1}. {q.question}
                                {q.required ? (
                                  <span className="ml-1 text-theme-status-error">*</span>
                                ) : null}
                              </p>
                              <p className="mt-1 text-xs text-[#9d9287]">
                                {questionTypeLabel(q.type, q.allowMultiple)}
                              </p>
                              {q.type === "CHOICE" && q.options.length > 0 ? (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {q.options.map((opt) => (
                                    <span
                                      key={opt}
                                      className="rounded-full bg-[#ebe4d6] px-2 py-0.5 text-[11px] font-semibold text-[#5c5348]"
                                    >
                                      {opt}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-theme-muted bg-theme-surface-muted px-6 py-4 sm:px-8">
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className="rounded-full border border-[#e4e8e6] bg-white px-5 py-2.5 text-sm font-semibold text-[#3d4543] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => onReview("REJECTED")}
              className="rounded-full bg-[#f0f0ed] px-5 py-2.5 text-sm font-semibold text-[#3d4543] disabled:opacity-50"
            >
              Reject
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => onReview("APPROVED")}
              className="rounded-full bg-theme-button-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isPending ? "Processing…" : "Approve club"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
