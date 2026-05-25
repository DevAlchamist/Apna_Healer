import { JournalCardVariant } from "@prisma/client";

function stripHtmlToPlain(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function inferCardVariant(
  contentHtml: string,
  coverImageUrl: string | null,
): JournalCardVariant {
  const html = contentHtml.toLowerCase();
  if (coverImageUrl) return JournalCardVariant.IMAGE;
  if (/<blockquote/i.test(html)) return JournalCardVariant.QUOTE;
  if (/<ul|<ol/i.test(html)) return JournalCardVariant.LIST;
  if (/\b(midnight|dark|shadow|grief|anxiety)\b/i.test(stripHtmlToPlain(contentHtml))) {
    return JournalCardVariant.DARK;
  }
  return JournalCardVariant.REFLECTION;
}
