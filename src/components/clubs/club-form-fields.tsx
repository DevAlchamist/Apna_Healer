"use client";

import { ClubGalleryEditor } from "@/components/clubs/club-gallery-editor";
import { ClubLandingFields } from "@/components/clubs/club-landing-fields";
import {
  ClubOnboardingStepsEditor,
  type OnboardingStepDraft,
} from "@/components/clubs/club-onboarding-steps-editor";
import {
  ClubReviewsEditor,
  type ClubReviewDraft,
} from "@/components/clubs/club-reviews-editor";
import type { ClubFormState } from "@/lib/club-form";

const fieldLabel =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]";
const fieldInput =
  "mt-2 w-full rounded-xl border border-theme-muted bg-theme-surface-muted px-3.5 py-2.5 text-sm text-theme-heading outline-none transition placeholder:text-[#b1a89d] focus:border-[#2f6f5b] focus:bg-white focus:ring-2 focus:ring-[#2f6f5b]/12";

type Props = {
  form: ClubFormState;
  onChange: (patch: Partial<ClubFormState>) => void;
  showAdminFields?: boolean;
  showLanding?: boolean;
  labelClassName?: string;
  inputClassName?: string;
};

export function ClubFormFields({
  form,
  onChange,
  showAdminFields = false,
  showLanding = true,
  labelClassName = fieldLabel,
  inputClassName = fieldInput,
}: Props) {
  return (
    <>
      <div>
        <label className={labelClassName}>Club name</label>
        <input
          required
          value={form.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className={inputClassName}
        />
      </div>
      <div>
        <label className={labelClassName}>Short tagline</label>
        <textarea
          required
          rows={2}
          value={form.subtitle}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          className={inputClassName}
        />
      </div>
      <div>
        <label className={labelClassName}>Purpose</label>
        <textarea
          rows={2}
          value={form.purpose}
          onChange={(e) => onChange({ purpose: e.target.value })}
          className={inputClassName}
        />
      </div>
      <div>
        <label className={labelClassName}>Full description</label>
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className={inputClassName}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClassName}>Monthly fee (₹)</label>
          <input
            type="number"
            min={1}
            required
            value={form.monthlyFee}
            onChange={(e) => onChange({ monthlyFee: e.target.value })}
            className={inputClassName}
          />
        </div>
        <div>
          <label className={labelClassName}>Visibility</label>
          <select
            value={form.visibility}
            onChange={(e) =>
              onChange({ visibility: e.target.value as ClubFormState["visibility"] })
            }
            className={inputClassName}
          >
            <option value="PUBLIC">Public — listed for all</option>
            <option value="PRIVATE">Private — invite only</option>
          </select>
        </div>
      </div>
      {showAdminFields ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClassName}>Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                onChange({ status: e.target.value as ClubFormState["status"] })
              }
              className={inputClassName}
            >
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <div>
            <label className={labelClassName}>URL slug</label>
            <input
              value={form.slug}
              onChange={(e) => onChange({ slug: e.target.value })}
              placeholder="mindful-movement"
              className={inputClassName}
            />
          </div>
        </div>
      ) : null}
      <div>
        <label className={labelClassName}>Hero image URL</label>
        <input
          type="url"
          value={form.heroImageUrl}
          onChange={(e) => onChange({ heroImageUrl: e.target.value })}
          className={inputClassName}
        />
      </div>
      <ClubGalleryEditor
        urls={form.galleryUrls}
        onChange={(urls) => onChange({ galleryUrls: urls })}
        labelClassName={labelClassName}
        inputClassName={inputClassName}
      />
      {showLanding ? (
        <div className="rounded-xl border border-theme-muted bg-white/60 p-5">
          <p className={labelClassName}>Public landing page</p>
          <div className="mt-4">
            <ClubLandingFields
              heroTagline={form.heroTagline}
              onHeroTagline={(v) => onChange({ heroTagline: v })}
              pulseQuote={form.pulseQuote}
              onPulseQuote={(v) => onChange({ pulseQuote: v })}
              ritualsIntro={form.ritualsIntro}
              onRitualsIntro={(v) => onChange({ ritualsIntro: v })}
              voicesQuote={form.voicesQuote}
              onVoicesQuote={(v) => onChange({ voicesQuote: v })}
              finalCtaText={form.finalCtaText}
              onFinalCtaText={(v) => onChange({ finalCtaText: v })}
              landingFeatures={form.landingFeatures}
              onLandingFeatures={(v) => onChange({ landingFeatures: v })}
              landingRituals={form.landingRituals}
              onLandingRituals={(v) => onChange({ landingRituals: v })}
              labelClassName={labelClassName}
              inputClassName={inputClassName}
            />
          </div>
        </div>
      ) : null}
      <ClubOnboardingStepsEditor
        steps={form.onboardingSteps}
        onChange={(steps: OnboardingStepDraft[]) => onChange({ onboardingSteps: steps })}
        labelClassName={labelClassName}
        inputClassName={inputClassName}
      />
      <ClubReviewsEditor
        reviews={form.reviews}
        onChange={(reviews: ClubReviewDraft[]) => onChange({ reviews })}
        labelClassName={labelClassName}
        inputClassName={inputClassName}
      />
    </>
  );
}
