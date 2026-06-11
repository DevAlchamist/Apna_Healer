"use client";

const GALLERY_SLOTS = [
  {
    key: "pulse",
    label: "Pulse section image",
    hint: "Shown beside “Pulse of the Collective” on your public club page.",
  },
  {
    key: "ritual-1",
    label: "Ritual image 1",
    hint: "First “Our Rituals” block image.",
  },
  {
    key: "ritual-2",
    label: "Ritual image 2",
    hint: "Second “Our Rituals” block image.",
  },
] as const;

type ClubGalleryEditorProps = {
  urls: string[];
  onChange: (urls: string[]) => void;
  labelClassName?: string;
  inputClassName?: string;
};

export function clubGalleryUrlsToPayload(urls: string[]): string[] {
  return urls.map((u) => u.trim()).filter(Boolean).slice(0, 12);
}

export function ClubGalleryEditor({
  urls,
  onChange,
  labelClassName = "text-sm font-semibold text-text-primary/75",
  inputClassName = "mt-2 w-full rounded-gentle border border-accent/80 bg-background px-4 py-2.5 text-sm outline-none focus:border-primary/40",
}: ClubGalleryEditorProps) {
  const padded = [...urls];
  while (padded.length < GALLERY_SLOTS.length) padded.push("");

  const setSlot = (index: number, value: string) => {
    const next = [...padded];
    next[index] = value;
    onChange(next);
  };

  const addExtra = () => {
    if (padded.length >= 12) return;
    onChange([...padded, ""]);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className={labelClassName}>Section images</p>
        <p className="mt-1 text-xs leading-relaxed text-text-primary/55">
          These images appear on your public club page — hero uses the cover image above; these
          fill the story sections below.
        </p>
      </div>

      {GALLERY_SLOTS.map((slot, index) => (
        <label key={slot.key} className="block">
          <span className="text-sm font-medium text-text-primary">{slot.label}</span>
          <span className="mt-0.5 block text-xs text-text-primary/50">{slot.hint}</span>
          <input
            type="url"
            value={padded[index] ?? ""}
            onChange={(e) => setSlot(index, e.target.value)}
            placeholder="https://…"
            className={inputClassName}
          />
          {padded[index]?.trim() ? (
            <div className="mt-2 overflow-hidden rounded-gentle border border-accent/70">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={padded[index].trim()} alt="" className="h-28 w-full object-cover" />
            </div>
          ) : null}
        </label>
      ))}

      {padded.length > GALLERY_SLOTS.length ? (
        <div className="space-y-3 border-t border-accent/60 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-primary/45">
            Additional gallery images
          </p>
          {padded.slice(GALLERY_SLOTS.length).map((url, extraIndex) => {
            const index = GALLERY_SLOTS.length + extraIndex;
            return (
              <div key={`extra-${index}`} className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setSlot(index, e.target.value)}
                  placeholder="https://…"
                  className={`${inputClassName} mt-0 flex-1`}
                />
                <button
                  type="button"
                  onClick={() => onChange(padded.filter((_, i) => i !== index))}
                  className="mt-0 shrink-0 rounded-gentle px-3 text-sm font-semibold text-theme-status-error"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      ) : null}

      {padded.length < 12 ? (
        <button
          type="button"
          onClick={addExtra}
          className="text-xs font-semibold text-theme-status-success hover:underline"
        >
          + Add another gallery image
        </button>
      ) : null}
    </div>
  );
}
