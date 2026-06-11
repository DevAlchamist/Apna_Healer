import { describe, expect, it } from "vitest";
import { Role } from "@prisma/client";
import {
  computeReadingTime,
  generateExcerpt,
  sanitizeParagraphHtml,
  validateBlocks,
} from "@/lib/blog-blocks";
import { resolvePublishStatus } from "@/server/services/blog-utils";

describe("blog-blocks", () => {
  it("sanitizes paragraph html to allowed tags", () => {
    const result = sanitizeParagraphHtml(
      '<p>Hello <script>alert(1)</script><b>bold</b> <a href="https://example.com">link</a></p>',
    );
    expect(result).toContain("<b>bold</b>");
    expect(result).toContain('href="https://example.com"');
    expect(result).not.toContain("<script>");
  });

  it("computes reading time from blocks", () => {
    const words = Array.from({ length: 400 }, (_, i) => `word${i}`).join(" ");
    const minutes = computeReadingTime([
      { type: "PARAGRAPH", sortOrder: 0, data: { html: words } },
    ]);
    expect(minutes).toBe(2);
  });

  it("generates excerpt from blocks", () => {
    const excerpt = generateExcerpt([
      { type: "HEADING", sortOrder: 0, data: { level: 2, text: "Title" } },
      { type: "PARAGRAPH", sortOrder: 1, data: { html: "Body copy for the blog post." } },
    ]);
    expect(excerpt).toContain("Title");
    expect(excerpt).toContain("Body copy");
  });

  it("validates and orders blocks", () => {
    const blocks = validateBlocks([
      { type: "DIVIDER", sortOrder: 2, data: {} },
      { type: "HEADING", sortOrder: 0, data: { level: 2, text: "Hello" } },
    ]);
    expect(blocks[0]?.type).toBe("HEADING");
    expect(blocks[1]?.type).toBe("DIVIDER");
  });
});

describe("resolvePublishStatus", () => {
  it("publishes directly for therapists and admins", () => {
    expect(resolvePublishStatus(Role.THERAPIST)).toBe("PUBLISHED");
    expect(resolvePublishStatus(Role.ADMIN)).toBe("PUBLISHED");
  });

  it("requires review for members and listeners", () => {
    expect(resolvePublishStatus(Role.USER)).toBe("PENDING_REVIEW");
    expect(resolvePublishStatus(Role.LISTENER)).toBe("PENDING_REVIEW");
  });
});
