"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { EventFormFields } from "@/components/events/event-form-fields";
import { morphTransition } from "@/components/ui/fade-in";
import { apiFetch, apiMutation } from "@/lib/api-client";
import {
  buildEventApiPayload,
  emptyClubEventForm,
  eventFormFromDetail,
  type EventFormState,
} from "@/lib/event-form";
import type { ApiEventDetail, ApiEventFacilitatorOption } from "@/types/api";

type Props = {
  open: boolean;
  event: ApiEventDetail | null;
  onClose: () => void;
  apiPath: string;
  title: string;
  subtitle: string;
  queryKeys?: string[][];
};

export function EventEditModal({
  open,
  event,
  onClose,
  apiPath,
  title,
  subtitle,
  queryKeys = [],
}: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<EventFormState>(emptyClubEventForm());
  const [error, setError] = useState<string | null>(null);

  const facilitatorsQuery = useQuery({
    queryKey: ["event-facilitator-options"],
    queryFn: () => apiFetch<ApiEventFacilitatorOption[]>("/api/events/facilitator-options"),
    enabled: open,
  });

  useEffect(() => {
    if (!open || !event) return;
    const options = facilitatorsQuery.data ?? [];
    setForm(eventFormFromDetail(event, options));
    setError(null);
  }, [open, event?.id, facilitatorsQuery.data]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const save = useMutation({
    mutationFn: () => apiMutation(apiPath, "PATCH", buildEventApiPayload(form)),
    onSuccess: async () => {
      await Promise.all(
        queryKeys.map((key) => queryClient.invalidateQueries({ queryKey: key })),
      );
      onClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  if (!event) return null;

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
                    {subtitle}
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-semibold text-theme-heading">
                    {title}
                  </h2>
                </div>
                <button type="button" onClick={onClose} className="text-2xl text-[#9ca4a2]">
                  ×
                </button>
              </div>
            </div>
            <form
              className="space-y-5 px-8 py-6"
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                save.mutate();
              }}
            >
              <EventFormFields
                form={form}
                onChange={(patch) => setForm((p) => ({ ...p, ...patch }))}
                forceClubEvent={Boolean(event.clubId)}
              />
              {error ? (
                <p className="rounded-xl bg-[#fdecea] px-4 py-3 text-sm text-[#b42318]">{error}</p>
              ) : null}
              <div className="flex justify-end gap-3 border-t border-theme-muted pt-6">
                <button type="button" onClick={onClose} className="rounded-full px-6 py-2.5 text-sm font-semibold">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={save.isPending}
                  className="rounded-full bg-theme-button-primary px-8 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {save.isPending ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
