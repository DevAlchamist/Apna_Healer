import { BlogBlockType } from "@prisma/client";
import { z } from "zod";

export const BLOG_BLOCK_TYPES = [
  "HEADING",
  "PARAGRAPH",
  "LIST",
  "QUOTE",
  "CODE",
  "DIVIDER",
  "HIGHLIGHT",
  "IMAGE",
  "IMAGE_GALLERY",
  "VIDEO_EMBED",
  "BANNER",
] as const satisfies readonly BlogBlockType[];

export type BlogBlockTypeValue = (typeof BLOG_BLOCK_TYPES)[number];

const headingDataSchema = z.object({
  level: z.number().int().min(1).max(4),
  text: z.string().trim().min(1).max(500),
});

const paragraphDataSchema = z.object({
  html: z.string().max(20_000),
});

const listDataSchema = z.object({
  ordered: z.boolean(),
  items: z.array(z.string().trim().min(1).max(1000)).min(1).max(50),
});

const quoteDataSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  attribution: z.string().trim().max(200).optional(),
});

const codeDataSchema = z.object({
  language: z.string().trim().max(40).optional(),
  code: z.string().max(20_000),
});

const dividerDataSchema = z.object({});

const highlightDataSchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

const imageDataSchema = z.object({
  url: z.string().trim().min(1).max(2048),
  alt: z.string().trim().max(300).optional(),
  caption: z.string().trim().max(500).optional(),
});

const imageGalleryDataSchema = z.object({
  images: z
    .array(
      z.object({
        url: z.string().trim().min(1).max(2048),
        alt: z.string().trim().max(300).optional(),
      }),
    )
    .min(1)
    .max(12),
  columns: z.union([z.literal(2), z.literal(3)]).optional(),
});

const videoEmbedDataSchema = z.object({
  provider: z.enum(["youtube", "vimeo"]),
  videoId: z.string().trim().min(1).max(100),
  caption: z.string().trim().max(500).optional(),
});

const bannerDataSchema = z.object({
  title: z.string().trim().min(1).max(200),
  subtitle: z.string().trim().max(500).optional(),
  imageUrl: z.string().trim().max(2048).optional(),
  tone: z.enum(["default", "accent"]).optional(),
});

const blockDataSchemas: Record<BlogBlockTypeValue, z.ZodType<unknown>> = {
  HEADING: headingDataSchema,
  PARAGRAPH: paragraphDataSchema,
  LIST: listDataSchema,
  QUOTE: quoteDataSchema,
  CODE: codeDataSchema,
  DIVIDER: dividerDataSchema,
  HIGHLIGHT: highlightDataSchema,
  IMAGE: imageDataSchema,
  IMAGE_GALLERY: imageGalleryDataSchema,
  VIDEO_EMBED: videoEmbedDataSchema,
  BANNER: bannerDataSchema,
};

export const blogBlockInputSchema = z.object({
  id: z.string().cuid().optional(),
  type: z.enum(BLOG_BLOCK_TYPES),
  sortOrder: z.number().int().min(0).max(200),
  data: z.unknown(),
});

export type BlogBlockInput = z.infer<typeof blogBlockInputSchema>;

export type BlogTocEntry = {
  id: string;
  level: number;
  text: string;
};

export function slugifyBlogTag(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "tag";
}

