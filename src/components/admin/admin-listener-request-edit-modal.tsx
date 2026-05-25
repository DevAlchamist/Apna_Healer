"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { morphTransition } from "@/components/ui/fade-in";

export type EditModalRequest = {
  id: string;
  preferredDate: string;
  preferredTime: string;
  duration: number;
  emotionalTags: string[];
  preferredTone: string | null;
  preferredLanguage: string | null;
  note: string | null;
  user: { name: string | null; email: string };
};

type UpdatePayload = {
  preferredDate?: string;
  preferredTime?: string;
  duration?: number;
  emotionalTags?: string[];
  preferredTone?: string | null;
  preferredLanguage?: string | null;
  note?: string | null;
};

type AdminListenerRequestEditModalProps = {
  open: boolean;
  request: EditModalRequest | null;
  isPending: boolean;
  onClose: () => void;
  onSave: (payload: UpdatePayload) => void;
};

export function AdminListenerRequestEditModal({
  open,
  request,
  isPending,
  onClose,
  onSave,
}: AdminListenerRequestEditModalProps) {
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [tagsText, setTagsText] = useState("");
  const [preferredTone, setPreferredTone] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open || !request) return;
    setPreferredDate(request.preferredDate.slice(0, 10));
    setPreferredTime(request.preferredTime);
    setDuration(request.duration);
    setTagsText(request.emotionalTags.join(", "));
    setPreferredTone(request.preferredTone ?? "");
    setPreferredLanguage(request.preferredLanguage ?? "");
    setNote(request.note ?? "");
  }, [open, request]);

  if (!open || !request) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const emotionalTags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onSave({
      preferredDate,
      preferredTime,
      duration,
      emotionalTags,
      preferredTone: preferredTone.trim() || null,
      preferredLanguage: preferredLanguage.trim() || null,
      note: note.trim() || null,
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-100 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-listener-request-title"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.button
          type="button"
          aria-label="Close"
          className="absolute inset-0 bg-[#0d2f2a]/40 backdrop-blur-[4px]"
          onClick={onClose}
        />
        <motion.form
          onSubmit={handleSubmit}
          className="relative z-10 w-full max-w-lg overflow-hidden rounded-[1.25rem] border border-white/60 bg-white shadow-[0_28px_80px_-24px_rgb(13_47_42/50%)]"
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.99 }}
          transition={morphTransition}
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div className="border-b border-[#ebe6de] px-6 py-5">
            <h2
              id="edit-listener-request-title"
              className="font-display text-[20px] font-semibold tracking-tight text-[#243230]"
            >
              Edit session request
            </h2>
            <p className="mt-1 text-sm text-[#8a8278]">
              {request.user.name ?? request.user.email}
            </p>
          </motion.div>

          <motion.div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]">
                Preferred date
                <input
                  type="date"
                  required
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#e4ddd3] bg-[#f8f6f2] px-3 py-2.5 text-sm text-[#243230] outline-none focus:border-[#2f6f5b] focus:bg-white"
                />
              </label>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]">
                Preferred time
                <input
                  type="time"
                  required
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#e4ddd3] bg-[#f8f6f2] px-3 py-2.5 text-sm text-[#243230] outline-none focus:border-[#2f6f5b] focus:bg-white"
                />
              </label>
            </div>

            <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]">
              Duration (minutes)
              <input
                type="number"
                min={15}
                max={120}
                step={15}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="mt-1.5 w-full rounded-xl border border-[#e4ddd3] bg-[#f8f6f2] px-3 py-2.5 text-sm text-[#243230] outline-none focus:border-[#2f6f5b] focus:bg-white"
              />
            </label>

            <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]">
              Emotional tags (comma-separated)
              <input
                type="text"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="grief, anxiety, loneliness"
                className="mt-1.5 w-full rounded-xl border border-[#e4ddd3] bg-[#f8f6f2] px-3 py-2.5 text-sm text-[#243230] outline-none focus:border-[#2f6f5b] focus:bg-white"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]">
                Preferred tone
                <input
                  type="text"
                  value={preferredTone}
                  onChange={(e) => setPreferredTone(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#e4ddd3] bg-[#f8f6f2] px-3 py-2.5 text-sm text-[#243230] outline-none focus:border-[#2f6f5b] focus:bg-white"
                />
              </label>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]">
                Language
                <input
                  type="text"
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#e4ddd3] bg-[#f8f6f2] px-3 py-2.5 text-sm text-[#243230] outline-none focus:border-[#2f6f5b] focus:bg-white"
                />
              </label>
            </div>

            <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]">
              Member note
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                className="mt-1.5 w-full resize-y rounded-xl border border-[#e4ddd3] bg-[#f8f6f2] px-3 py-2.5 text-sm text-[#243230] outline-none focus:border-[#2f6f5b] focus:bg-white"
              />
            </label>
          </motion.div>

          <motion.div className="flex items-center justify-between gap-4 border-t border-[#ebe6de] bg-[#faf8f5] px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="text-sm font-semibold text-[#5c574f] hover:text-[#243230] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-[#2f6f5b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e4a3d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save changes"}
            </button>
          </motion.div>
        </motion.form>
      </motion.div>
    </AnimatePresence>
  );
}
