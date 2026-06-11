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

export type ClubOnboardingStepWithQuestions = ClubOnboardingStep & {
  questions: Array<{
    id: string;
    question: string;
    required: boolean;
    sortOrder: number;
    type: "TEXT" | "CHOICE";
    options: unknown;
    allowMultiple: boolean;
  }>;
};

export type ClubWithRelations = Club & {
  onboardingSteps: ClubOnboardingStepWithQuestions[];
  reviews: ClubReview[];
};

export function decimalToString(value: Decimal | number | string): string {
  return value instanceof Decimal ? value.toString() : String(value);
}

export type OnboardingQuestionInput = {
  question: string;
  required: boolean;
  sortOrder?: number;
  type: "TEXT" | "CHOICE";
  options: string[];
  allowMultiple: boolean;
};

export type OnboardingStepInput = {
  title: string;
  description?: string | null;
  sortOrder?: number;
  questions: OnboardingQuestionInput[];
};

function parseLegacyStep(item: Record<string, unknown>, index: number): OnboardingStepInput | null {
  const question = String(item.question ?? "").trim();
  if (!question) return null;
  return {
    title: String(item.title ?? `Step ${index + 1}`).trim() || `Step ${index + 1}`,
    description: item.description != null ? String(item.description) : null,
    sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : index,
    questions: [
      {
        question,
        required: item.required !== false,
        sortOrder: 0,
        type: "TEXT",
        options: [],
        allowMultiple: false,
      },
    ],
  };
}

function parseNestedStep(item: Record<string, unknown>, index: number): OnboardingStepInput | null {
  const title = String(item.title ?? "").trim();
  const rawQuestions = Array.isArray(item.questions) ? item.questions : [];
  const questions = rawQuestions
    .filter((q): q is Record<string, unknown> => typeof q === "object" && q !== null)
    .map((q, qi) => ({
      question: String(q.question ?? "").trim(),
      required: q.required !== false,
      sortOrder: typeof q.sortOrder === "number" ? q.sortOrder : qi,
      type: String(q.type ?? "TEXT").toUpperCase() === "CHOICE" ? ("CHOICE" as const) : ("TEXT" as const),
      options: Array.isArray(q.options) ? q.options.map((o) => String(o).trim()).filter(Boolean) : [],
      allowMultiple: q.allowMultiple === true,
    }))
    .filter((q) => q.question.length > 0);

  if (!title || questions.length === 0) return null;

  return {
    title,
    description: item.description != null ? String(item.description).trim() || null : null,
    sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : index,
    questions,
  };
}

export function parseOnboardingStepsJson(raw: unknown): OnboardingStepInput[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item, index) => {
      if (Array.isArray(item.questions)) {
        return parseNestedStep(item, index);
      }
      return parseLegacyStep(item, index);
    })
    .filter((step): step is OnboardingStepInput => step != null);
}

export function countOnboardingQuestions(steps: OnboardingStepInput[]): number {
  return steps.reduce((sum, step) => sum + step.questions.length, 0);
}

export function parseJsonStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => String(item).trim()).filter(Boolean);
}

export type ClubReviewInput = {
  authorLabel: string;
  quote: string;
  rating?: number | null;
  sortOrder?: number;
};

export function parseClubReviewsJson(raw: unknown): ClubReviewInput[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item, index) => ({
      authorLabel: String(item.authorLabel ?? "").trim(),
      quote: String(item.quote ?? "").trim(),
      memberSince: item.memberSince ? String(item.memberSince).trim() : null,
      rating: typeof item.rating === "number" ? item.rating : null,
      sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : index,
    }))
    .filter((r) => r.authorLabel.length > 0 && r.quote.length > 0);
}

export function formatJoinMessageFromAnswers(
  answers: Array<{
    stepTitle: string;
    questions: Array<{ question: string; answer: string | string[] }>;
  }>,
): string {
  return answers
    .map((step) => {
      const lines = step.questions.map((q) => {
        const value = Array.isArray(q.answer) ? q.answer.join(", ") : q.answer;
        return `• ${q.question}\n  ${value}`;
      });
      return `## ${step.stepTitle}\n${lines.join("\n")}`;
    })
    .join("\n\n");
}
