import type { Club, ClubMembership, ClubOnboardingStep, ClubReview } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/client";

export const MAX_BILLING_FAIL_COUNT = 3;

export function slugifyTitle(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "club";
}

export async function uniqueClubSlug(
  title: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  let slug = slugifyTitle(title);
  let n = 0;
  while (await exists(slug)) {
    n += 1;
    slug = `${slugifyTitle(title)}-${n}`;
  }
  return slug;
}

export function formatMemberCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

export function inferSphere(title: string): string {
  const t = title.toLowerCase();
  if (/grief|loss|grace/i.test(t)) return "Grief";
  if (/breath|meditat|still/i.test(t)) return "Mindfulness";
  if (/anxiety|quiet|calm/i.test(t)) return "Anxiety";
  return "Wellness";
}

export function addOneMonth(date: Date): Date {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return next;
}

export type ClubWithRelations = Club & {
  onboardingSteps: ClubOnboardingStep[];
  reviews: ClubReview[];
};

export function decimalToString(value: Decimal | number | string): string {
  return value instanceof Decimal ? value.toString() : String(value);
}

export type OnboardingStepInput = {
  question: string;
  required?: boolean;
  sortOrder?: number;
};

export function parseOnboardingStepsJson(raw: unknown): OnboardingStepInput[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item, index) => ({
      question: String(item.question ?? "").trim(),
      required: item.required !== false,
      sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : index,
    }))
    .filter((s) => s.question.length > 0);
}
