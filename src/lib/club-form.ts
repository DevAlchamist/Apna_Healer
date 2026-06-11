import type { ApiClubDetail } from "@/types/api";
import { Prisma } from "@prisma/client";
import type {
  ClubLandingFeature,
  ClubLandingFieldsInput,
  ClubLandingRitual,
} from "@/lib/validators/club-landing-fields";
import type { ClubReviewDraft } from "@/components/clubs/club-reviews-editor";
import type { OnboardingStepDraft } from "@/components/clubs/club-onboarding-steps-editor";
import { onboardingStepsToPayload } from "@/components/clubs/club-onboarding-steps-editor";
import { clubGalleryUrlsToPayload } from "@/components/clubs/club-gallery-editor";

export type ClubLandingFormFields = {
  heroTagline: string;
  pulseQuote: string;
  ritualsIntro: string;
  voicesQuote: string;
  finalCtaText: string;
  landingFeatures: ClubLandingFeature[];
  landingRituals: ClubLandingRitual[];
};

export const DEFAULT_CLUB_FEATURES: ClubLandingFeature[] = [
  {
    title: "Pranayama Mastery",
    description:
      "Guided sessions rooted in ancient Vedic techniques to harmonize breath, body, and mind.",
    icon: "wind",
  },
  {
    title: "Stress Release",
    description:
      "Science-backed protocols designed to regulate the nervous system and restore calm.",
    icon: "leaf",
  },
];

export const DEFAULT_CLUB_RITUALS: ClubLandingRitual[] = [
  {
    label: "THE AWAKENING",
    title: "Sunrise Flows",
    description:
      "Gentle activation sessions held as the world wakes. We use rhythmic breathing to clear the mind and prepare the body for the day's potential.",
    imageUrl: null,
    cta: "Explore session details",
  },
  {
    label: "THE INTERNALIZATION",
    title: "Deep Dives",
    description:
      "Extended weekend workshops that delve into cellular release and emotional unwinding through Holotropic-inspired techniques.",
    imageUrl: null,
    cta: "Join the circle",
  },
];

export function parseLandingFeatures(value: unknown): ClubLandingFeature[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      const r = row as Record<string, unknown>;
      const title = String(r.title ?? "").trim();
      const description = String(r.description ?? "").trim();
      if (!title || !description) return null;
      const icon = r.icon === "leaf" ? "leaf" : "wind";
      return { title, description, icon } satisfies ClubLandingFeature;
    })
    .filter((x) => x != null) as ClubLandingFeature[];
}

export function parseLandingRituals(value: unknown): ClubLandingRitual[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      const r = row as Record<string, unknown>;
      const label = String(r.label ?? "").trim();
      const title = String(r.title ?? "").trim();
      const description = String(r.description ?? "").trim();
      if (!label || !title || !description) return null;
      return {
        label,
        title,
        description,
        imageUrl: r.imageUrl ? String(r.imageUrl) : null,
        cta: r.cta ? String(r.cta) : null,
      };
    })
    .filter((x) => x != null) as ClubLandingRitual[];
}

export function clubLandingFormFromDetail(club: ApiClubDetail): ClubLandingFormFields {
  return {
    heroTagline: club.heroTagline?.trim() ?? "",
    pulseQuote: club.pulseQuote?.trim() ?? "",
    ritualsIntro: club.ritualsIntro?.trim() ?? "",
    voicesQuote: club.voicesQuote?.trim() ?? "",
    finalCtaText: club.finalCtaText?.trim() ?? "",
    landingFeatures:
      club.landingFeatures?.length > 0
        ? club.landingFeatures.map((f) => ({
            title: f.title,
            description: f.description,
            icon: f.icon === "leaf" ? "leaf" : "wind",
          }))
        : DEFAULT_CLUB_FEATURES.map((f) => ({ ...f })),
    landingRituals:
      club.landingRituals?.length > 0
        ? club.landingRituals.map((r) => ({
            label: r.label,
            title: r.title,
            description: r.description,
            imageUrl: r.imageUrl ?? null,
            cta: r.cta ?? null,
          }))
        : DEFAULT_CLUB_RITUALS.map((r) => ({ ...r })),
  };
}

export function landingFieldsToClubPayload(form: ClubLandingFormFields): ClubLandingFieldsInput {
  const features = form.landingFeatures.filter((f) => f.title.trim() && f.description.trim());
  const rituals = form.landingRituals.filter(
    (r) => r.label.trim() && r.title.trim() && r.description.trim(),
  );
  return {
    heroTagline: form.heroTagline.trim() || undefined,
    pulseQuote: form.pulseQuote.trim() || undefined,
    ritualsIntro: form.ritualsIntro.trim() || undefined,
    voicesQuote: form.voicesQuote.trim() || undefined,
    finalCtaText: form.finalCtaText.trim() || undefined,
    landingFeatures: features,
    landingRituals: rituals,
  };
}

