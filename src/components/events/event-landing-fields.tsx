"use client";

import type { EventLandingFormFields } from "@/lib/event-form";

const fieldLabel = "block text-xs font-semibold uppercase tracking-[0.12em] text-text-primary/45";
const fieldInput =
  "mt-1.5 w-full rounded-xl border border-accent/80 bg-white px-3 py-2.5 text-sm text-text-primary focus:border-[#2D5A4C] focus:outline-none";

type Props = EventLandingFormFields & {
  onJourneyPointsRaw: (v: string) => void;
  onAudienceText: (v: string) => void;
  onTestimonialQuote: (v: string) => void;
  onTestimonialAuthor: (v: string) => void;
  labelClassName?: string;
  inputClassName?: string;
};

export function EventLandingFields({
  journeyPointsRaw,
  onJourneyPointsRaw,
  audienceText,
  onAudienceText,
  testimonialQuote,
  onTestimonialQuote,
  testimonialAuthor,
  onTestimonialAuthor,
  labelClassName = fieldLabel,
  inputClassName = fieldInput,
}: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-text-primary/55">
        Optional content shown on the public event page at /events/your-slug.
      </p>
      <label className={labelClassName}>
        Journey points
        <textarea
          value={journeyPointsRaw}
          onChange={(e) => onJourneyPointsRaw(e.target.value)}
          rows={4}
          className={`${inputClassName} resize-y`}
          placeholder={"Opening and grounding\nGuided practice\nClosing reflection"}
        />
        <span className="mt-1 block text-[11px] text-text-primary/45">One point per line.</span>
      </label>
      <label className={labelClassName}>
        Who it&apos;s for
        <textarea
          value={audienceText}
          onChange={(e) => onAudienceText(e.target.value)}
          rows={3}
          className={`${inputClassName} resize-y`}
          placeholder="Open to all members and guests. No prior experience required."
        />
      </label>
      <label className={labelClassName}>
        Testimonial quote
        <textarea
          value={testimonialQuote}
          onChange={(e) => onTestimonialQuote(e.target.value)}
          rows={3}
          className={`${inputClassName} resize-y`}
          placeholder="A quote from a past participant."
        />
      </label>
      <label className={labelClassName}>
        Testimonial author
        <input
          value={testimonialAuthor}
          onChange={(e) => onTestimonialAuthor(e.target.value)}
          className={inputClassName}
          placeholder="Community member"
        />
      </label>
    </div>
  );
}
