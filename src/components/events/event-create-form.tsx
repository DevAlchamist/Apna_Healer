"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { EventFormFields } from "@/components/events/event-form-fields";
import { apiFetch, apiMutation } from "@/lib/api-client";
import {
  applyFacilitatorChoice,
  buildEventApiPayload,
  emptyClubEventForm,
  type EventFormState,
} from "@/lib/event-form";
import type { ApiEventFacilitatorOption } from "@/types/api";

type EventCreateFormProps = {
  apiPath: string;
  onCreated?: () => void;
  defaultOwnerUserId?: string | null;
};

export function EventCreateForm({ apiPath, onCreated, defaultOwnerUserId }: EventCreateFormProps) {
  const [form, setForm] = useState<EventFormState>(() => ({
    ...emptyClubEventForm(defaultOwnerUserId),
    status: "PUBLISHED",
  }));

  const facilitatorsQuery = useQuery({
    queryKey: ["event-facilitator-options"],
    queryFn: () => apiFetch<ApiEventFacilitatorOption[]>("/api/events/facilitator-options"),
  });

  useEffect(() => {
    if (!defaultOwnerUserId || !facilitatorsQuery.data) return;
    const choice = `owner:${defaultOwnerUserId}`;
    const preset = facilitatorsQuery.data.find((o) => o.id === choice);
    if (preset) {
      setForm((prev) => ({
        ...prev,
        ...applyFacilitatorChoice(choice, facilitatorsQuery.data!),
      }));
    }
  }, [defaultOwnerUserId, facilitatorsQuery.data]);

  const createMutation = useMutation({
    mutationFn: () => apiMutation(apiPath, "POST", buildEventApiPayload(form)),
    onSuccess: () => {
      setForm({ ...emptyClubEventForm(defaultOwnerUserId), status: "PUBLISHED" });
      onCreated?.();
    },
  });

  return (
    <form
      className="space-y-4 rounded-calm border border-accent/70 bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        createMutation.mutate();
      }}
    >
      <h3 className="font-display text-xl font-semibold text-text-primary">Create event</h3>
      <EventFormFields
        form={form}
        onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
        showStatus={false}
        forceClubEvent
        labelClassName="block text-xs font-semibold uppercase tracking-[0.12em] text-text-primary/45"
        inputClassName="mt-1.5 w-full rounded-gentle border border-accent/80 bg-background px-4 py-2.5 text-sm outline-none focus:border-primary/40"
      />
      {createMutation.isError ? (
        <p className="text-sm text-theme-status-error">{(createMutation.error as Error).message}</p>
      ) : null}
      <button
        type="submit"
        disabled={createMutation.isPending}
        className="rounded-full bg-text-secondary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {createMutation.isPending ? "Publishing…" : "Publish event"}
      </button>
    </form>
  );
}
