"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { apiMutation } from "@/lib/api-client";
import { morphTransition } from "@/components/ui/fade-in";

type AdminCreateClubModalProps = {
  open: boolean;
  onClose: () => void;
};

const fieldLabel =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]";
const fieldInput =
  "mt-2 w-full rounded-xl border border-[#e4ddd3] bg-[#f8f6f2] px-3.5 py-2.5 text-sm text-[#243230] outline-none transition placeholder:text-[#b1a89d] focus:border-[#2f6f5b] focus:bg-white focus:ring-2 focus:ring-[#2f6f5b]/12";

const emptyForm = {
  title: "",
  subtitle: "",
  purpose: "",
  description: "",
  heroImageUrl: "",
  monthlyFee: "299",
  visibility: "PUBLIC" as "PUBLIC" | "PRIVATE",
  questions:
    "What brings you to this circle?\nHow can we support your journey?",
};

export function AdminCreateClubModal({ open, onClose }: AdminCreateClubModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setForm(emptyForm);
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
      const onboardingSteps = form.questions
        .split("\n")
        .map((q) => q.trim())
        .filter(Boolean)
        .map((question, i) => ({ question, required: true, sortOrder: i }));

      const heroUrl = form.heroImageUrl.trim();
      const purposeText = [form.purpose.trim(), tags.length ? `Tags: ${tags.join(", ")}` : ""]
        .filter(Boolean)
        .join("\n");

      return apiMutation("/api/admin/clubs", "POST", {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        purpose: purposeText || null,
        description: form.description.trim() || null,
        heroImageUrl: heroUrl || null,
        monthlyFee: Number(form.monthlyFee),
        visibility: form.visibility,
        galleryUrls: [],
        onboardingSteps,
        reviews: [],
      });
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
            className="max-h-[min(92vh,880px)] w-full max-w-[640px] overflow-y-auto rounded-[28px] border border-[#e8e4dc] bg-[#faf9f6] shadow-[0_32px_80px_-24px_rgba(26,40,36,0.35)]"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={morphTransition}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 border-b border-[#ebe6de] bg-[#faf9f6]/95 px-8 py-6 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={fieldLabel}>New sanctuary</p>
                  <h2
                    id="create-club-title"
                    className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em] text-[#1f2827]"
                  >
                    Create a club
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#6b7573]">
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
                <label className={fieldLabel} htmlFor="club-title">
                  Club name
                </label>
                <input
                  id="club-title"
                  required
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Mindful Movement"
                  className={fieldInput}
                />
              </div>

              <div>
                <label className={fieldLabel} htmlFor="club-subtitle">
                  Short tagline
                </label>
                <textarea
                  id="club-subtitle"
                  required
                  rows={2}
                  value={form.subtitle}
                  onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
                  placeholder="A one-line invitation for new members"
                  className={fieldInput}
                />
              </div>

              <div>
                <label className={fieldLabel} htmlFor="club-purpose">
                  Purpose
                </label>
                <textarea
                  id="club-purpose"
                  rows={2}
                  value={form.purpose}
                  onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))}
                  placeholder="Why does this circle exist?"
                  className={fieldInput}
                />
              </div>

              <div>
                <label className={fieldLabel} htmlFor="club-description">
                  Full description
                </label>
                <textarea
                  id="club-description"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Describe rituals, rhythm, and who this space is for..."
                  className={fieldInput}
                />
              </div>

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
                        className="text-[#8a8278] hover:text-[#243230]"
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
                    className="mt-0 shrink-0 rounded-xl border border-[#e4ddd3] bg-white px-4 py-2.5 text-sm font-semibold text-[#2f745f] transition hover:border-[#2f745f]/30"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={fieldLabel} htmlFor="club-fee">
                    Monthly fee (₹)
                  </label>
                  <input
                    id="club-fee"
                    type="number"
                    min={1}
                    required
                    value={form.monthlyFee}
                    onChange={(e) => setForm((p) => ({ ...p, monthlyFee: e.target.value }))}
                    className={fieldInput}
                  />
                </div>
                <div>
                  <label className={fieldLabel} htmlFor="club-visibility">
                    Visibility
                  </label>
                  <select
                    id="club-visibility"
                    value={form.visibility}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        visibility: e.target.value as "PUBLIC" | "PRIVATE",
                      }))
                    }
                    className={fieldInput}
                  >
                    <option value="PUBLIC">Public — listed for all</option>
                    <option value="PRIVATE">Private — invite only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={fieldLabel} htmlFor="club-hero">
                  Hero image URL
                </label>
                <input
                  id="club-hero"
                  type="url"
                  value={form.heroImageUrl}
                  onChange={(e) => setForm((p) => ({ ...p, heroImageUrl: e.target.value }))}
                  placeholder="https://…"
                  className={fieldInput}
                />
              </div>

              <div>
                <label className={fieldLabel} htmlFor="club-questions">
                  Member onboarding questions
                </label>
                <textarea
                  id="club-questions"
                  rows={4}
                  value={form.questions}
                  onChange={(e) => setForm((p) => ({ ...p, questions: e.target.value }))}
                  placeholder="One question per line"
                  className={fieldInput}
                />
              </div>

              {error ? (
                <p className="rounded-xl bg-[#fdecea] px-4 py-3 text-sm text-[#b42318]">{error}</p>
              ) : null}

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#ebe6de] pt-6">
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
                  className="rounded-full bg-[#2f745f] px-8 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-10px_rgba(47,116,95,0.55)] transition hover:bg-[#245d4c] disabled:opacity-50 active:scale-[0.98]"
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
