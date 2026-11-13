export function normalizeSearchQuery(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

export function tokenizeSearchQuery(query: string): string[] {
  const q = normalizeSearchQuery(query).toLowerCase();
  if (!q) return [];
  const tokens = q
    .split(/[\s,;|/\\]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  // de-dupe while preserving order
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tokens) {
    if (t.length > 80) continue;
    if (!seen.has(t)) { seen.add(t); out.push(t); }
  }
  return out.slice(0, 8);
}

export function escapeIlikeTerm(term: string): string {
  // Escape PostgREST/LIKE wildcards and characters that can break .or() filter strings
  return term
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")
    .replace(/[(),]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isSafeSearchInput(query: string): boolean {
  const q = normalizeSearchQuery(query);
  if (!q) return true;
  if (q.length > 120) return false;
  return true;
}

export function logSearchError(scope: string, error: unknown, meta?: Record<string, unknown>) {
  try {
    const message = error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown search error";
    console.error(`[search:${scope}]`, message, meta ?? {}, error);
  } catch {
    // never throw from logger
  }
}
