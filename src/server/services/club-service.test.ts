import { describe, expect, it } from "vitest";
import {
  countOnboardingQuestions,
  formatMemberCount,
  parseOnboardingStepsJson,
  slugifyTitle,
} from "./club-utils";

describe("club-utils", () => {
  it("slugifyTitle normalizes strings", () => {
    expect(slugifyTitle("The Breath Collective")).toBe("the-breath-collective");
  });

  it("formatMemberCount abbreviates thousands", () => {
    expect(formatMemberCount(1200)).toBe("1.2k");
    expect(formatMemberCount(42)).toBe("42");
  });

  it("parseOnboardingStepsJson reads legacy single-question steps", () => {
    const steps = parseOnboardingStepsJson([{ question: "Why join?", required: true }]);
    expect(steps).toHaveLength(1);
    expect(steps[0]?.title).toBe("Step 1");
    expect(steps[0]?.questions[0]?.question).toBe("Why join?");
  });

  it("parseOnboardingStepsJson reads nested steps with multiple questions", () => {
    const steps = parseOnboardingStepsJson([
      {
        title: "About you",
        description: "Intro",
        questions: [
          { question: "Why join?", required: true },
          { question: "What do you need?", required: false },
        ],
      },
    ]);
    expect(steps).toHaveLength(1);
    expect(steps[0]?.questions).toHaveLength(2);
    expect(countOnboardingQuestions(steps)).toBe(2);
  });
});
