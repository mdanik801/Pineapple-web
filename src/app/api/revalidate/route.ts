import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

function asStringArray(value: unknown): string[] {
  if (typeof value === "string" && value.trim()) return [value.trim()];
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0).map((v) => v.trim());
  return [];
}

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.REVALIDATE_SECRET || process.env.CUSTOMER_REVALIDATE_SECRET;
    const headerSecret = request.headers.get("x-revalidate-secret");
    if (secret && headerSecret !== secret) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const body: unknown = await request.json().catch(() => null);
    const data = body && typeof body === "object" ? (body as Record<string, unknown>) : {};

    const tags = new Set<string>([
      ...asStringArray(data.tag),
      ...asStringArray(data.tags),
    ]);
    // Always refresh core homepage/site content caches for safety when triggered by admin.
    ["hero-banners", "homepage-bottom-carousel", "homepage-cms", "site-content"].forEach((t) => tags.add(t));

    const paths = new Set<string>(["/", ...asStringArray(data.path), ...asStringArray(data.paths)]);

    for (const tag of tags) {
      try { revalidateTag(tag, "max"); } catch {}
    }
    for (const path of paths) {
      try { revalidatePath(path); } catch {}
    }
    return NextResponse.json({ success: true, revalidated: true, tags: [...tags], paths: [...paths] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Revalidate failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
