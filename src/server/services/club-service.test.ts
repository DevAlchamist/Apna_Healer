import { describe, expect, it } from "vitest";
import { formatMemberCount, slugifyTitle, parseOnboardingStepsJson } from "./club-utils";

describe("club-utils", () => {
  it("slugifyTitle normalizes strings", () => {
    expect(slugifyTitle("The Breath Collective")).toBe("the-breath-collective");
  });

  it("formatMemberCount abbreviates thousands", () => {
    expect(formatMemberCount(1200)).toBe("1.2k");
    expect(formatMemberCount(42)).toBe("42");
  });

  it("parseOnboardingStepsJson reads array", () => {
    const steps = parseOnboardingStepsJson([
      { question: "Why join?", required: true },
    ]);
    expect(steps).toHaveLength(1);
    expect(steps[0]?.question).toBe("Why join?");
  });
});
