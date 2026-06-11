"use client";

import type { ClubLandingFeature } from "@/lib/validators/club-landing-fields";

type Props = {
  value: ClubLandingFeature[];
  onChange: (value: ClubLandingFeature[]) => void;
};

export function ClubLandingFeaturesEditor({ value, onChange }: Props) {
  const update = (index: number, patch: Partial<ClubLandingFeature>) => {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-primary/45">
        Feature cards
      </p>
      {value.slice(0, 2).map((feature, index) => (
        <div key={index} className="rounded-xl border border-accent/70 bg-[#fbfaf7] p-4 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#b1a89d]">
            Feature {index + 1}
          </p>
          <input
            value={feature.title}
            onChange={(e) => update(index, { title: e.target.value })}
            placeholder="Title"
            className="w-full rounded-gentle border border-accent/80 px-3 py-2 text-sm"
          />
          <textarea
            value={feature.description}
            onChange={(e) => update(index, { description: e.target.value })}
            placeholder="Description"
            rows={2}
            className="w-full resize-y rounded-gentle border border-accent/80 px-3 py-2 text-sm"
          />
          <select
            value={feature.icon ?? "wind"}
            onChange={(e) => update(index, { icon: e.target.value as "wind" | "leaf" })}
            className="w-full rounded-gentle border border-accent/80 px-3 py-2 text-sm"
          >
            <option value="wind">Wind icon</option>
            <option value="leaf">Leaf icon</option>
          </select>
        </div>
      ))}
    </div>
  );
}
