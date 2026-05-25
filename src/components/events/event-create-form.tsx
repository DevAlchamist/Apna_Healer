"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiMutation } from "@/lib/api-client";

type EventCreateFormProps = {
  apiPath: string;
  onCreated?: () => void;
};

export function EventCreateForm({ apiPath, onCreated }: EventCreateFormProps) {
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    category: "Gathering",
    venue: "",
    capacity: "20",
    basePrice: "0",
    membersPay: true,
    nonMembersPay: true,
    startsAt: "",
    heroImageUrl: "",
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiMutation(apiPath, "POST", {
        title: form.title,
        subtitle: form.subtitle || null,
        category: form.category,
        venue: form.venue || null,
        capacity: Number(form.capacity),
        basePrice: Number(form.basePrice),
        membersPay: form.membersPay,
        nonMembersPay: form.nonMembersPay,
        startsAt: new Date(form.startsAt).toISOString(),
        heroImageUrl: form.heroImageUrl || null,
        status: "PUBLISHED",
      }),
    onSuccess: () => {
      setForm({
        title: "",
        subtitle: "",
        category: "Gathering",
        venue: "",
        capacity: "20",
        basePrice: "0",
        membersPay: true,
        nonMembersPay: true,
        startsAt: "",
        heroImageUrl: "",
      });
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
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm md:col-span-2">
          Title
          <input
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="mt-1 w-full rounded-gentle border border-accent/80 px-3 py-2"
          />
        </label>
        <label className="text-sm md:col-span-2">
          Subtitle
          <input
            value={form.subtitle}
            onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
            className="mt-1 w-full rounded-gentle border border-accent/80 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Category
          <input
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="mt-1 w-full rounded-gentle border border-accent/80 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Venue
          <input
            value={form.venue}
            onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
            className="mt-1 w-full rounded-gentle border border-accent/80 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Starts at
          <input
            required
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
            className="mt-1 w-full rounded-gentle border border-accent/80 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Capacity
          <input
            type="number"
            min={1}
            value={form.capacity}
            onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
            className="mt-1 w-full rounded-gentle border border-accent/80 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Base price (₹)
          <input
            type="number"
            min={0}
            value={form.basePrice}
            onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
            className="mt-1 w-full rounded-gentle border border-accent/80 px-3 py-2"
          />
        </label>
        <label className="text-sm md:col-span-2">
          Hero image URL
          <input
            value={form.heroImageUrl}
            onChange={(e) => setForm((f) => ({ ...f, heroImageUrl: e.target.value }))}
            className="mt-1 w-full rounded-gentle border border-accent/80 px-3 py-2"
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.membersPay}
            onChange={(e) => setForm((f) => ({ ...f, membersPay: e.target.checked }))}
          />
          Members pay
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.nonMembersPay}
            onChange={(e) => setForm((f) => ({ ...f, nonMembersPay: e.target.checked }))}
          />
          Non-members pay
        </label>
      </div>
      {createMutation.isError ? (
        <p className="text-sm text-[#cf4f45]">{(createMutation.error as Error).message}</p>
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
