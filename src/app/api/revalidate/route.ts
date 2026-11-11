import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.REVALIDATE_SECRET || process.env.CUSTOMER_REVALIDATE_SECRET;
    const headerSecret = request.headers.get("x-revalidate-secret");
    if (secret && headerSecret !== secret) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const body: unknown = await request.json().catch(() => null);
    const data = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const tag = typeof data.tag === "string" ? data.tag : undefined;
    const path = typeof data.path === "string" ? data.path : "/";
    if (tag) revalidateTag(tag, "max");
    revalidateTag("hero-banners", "max");
    revalidateTag("homepage-bottom-carousel", "max");
    revalidateTag("homepage-cms", "max");
    revalidatePath(path);
    revalidatePath("/");
    return NextResponse.json({ success: true, revalidated: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Revalidate failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
