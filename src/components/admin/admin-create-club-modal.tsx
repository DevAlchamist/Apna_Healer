"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ClubFormFields } from "@/components/clubs/club-form-fields";
import {
  DEFAULT_ONBOARDING_STEPS,
} from "@/components/clubs/club-onboarding-steps-editor";
import { morphTransition } from "@/components/ui/fade-in";
import { apiMutation } from "@/lib/api-client";
import { buildClubApiPayload, emptyClubForm, type ClubFormState } from "@/lib/club-form";

type AdminCreateClubModalProps = {
  open: boolean;
  onClose: () => void;
};

const fieldLabel =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]";
const fieldInput =
  "mt-2 w-full rounded-xl border border-theme-muted bg-theme-surface-muted px-3.5 py-2.5 text-sm text-theme-heading outline-none transition placeholder:text-[#b1a89d] focus:border-[#2f6f5b] focus:bg-white focus:ring-2 focus:ring-[#2f6f5b]/12";

export function AdminCreateClubModal({ open, onClose }: AdminCreateClubModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ClubFormState>(emptyClubForm);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({
        ...emptyClubForm(),
        onboardingSteps: DEFAULT_ONBOARDING_STEPS.map((step) => ({
          ...step,
          id: crypto.randomUUID(),
        })),
      });
      setTagInput("");
      setTags([]);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || tags.includes(t) || tags.length >= 6) return;
    setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const createMutation = useMutation({
    mutationFn: () => {
      if (form.onboardingSteps.length === 0) {
        throw new Error("Add at least one onboarding step with questions.");
      }
      const purposeSuffix = tags.length ? `Tags: ${tags.join(", ")}` : undefined;
      return apiMutation("/api/admin/clubs", "POST", buildClubApiPayload(form, { purposeSuffix }));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-clubs"] });
      onClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a2422]/40 px-4 py-8 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-labelledby="create-club-title"
            className="max-h-[min(92vh,880px)] w-full max-w-[640px] overflow-y-auto rounded-[28px] border border-theme-muted bg-theme-surface-muted shadow-[0_32px_80px_-24px_rgba(26,40,36,0.35)]"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={morphTransition}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 border-b border-theme-muted bg-theme-surface-muted/95 px-8 py-6 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={fieldLabel}>New sanctuary</p>
                  <h2
                    id="create-club-title"
                    className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em] text-theme-heading"
                  >
                    Create a club
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-theme-muted">
                    Curate a new community space in The Digital Atrium. The club will be active
                    immediately for members to discover.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={onClose}
                  className="grid h-9 w-9 shrink-0 place-content-center rounded-full text-xl text-[#9ca4a2] transition hover:bg-[#f0ede8]"
                >
                  ×
                </button>
              </div>
            </div>

            <form
              className="space-y-5 px-8 py-6"
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                createMutation.mutate();
              }}
            >
              <div>
                <label className={fieldLabel}>Tags</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#ebe4d6] px-3 py-1 text-xs font-semibold text-[#5c5348]"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                        className="text-[#8a8278] hover:text-theme-heading"
                        aria-label={`Remove ${tag}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Wellness, Weekly meets…"
                    className={`${fieldInput} mt-0 flex-1`}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="mt-0 shrink-0 rounded-xl border border-theme-muted bg-white px-4 py-2.5 text-sm font-semibold text-theme-status-success transition hover:border-[#2f745f]/30"
                  >
                    Add
                  </button>
                </div>
              </div>

              <ClubFormFields
                form={form}
                onChange={(patch) => setForm((p) => ({ ...p, ...patch }))}
                labelClassName={fieldLabel}
                inputClassName={fieldInput}
              />

              {error ? (
                <p className="rounded-xl bg-[#fdecea] px-4 py-3 text-sm text-[#b42318]">{error}</p>
              ) : null}

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-theme-muted pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={createMutation.isPending}
                  className="rounded-full bg-[#f0f0ed] px-6 py-2.5 text-sm font-semibold text-[#3d4543] transition hover:bg-[#e6e6e3] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-full bg-theme-button-primary px-8 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-10px_rgba(47,116,95,0.55)] transition hover:bg-theme-button-primary-hover disabled:opacity-50 active:scale-[0.98]"
                >
                  {createMutation.isPending ? "Creating…" : "Create club"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
