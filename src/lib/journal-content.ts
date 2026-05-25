export type ParsedJournalQuote = {
  text: string;
  label: string;
};

export type ParsedJournalContent = {
  paragraphs: string[];
  quote: ParsedJournalQuote | null;
  listItems: string[];
  inlineImage: string | null;
};

function stripTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function parseJournalHtml(
  html: string,
  coverImageUrl: string | null,
  tags: string[],
): ParsedJournalContent {
  if (typeof window === "undefined") {
    const plain = stripTags(html);
    return {
      paragraphs: plain ? plain.split(/\n\n+/).filter(Boolean) : [],
      quote: null,
      listItems: [],
      inlineImage: coverImageUrl,
    };
  }

  const doc = new DOMParser().parseFromString(html || "<p></p>", "text/html");
  const body = doc.body;

  let quote: ParsedJournalQuote | null = null;
  const blockquote = body.querySelector("blockquote");
  if (blockquote) {
    quote = {
      text: stripTags(blockquote.innerHTML),
      label: tags[0]?.toUpperCase() ?? "MORNING INTENTIONS",
    };
    blockquote.remove();
  }

  const listItems: string[] = [];
  body.querySelectorAll("ul li, ol li").forEach((li) => {
    const text = stripTags(li.innerHTML);
    if (text) listItems.push(text);
    li.closest("ul, ol")?.remove();
  });

  let inlineImage = coverImageUrl;
  const img = body.querySelector("img");
  if (img?.getAttribute("src")) {
    inlineImage = img.getAttribute("src");
    img.remove();
  }

  const paragraphs: string[] = [];
  const blockNodes = body.querySelectorAll("p, div");
  if (blockNodes.length > 0) {
    blockNodes.forEach((node) => {
      const text = stripTags(node.innerHTML);
      if (text) paragraphs.push(text);
    });
  } else {
    const plain = stripTags(body.innerHTML);
    if (plain) {
      plain.split(/\n\n+/).forEach((p) => {
        if (p.trim()) paragraphs.push(p.trim());
      });
    }
  }

  return { paragraphs, quote, listItems, inlineImage };
}

export function categoryLabelForEntry(
  tags: string[],
  cardVariant: string,
): string {
  if (tags[0]) return tags[0].toUpperCase();
  switch (cardVariant) {
    case "LIST":
      return "REFLECTION";
    case "QUOTE":
      return "SELF-DISCOVERY";
    case "DARK":
      return "MIDNIGHT REFLECTION";
    case "IMAGE":
      return "VISUAL JOURNAL";
    default:
      return "SELF-DISCOVERY";
  }
}

export function formatJournalHeaderDate(
  journalDateKey: string,
  completedAt: string | null,
): string {
  const date = new Date(`${journalDateKey}T12:00:00.000Z`);
  const month = date
    .toLocaleString("en-US", { month: "short", timeZone: "UTC" })
    .toUpperCase();
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();
  let timePart = "";
  if (completedAt) {
    const t = new Date(completedAt);
    const hours = t.getUTCHours().toString().padStart(2, "0");
    const mins = t.getUTCMinutes().toString().padStart(2, "0");
    timePart = ` • ${hours}:${mins}`;
  }
  return `${month} ${day}, ${year}${timePart}`;
}

export function moodLabel(mood: string | null): string {
  if (mood?.trim()) return mood.trim();
  return "Serene and Grounded";
}
