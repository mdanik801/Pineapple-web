export function normalizeSlugPathSegment(slug: string | null | undefined): string {
  if (!slug) return "";
  return slug.trim().replace(/^\/+/, "").replace(/\/+$/, "");
}

export function categoryHref(slug: string | null | undefined): string {
  const s = normalizeSlugPathSegment(slug);
  return s ? `/category/${s}` : "/shop";
}
