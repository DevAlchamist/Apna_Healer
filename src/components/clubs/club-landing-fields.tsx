"use client";

import type { ClubLandingFormFields } from "@/lib/club-form";
import { ClubLandingFeaturesEditor } from "@/components/clubs/club-landing-features-editor";
import { ClubLandingRitualsEditor } from "@/components/clubs/club-landing-rituals-editor";

const fieldLabel = "block text-xs font-semibold uppercase tracking-[0.12em] text-text-primary/45";
const fieldInput =
  "mt-1.5 w-full rounded-xl border border-accent/80 bg-white px-3 py-2.5 text-sm text-text-primary focus:border-[#2D5A4C] focus:outline-none";

type Props = ClubLandingFormFields & {
  onHeroTagline: (v: string) => void;
  onPulseQuote: (v: string) => void;
  onRitualsIntro: (v: string) => void;
  onVoicesQuote: (v: string) => void;
  onFinalCtaText: (v: string) => void;
  onLandingFeatures: (v: ClubLandingFormFields["landingFeatures"]) => void;
  onLandingRituals: (v: ClubLandingFormFields["landingRituals"]) => void;
  labelClassName?: string;
  inputClassName?: string;
};

export function ClubLandingFields({
  heroTagline,
  onHeroTagline,
  pulseQuote,
  onPulseQuote,
  ritualsIntro,
  onRitualsIntro,
  voicesQuote,
  onVoicesQuote,
  finalCtaText,
  onFinalCtaText,
  landingFeatures,
  onLandingFeatures,
  landingRituals,
  onLandingRituals,
  labelClassName = fieldLabel,
  inputClassName = fieldInput,
}: Props) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-text-primary/55">
        Optional content shown on the public club page at /clubs/your-slug.
      </p>
      <label className={labelClassName}>
        Hero tagline
        <input
          value={heroTagline}
          onChange={(e) => onHeroTagline(e.target.value)}
          className={inputClassName}
          placeholder="breath is the bridge"
        />
      </label>
      <label className={labelClassName}>
        Pulse quote
        <textarea
          value={pulseQuote}
          onChange={(e) => onPulseQuote(e.target.value)}
          rows={2}
          className={`${inputClassName} resize-y`}
          placeholder="Every inhale is a new beginning..."
        />
      </label>
      <label className={labelClassName}>
        Rituals intro
        <textarea
          value={ritualsIntro}
          onChange={(e) => onRitualsIntro(e.target.value)}
          rows={3}
          className={`${inputClassName} resize-y`}
          placeholder="A sequence of collective movements..."
        />
      </label>
      <ClubLandingFeaturesEditor value={landingFeatures} onChange={onLandingFeatures} />
      <ClubLandingRitualsEditor value={landingRituals} onChange={onLandingRituals} />
      <label className={labelClassName}>
        Voices section quote
        <textarea
          value={voicesQuote}
          onChange={(e) => onVoicesQuote(e.target.value)}
          rows={2}
          className={`${inputClassName} resize-y`}
          placeholder="The collective isn't just a club..."
        />
      </label>
      <label className={labelClassName}>
        Final CTA text
        <textarea
          value={finalCtaText}
          onChange={(e) => onFinalCtaText(e.target.value)}
          rows={3}
          className={`${inputClassName} resize-y`}
          placeholder="Will you step inside? Join a global movement..."
        />
      </label>
    </div>
  );
}
