export function slugifyBlogTitle(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "blog-post";
}

export async function uniqueBlogSlug(
  title: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  let slug = slugifyBlogTitle(title);
  let n = 0;
  while (await exists(slug)) {
    n += 1;
    slug = `${slugifyBlogTitle(title)}-${n}`;
  }
  return slug;
}

export function resolvePublishStatus(role: string): "PUBLISHED" | "PENDING_REVIEW" {
  if (role === "THERAPIST" || role === "ADMIN") return "PUBLISHED";
  return "PENDING_REVIEW";
}

export function formatBlogDate(date: Date | null | undefined): string {
  if (!date) return "Draft";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatCount(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(value);
}