export function landingFieldsToDb(input: ClubLandingFieldsInput) {
  return {
    heroTagline: input.heroTagline ?? null,
    pulseQuote: input.pulseQuote ?? null,
    ritualsIntro: input.ritualsIntro ?? null,
    voicesQuote: input.voicesQuote ?? null,
    finalCtaText: input.finalCtaText ?? null,
    landingFeatures:
      input.landingFeatures && input.landingFeatures.length > 0
        ? (input.landingFeatures as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    landingRituals:
      input.landingRituals && input.landingRituals.length > 0
        ? (input.landingRituals as Prisma.InputJsonValue)
        : Prisma.JsonNull,
  };
}

export function reviewsDraftFromApi(
  reviews: ApiClubDetail["reviews"],
): ClubReviewDraft[] {
  return reviews.map((r) => ({
    id: r.id,
    authorLabel: r.authorLabel,
    quote: r.quote,
    memberSince: r.memberSince ?? "",
  }));
}

export function reviewsDraftToPayload(
  reviews: Array<ClubReviewDraft & { memberSince?: string }>,
) {
  return reviews
    .map((r, index) => ({
      authorLabel: r.authorLabel.trim(),
      quote: r.quote.trim(),
      memberSince: r.memberSince?.trim() || null,
      sortOrder: index,
    }))
    .filter((r) => r.authorLabel.length > 0 && r.quote.length > 0);
}

export function landingPageDataFromInput(input: ClubLandingFieldsInput) {
  return {
    heroTagline: input.heroTagline ?? null,
    pulseQuote: input.pulseQuote ?? null,
    ritualsIntro: input.ritualsIntro ?? null,
    voicesQuote: input.voicesQuote ?? null,
    finalCtaText: input.finalCtaText ?? null,
    landingFeatures: input.landingFeatures ?? [],
    landingRituals: input.landingRituals ?? [],
  };
}

export function landingFieldsFromPageData(value: unknown): ClubLandingFieldsInput {
  if (!value || typeof value !== "object") {
    return {
      heroTagline: undefined,
      pulseQuote: undefined,
      ritualsIntro: undefined,
      voicesQuote: undefined,
      finalCtaText: undefined,
      landingFeatures: [],
      landingRituals: [],
    };
  }
  const v = value as Record<string, unknown>;
  return {
    heroTagline: v.heroTagline ? String(v.heroTagline) : undefined,
    pulseQuote: v.pulseQuote ? String(v.pulseQuote) : undefined,
    ritualsIntro: v.ritualsIntro ? String(v.ritualsIntro) : undefined,
    voicesQuote: v.voicesQuote ? String(v.voicesQuote) : undefined,
    finalCtaText: v.finalCtaText ? String(v.finalCtaText) : undefined,
    landingFeatures: parseLandingFeatures(v.landingFeatures),
    landingRituals: parseLandingRituals(v.landingRituals),
  };
}

export type ClubFormState = {
  title: string;
  subtitle: string;
  purpose: string;
  description: string;
  heroImageUrl: string;
  monthlyFee: string;
  visibility: "PUBLIC" | "PRIVATE";
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  slug: string;
  galleryUrls: string[];
  onboardingSteps: OnboardingStepDraft[];
  reviews: ClubReviewDraft[];
} & ClubLandingFormFields;

export const emptyClubForm = (): ClubFormState => ({
  title: "",
  subtitle: "",
  purpose: "",
  description: "",
  heroImageUrl: "",
  monthlyFee: "299",
  visibility: "PUBLIC",
  status: "ACTIVE",
  slug: "",
  galleryUrls: ["", "", ""],
  onboardingSteps: [],
  reviews: [],
  heroTagline: "",
  pulseQuote: "",
  ritualsIntro: "",
  voicesQuote: "",
  finalCtaText: "",
  landingFeatures: DEFAULT_CLUB_FEATURES.map((f) => ({ ...f })),
  landingRituals: DEFAULT_CLUB_RITUALS.map((r) => ({ ...r })),
});

function onboardingStepsFromDetail(
  steps: ApiClubDetail["onboardingSteps"],
): OnboardingStepDraft[] {
  return steps.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description ?? "",
    questions: s.questions.map((q) => ({
      id: q.id,
      question: q.question,
      required: q.required,
      type: q.type,
      options: q.options,
      allowMultiple: q.allowMultiple,
    })),
  }));
}

export function clubFormFromDetail(club: ApiClubDetail): ClubFormState {
  const landing = clubLandingFormFromDetail(club);
  const gallery = club.galleryUrls.length > 0 ? [...club.galleryUrls] : ["", "", ""];
  while (gallery.length < 3) gallery.push("");
  return {
    title: club.title,
    subtitle: club.subtitle,
    purpose: club.purpose ?? "",
    description: club.description ?? "",
    heroImageUrl: club.heroImageUrl ?? "",
    monthlyFee: String(Math.round(Number(club.monthlyFee))),
    visibility: club.visibility,
    status: club.status,
    slug: club.slug,
    galleryUrls: gallery,
    onboardingSteps: onboardingStepsFromDetail(club.onboardingSteps),
    reviews: reviewsDraftFromApi(club.reviews),
    ...landing,
  };
}

export function buildClubApiPayload(
  form: ClubFormState,
  options?: { purposeSuffix?: string; includeAdminFields?: boolean },
) {
  const purposeText = [form.purpose.trim(), options?.purposeSuffix].filter(Boolean).join("\n");
  const stepsPayload = onboardingStepsToPayload(form.onboardingSteps);
  const payload = {
    title: form.title.trim(),
    subtitle: form.subtitle.trim(),
    purpose: purposeText || null,
    description: form.description.trim() || null,
    heroImageUrl: form.heroImageUrl.trim() || null,
    monthlyFee: Number(form.monthlyFee),
    visibility: form.visibility,
    galleryUrls: clubGalleryUrlsToPayload(form.galleryUrls),
    onboardingSteps: stepsPayload,
    reviews: reviewsDraftToPayload(form.reviews),
    ...landingFieldsToClubPayload(form),
  };
  if (options?.includeAdminFields) {
    return {
      ...payload,
      status: form.status,
      ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
    };
  }
  return payload;
}
