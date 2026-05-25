import { describe, expect, it } from "vitest";
import { inferCardVariant } from "@/lib/journal-card-variant";
import { JournalCardVariant } from "@prisma/client";

describe("inferCardVariant", () => {
  it("detects image when cover url present", () => {
    expect(
      inferCardVariant("<p>Hello</p>", "https://example.com/photo.jpg"),
    ).toBe(JournalCardVariant.IMAGE);
  });

  it("detects quote from blockquote", () => {
    expect(
      inferCardVariant("<blockquote>A gentle thought</blockquote>", null),
    ).toBe(JournalCardVariant.QUOTE);
  });

  it("detects list from ul", () => {
    expect(inferCardVariant("<ul><li>one</li></ul>", null)).toBe(JournalCardVariant.LIST);
  });

  it("defaults to reflection", () => {
    expect(inferCardVariant("<p>Today was calm.</p>", null)).toBe(
      JournalCardVariant.REFLECTION,
    );
  });
});
