"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { EventFormFields } from "@/components/events/event-form-fields";
import { morphTransition } from "@/components/ui/fade-in";
import { apiFetch, apiMutation } from "@/lib/api-client";
import { buildEventApiPayload, emptyEventForm, type EventFormState } from "@/lib/event-form";
import type { ApiClubDetail } from "@/types/api";

type AdminCreateEventModalProps = {
  open: boolean;
  onClose: () => void;
};

export function AdminCreateEventModal({ open, onClose }: AdminCreateEventModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<EventFormState>(emptyEventForm());
  const [error, setError] = useState<string | null>(null);

  const clubsQuery = useQuery({
    queryKey: ["admin-clubs"],
    queryFn: () => apiFetch<ApiClubDetail[]>("/api/admin/clubs"),
    enabled: open,
  });

  useEffect(() => {
    if (!open) {
      setForm(emptyEventForm());
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
    mutationFn: () => apiMutation("/api/admin/events", "POST", buildEventApiPayload(form)),
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
            className="max-h-[min(92vh,900px)] w-full max-w-[680px] overflow-y-auto rounded-[28px] border border-theme-muted bg-theme-surface-muted shadow-[0_32px_80px_-24px_rgba(26,40,36,0.35)]"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={morphTransition}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 border-b border-theme-muted bg-theme-surface-muted/95 px-8 py-6 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]">
                    New event
                  </p>
                  <h2
                    id="create-event-title"
                    className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em] text-theme-heading"
                  >
                    Create event
                  </h2>
                </div>
                <button type="button" aria-label="Close" onClick={onClose} className="text-2xl">
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
              <EventFormFields
                form={form}
                onChange={(patch) => setForm((p) => ({ ...p, ...patch }))}
                showStatus
                showClubPicker
                clubs={clubsQuery.data ?? []}
              />
              {error ? (
                <p className="rounded-xl bg-[#fdecea] px-4 py-3 text-sm text-[#b42318]">{error}</p>
              ) : null}
              <div className="flex justify-end gap-3 border-t border-theme-muted pt-6">
                <button type="button" onClick={onClose} disabled={createMutation.isPending}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-full bg-theme-button-primary px-8 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {createMutation.isPending ? "Creating…" : "Publish event"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
