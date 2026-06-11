"use client";

import type { ClubLandingRitual } from "@/lib/validators/club-landing-fields";

type Props = {
  value: ClubLandingRitual[];
  onChange: (value: ClubLandingRitual[]) => void;
};

export function ClubLandingRitualsEditor({ value, onChange }: Props) {
  const update = (index: number, patch: Partial<ClubLandingRitual>) => {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-primary/45">
        Ritual blocks
      </p>
      {value.slice(0, 2).map((ritual, index) => (
        <div key={index} className="rounded-xl border border-accent/70 bg-[#fbfaf7] p-4 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#b1a89d]">
            Ritual {index + 1}
          </p>
          <input
            value={ritual.label}
            onChange={(e) => update(index, { label: e.target.value })}
            placeholder="Label (e.g. THE AWAKENING)"
            className="w-full rounded-gentle border border-accent/80 px-3 py-2 text-sm"
          />
          <input
            value={ritual.title}
            onChange={(e) => update(index, { title: e.target.value })}
            placeholder="Title"
            className="w-full rounded-gentle border border-accent/80 px-3 py-2 text-sm"
          />
          <textarea
            value={ritual.description}
            onChange={(e) => update(index, { description: e.target.value })}
            placeholder="Description"
            rows={3}
            className="w-full resize-y rounded-gentle border border-accent/80 px-3 py-2 text-sm"
          />
          <input
            value={ritual.imageUrl ?? ""}
            onChange={(e) => update(index, { imageUrl: e.target.value || null })}
            placeholder="Image URL (optional)"
            className="w-full rounded-gentle border border-accent/80 px-3 py-2 text-sm"
          />
          <input
            value={ritual.cta ?? ""}
            onChange={(e) => update(index, { cta: e.target.value || null })}
            placeholder="Button text (optional)"
            className="w-full rounded-gentle border border-accent/80 px-3 py-2 text-sm"
          />
        </div>
      ))}
    </div>
  );
}
