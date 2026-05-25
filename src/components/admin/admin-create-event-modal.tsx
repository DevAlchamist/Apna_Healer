"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { apiMutation } from "@/lib/api-client";
import { morphTransition } from "@/components/ui/fade-in";

type AdminCreateEventModalProps = {
  open: boolean;
  onClose: () => void;
};

const fieldLabel =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]";
const fieldInput =
  "mt-2 w-full rounded-xl border border-[#e4ddd3] bg-[#f8f6f2] px-3.5 py-2.5 text-sm text-[#243230] outline-none transition placeholder:text-[#b1a89d] focus:border-[#2f6f5b] focus:bg-white focus:ring-2 focus:ring-[#2f6f5b]/12";

const CATEGORIES = ["Workshop", "Meditation", "Healing", "Gathering", "Breathwork"];

const emptyForm = {
  title: "",
  subtitle: "",
  description: "",
  category: "Gathering",
  venue: "",
  mode: "IN_PERSON" as "IN_PERSON" | "VIRTUAL",
  capacity: "30",
  basePrice: "0",
  membersPay: true,
  nonMembersPay: true,
  startsAt: "",
  heroImageUrl: "",
  facilitatorName: "",
  facilitatorRole: "",
  status: "PUBLISHED" as "DRAFT" | "PUBLISHED",
};

export function AdminCreateEventModal({ open, onClose }: AdminCreateEventModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setForm(emptyForm);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const createMutation = useMutation({
    mutationFn: () => {
      const heroUrl = form.heroImageUrl.trim();
      return apiMutation("/api/admin/events", "POST", {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        description: form.description.trim() || null,
        category: form.category,
        venue: form.venue.trim() || null,
        mode: form.mode,
        capacity: Number(form.capacity),
        basePrice: Number(form.basePrice),
        membersPay: form.membersPay,
        nonMembersPay: form.nonMembersPay,
        startsAt: new Date(form.startsAt).toISOString(),
        heroImageUrl: heroUrl || null,
        facilitatorName: form.facilitatorName.trim() || null,
        facilitatorRole: form.facilitatorRole.trim() || null,
        status: form.status,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-events"] });
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
            aria-labelledby="create-event-title"
            className="max-h-[min(92vh,900px)] w-full max-w-[680px] overflow-y-auto rounded-[28px] border border-[#e8e4dc] bg-[#faf9f6] shadow-[0_32px_80px_-24px_rgba(26,40,36,0.35)]"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={morphTransition}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 border-b border-[#ebe6de] bg-[#faf9f6]/95 px-8 py-6 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={fieldLabel}>New event</p>
                  <h2
                    id="create-event-title"
                    className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em] text-[#1f2827]"
                  >
                    Create event
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#6b7573]">
                    Add a platform-wide gathering or a session for a club. Members and guests can
                    register once the event is published.
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
                <label className={fieldLabel} htmlFor="event-title">
                  Event title
                </label>
                <input
                  id="event-title"
                  required
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Sunset Sound Immersion"
                  className={fieldInput}
                />
              </div>

              <div>
                <label className={fieldLabel} htmlFor="event-subtitle">
                  Short subtitle
                </label>
                <input
                  id="event-subtitle"
                  value={form.subtitle}
                  onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
                  placeholder="One line for the listing card"
                  className={fieldInput}
                />
              </div>

              <div>
                <label className={fieldLabel} htmlFor="event-description">
                  Description
                </label>
                <textarea
                  id="event-description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="What will attendees experience?"
                  className={fieldInput}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={fieldLabel} htmlFor="event-category">
                    Category
                  </label>
                  <select
                    id="event-category"
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    className={fieldInput}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={fieldLabel} htmlFor="event-mode">
                    Format
                  </label>
                  <select
                    id="event-mode"
                    value={form.mode}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        mode: e.target.value as "IN_PERSON" | "VIRTUAL",
                      }))
                    }
                    className={fieldInput}
                  >
                    <option value="IN_PERSON">In person</option>
                    <option value="VIRTUAL">Virtual</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={fieldLabel} htmlFor="event-starts">
                    Starts at
                  </label>
                  <input
                    id="event-starts"
                    required
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))}
                    className={fieldInput}
                  />
                </div>
                <div>
                  <label className={fieldLabel} htmlFor="event-venue">
                    Venue / link
                  </label>
                  <input
                    id="event-venue"
                    value={form.venue}
                    onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))}
                    placeholder="Studio name or meeting URL"
                    className={fieldInput}
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <label className={fieldLabel} htmlFor="event-capacity">
                    Capacity
                  </label>
                  <input
                    id="event-capacity"
                    type="number"
                    min={1}
                    required
                    value={form.capacity}
                    onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))}
                    className={fieldInput}
                  />
                </div>
                <div>
                  <label className={fieldLabel} htmlFor="event-price">
                    Base price (₹)
                  </label>
                  <input
                    id="event-price"
                    type="number"
                    min={0}
                    value={form.basePrice}
                    onChange={(e) => setForm((p) => ({ ...p, basePrice: e.target.value }))}
                    className={fieldInput}
                  />
                </div>
                <div>
                  <label className={fieldLabel} htmlFor="event-status">
                    Status
                  </label>
                  <select
                    id="event-status"
                    value={form.status}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        status: e.target.value as "DRAFT" | "PUBLISHED",
                      }))
                    }
                    className={fieldInput}
                  >
                    <option value="PUBLISHED">Published (active)</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={fieldLabel} htmlFor="event-facilitator">
                    Facilitator name
                  </label>
                  <input
                    id="event-facilitator"
                    value={form.facilitatorName}
                    onChange={(e) => setForm((p) => ({ ...p, facilitatorName: e.target.value }))}
                    placeholder="Sarah Tannen"
                    className={fieldInput}
                  />
                </div>
                <div>
                  <label className={fieldLabel} htmlFor="event-facilitator-role">
                    Facilitator role
                  </label>
                  <input
                    id="event-facilitator-role"
                    value={form.facilitatorRole}
                    onChange={(e) => setForm((p) => ({ ...p, facilitatorRole: e.target.value }))}
                    placeholder="Sound healer"
                    className={fieldInput}
                  />
                </div>
              </div>

              <div>
                <label className={fieldLabel} htmlFor="event-hero">
                  Hero image URL
                </label>
                <input
                  id="event-hero"
                  type="url"
                  value={form.heroImageUrl}
                  onChange={(e) => setForm((p) => ({ ...p, heroImageUrl: e.target.value }))}
                  placeholder="https://…"
                  className={fieldInput}
                />
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-[#5f6b69]">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.membersPay}
                    onChange={(e) => setForm((p) => ({ ...p, membersPay: e.target.checked }))}
                    className="rounded border-[#d5dbd8]"
                  />
                  Members pay
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.nonMembersPay}
                    onChange={(e) => setForm((p) => ({ ...p, nonMembersPay: e.target.checked }))}
                    className="rounded border-[#d5dbd8]"
                  />
                  Guests pay
                </label>
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
                  {createMutation.isPending
                    ? "Creating…"
                    : form.status === "DRAFT"
                      ? "Save draft"
                      : "Publish event"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