export function sanitizeParagraphHtml(html: string): string {
  const allowedTags = new Set(["b", "i", "u", "a", "br", "strong", "em"]);
  return html
    .replace(/<(\/?)([a-zA-Z0-9]+)([^>]*)>/g, (match, slash, tag, attrs) => {
      const normalized = tag.toLowerCase();
      if (!allowedTags.has(normalized)) return "";
      if (normalized === "a" && !slash) {
        const hrefMatch = /href=["']([^"']+)["']/i.exec(attrs);
        const href = hrefMatch?.[1]?.trim();
        if (!href || !/^https?:\/\//i.test(href)) return "";
        return `<a href="${href.replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer">`;
      }
      if (normalized === "strong") return slash ? "</b>" : "<b>";
      if (normalized === "em") return slash ? "</i>" : "<i>";
      return `<${slash ? "/" : ""}${normalized === "br" ? "br" : normalized}>`;
    })
    .replace(/<(?!(\/)?(b|i|u|a|br)\b)[^>]+>/gi, "")
    .trim();
}

export function validateAndSanitizeBlock(block: BlogBlockInput): BlogBlockInput {
  const schema = blockDataSchemas[block.type as BlogBlockTypeValue];
  if (!schema) {
    throw new Error(`Unsupported block type: ${block.type}`);
  }

  let data = schema.parse(block.data);
  if (block.type === "PARAGRAPH" && typeof data === "object" && data && "html" in data) {
    data = {
      ...data,
      html: sanitizeParagraphHtml(String((data as { html: string }).html)),
    };
  }

  return {
    ...block,
    data,
  };
}

export function validateBlocks(blocks: BlogBlockInput[]): BlogBlockInput[] {
  return blocks
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((block, index) =>
      validateAndSanitizeBlock({
        ...block,
        sortOrder: index,
      }),
    );
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function blockPlainText(block: BlogBlockInput): string {
  const data = block.data as Record<string, unknown>;
  switch (block.type) {
    case "HEADING":
      return String(data.text ?? "");
    case "PARAGRAPH":
      return stripHtml(String(data.html ?? ""));
    case "LIST":
      return Array.isArray(data.items) ? data.items.join(" ") : "";
    case "QUOTE":
      return String(data.text ?? "");
    case "CODE":
      return String(data.code ?? "");
    case "HIGHLIGHT":
      return String(data.text ?? "");
    case "BANNER":
      return [data.title, data.subtitle].filter(Boolean).join(" ");
    case "IMAGE":
      return String(data.caption ?? data.alt ?? "");
    case "IMAGE_GALLERY":
      return "gallery";
    case "VIDEO_EMBED":
      return String(data.caption ?? "video");
    default:
      return "";
  }
}

export function computeReadingTime(blocks: BlogBlockInput[]): number {
  const words = blocks
    .map(blockPlainText)
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function generateExcerpt(blocks: BlogBlockInput[], maxLength = 220): string {
  const text = blocks.map(blockPlainText).join(" ").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

export function extractToc(blocks: BlogBlockInput[]): BlogTocEntry[] {
  return blocks
    .filter((block) => block.type === "HEADING")
    .map((block, index) => {
      const data = block.data as { level: number; text: string };
      return {
        id: block.id ?? `heading-${index}`,
        level: data.level,
        text: data.text,
      };
    });
}

export function parseVideoUrl(url: string): { provider: "youtube" | "vimeo"; videoId: string } | null {
  const trimmed = url.trim();
  const youtubeMatch =
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/i.exec(trimmed);
  if (youtubeMatch?.[1]) {
    return { provider: "youtube", videoId: youtubeMatch[1] };
  }
  const vimeoMatch = /vimeo\.com\/(?:video\/)?(\d+)/i.exec(trimmed);
  if (vimeoMatch?.[1]) {
    return { provider: "vimeo", videoId: vimeoMatch[1] };
  }
  return null;
}

export function createDefaultBlock(type: BlogBlockTypeValue, sortOrder: number): BlogBlockInput {
  const defaults: Record<BlogBlockTypeValue, unknown> = {
    HEADING: { level: 2, text: "New heading" },
    PARAGRAPH: { html: "<p>Start writing...</p>" },
    LIST: { ordered: false, items: ["First item"] },
    QUOTE: { text: "A meaningful quote." },
    CODE: { language: "text", code: "console.log('hello');" },
    DIVIDER: {},
    HIGHLIGHT: { text: "Highlighted insight" },
    IMAGE: { url: "", alt: "", caption: "" },
    IMAGE_GALLERY: { images: [{ url: "", alt: "" }], columns: 2 },
    VIDEO_EMBED: { provider: "youtube", videoId: "", caption: "" },
    BANNER: { title: "Banner title", subtitle: "", tone: "default" },
  };

  return {
    type,
    sortOrder,
    data: defaults[type],
  };
}
