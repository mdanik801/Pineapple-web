import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_EVENTS = new Set(["page_view", "product_view", "category_view", "search", "inquiry", "heartbeat", "session_start"]);
const ALLOWED_PAGE_TYPES = new Set(["home", "product", "category", "search", "collection", "page", "cart", "checkout", "shop", "other"]);
const MAX_STR = 500;

function s(v: unknown, max = MAX_STR): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, max);
}
function clampPath(v: unknown): string | null {
  const t = s(v, 2048);
  if (!t) return null;
  return t;
}
function isIdLike(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
    || /^id-[a-z0-9]+$/i.test(v)
    || /^[a-zA-Z0-9_-]{8,80}$/.test(v);
}
function refSource(ref: string | null): string | null {
  if (!ref) return "direct";
  try {
    const u = new URL(ref);
    const h = (u.hostname || "").toLowerCase();
    if (!h) return "direct";
    if (h.includes("google.")) return "google";
    if (h.includes("bing.")) return "bing";
    if (h.includes("facebook.") || h === "l.facebook.com" || h.includes("fb.")) return "facebook";
    if (h.includes("instagram.")) return "instagram";
    if (h.includes("youtube.") || h === "youtu.be") return "youtube";
    if (h.includes("t.co") || h.includes("twitter.") || h.includes("x.com")) return "x";
    return h.slice(0, 80);
  } catch {
    return "external";
  }
}
function sanitizeMeta(meta: unknown): Record<string, unknown> | null {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta as Record<string, unknown>)) {
    if (!/^[a-zA-Z0-9_.-]{1,40}$/.test(k)) continue;
    const lk = k.toLowerCase();
    if (lk.includes("password") || lk.includes("token") || lk.includes("secret") || lk.includes("email") || lk.includes("phone") || lk.includes("address") || lk.includes("payment")) continue;
    if (typeof v === "string") out[k] = v.slice(0, 120);
    else if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    else if (typeof v === "boolean") out[k] = v;
  }
  return Object.keys(out).length ? out : null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }
    const payload = body as Record<string, unknown>;

    const visitorKey = s(payload.visitor_id, 80);
    const sessionKey = s(payload.session_id, 80);
    const eventType = s(payload.event_type, 40);
    if (!visitorKey || !sessionKey || !eventType) return NextResponse.json({ ok: false, error: "missing_ids" }, { status: 400 });
    if (!isIdLike(visitorKey) || !isIdLike(sessionKey)) return NextResponse.json({ ok: false, error: "invalid_ids" }, { status: 400 });
    if (!ALLOWED_EVENTS.has(eventType)) return NextResponse.json({ ok: false, error: "invalid_event" }, { status: 400 });

    const nowIso = new Date().toISOString();
    const occurredAt = (() => {
      const v = s(payload.occurred_at, 40);
      if (!v) return nowIso;
      const d = new Date(v);
      if (isNaN(d.getTime())) return nowIso;
      const diff = Math.abs(Date.now() - d.getTime());
      if (diff > 7 * 24 * 60 * 60 * 1000) return nowIso;
      return d.toISOString();
    })();

    const pageUrl = clampPath(payload.page_url);
    let pagePath = clampPath(payload.page_path);
    if (!pagePath && pageUrl) {
      try {
        const u = new URL(pageUrl);
        pagePath = ((u.pathname || "/") + (u.search || "")).slice(0, 2048);
      } catch {}
    }

    let pageType = s(payload.page_type, 40);
    if (pageType && !ALLOWED_PAGE_TYPES.has(pageType)) pageType = "other";
    if (!pageType && pagePath) {
      if (pagePath === "/") pageType = "home";
      else if (pagePath.startsWith("/product/")) pageType = "product";
      else if (pagePath.startsWith("/category/")) pageType = "category";
      else if (pagePath.startsWith("/search")) pageType = "search";
      else if (pagePath.startsWith("/collection/")) pageType = "collection";
      else if (pagePath.startsWith("/cart")) pageType = "cart";
      else if (pagePath.startsWith("/checkout")) pageType = "checkout";
      else if (pagePath.startsWith("/shop")) pageType = "shop";
      else pageType = "other";
    }

    const referrer = clampPath(payload.referrer);
    const refSrc = refSource(referrer);
    const deviceType = s(payload.device_type, 20);
    const browserFamily = s(payload.browser_family, 50);
    const sessionIsNew = !!payload.session_is_new;
    const eventKey = s(payload.event_key, 120);
    const pageTitle = s(payload.page_title, 200);
    const productId = s(payload.product_id, 80);
    const productSlug = s(payload.product_slug, 200);
    const categoryId = s(payload.category_id, 80);
    const categorySlug = s(payload.category_slug, 200);
    const metadata = sanitizeMeta(payload.metadata);

    // Visitor upsert
    let visitorId: string | null = null;
    const { data: existingVisitor, error: vSelErr } = await db
      .from("analytics_visitors")
      .select("id, visit_count")
      .eq("visitor_key", visitorKey)
      .maybeSingle();
    if (vSelErr) throw vSelErr;

    if (existingVisitor?.id) {
      visitorId = existingVisitor.id as string;
      const updates: Record<string, unknown> = { last_seen_at: nowIso, updated_at: nowIso };
      if (sessionIsNew) updates.visit_count = (Number(existingVisitor.visit_count) || 0) + 1;
      const { error: upVErr } = await db.from("analytics_visitors").update(updates).eq("id", visitorId);
      if (upVErr) throw upVErr;
    } else {
      const { data: insV, error: insVErr } = await db
        .from("analytics_visitors")
        .insert({ visitor_key: visitorKey, first_seen_at: nowIso, last_seen_at: nowIso, visit_count: 1, created_at: nowIso, updated_at: nowIso })
        .select("id")
        .single();
      if (insVErr) {
        const { data: again, error: againErr } = await db.from("analytics_visitors").select("id").eq("visitor_key", visitorKey).maybeSingle();
        if (againErr) throw againErr;
        visitorId = again?.id || null;
      } else {
        visitorId = insV.id;
      }
    }
    if (!visitorId) return NextResponse.json({ ok: false, error: "visitor_unavailable" }, { status: 503 });

    // Session upsert
    let sessionId: string | null = null;
    const isPageCountEvent = eventType === "page_view" || eventType === "product_view" || eventType === "category_view";
    const { data: existingSession, error: sSelErr } = await db
      .from("analytics_sessions")
      .select("id, page_view_count, is_active")
      .eq("session_key", sessionKey)
      .maybeSingle();
    if (sSelErr) throw sSelErr;

    if (existingSession?.id) {
      sessionId = existingSession.id as string;
      const sessUpdates: Record<string, unknown> = { last_activity_at: nowIso, updated_at: nowIso, is_active: true, ended_at: null };
      if (isPageCountEvent) sessUpdates.page_view_count = (Number(existingSession.page_view_count) || 0) + 1;
      const { error: upSErr } = await db.from("analytics_sessions").update(sessUpdates).eq("id", sessionId);
      if (upSErr) throw upSErr;
    } else {
      const { data: insS, error: insSErr } = await db
        .from("analytics_sessions")
        .insert({
          session_key: sessionKey,
          visitor_id: visitorId,
          started_at: nowIso,
          last_activity_at: nowIso,
          landing_page: pageUrl,
          landing_path: pagePath,
          referrer,
          referrer_source: refSrc,
          device_type: deviceType,
          browser_family: browserFamily,
          is_active: true,
          page_view_count: isPageCountEvent ? 1 : 0,
          created_at: nowIso,
          updated_at: nowIso,
        })
        .select("id")
        .single();
      if (insSErr) {
        const { data: again, error: againErr } = await db.from("analytics_sessions").select("id").eq("session_key", sessionKey).maybeSingle();
        if (againErr) throw againErr;
        sessionId = again?.id || null;
      } else {
        sessionId = insS.id;
        await db.from("analytics_visitors").update({ first_session_id: sessionId }).eq("id", visitorId).is("first_session_id", null);
      }
    }
    if (!sessionId) return NextResponse.json({ ok: false, error: "session_unavailable" }, { status: 503 });

    // Event insert (dedupe by unique session_id+event_key where configured)
    const eventRow: Record<string, unknown> = {
      event_key: eventKey,
      visitor_id: visitorId,
      session_id: sessionId,
      event_type: eventType,
      page_url: pageUrl,
      page_path: pagePath,
      page_title: pageTitle,
      page_type: pageType,
      product_id: productId,
      product_slug: productSlug,
      category_id: categoryId,
      category_slug: categorySlug,
      referrer,
      referrer_source: refSrc,
      device_type: deviceType,
      browser_family: browserFamily,
      metadata,
      occurred_at: occurredAt,
      created_at: nowIso,
    };

    const { error: evErr } = await db.from("analytics_events").insert(eventRow);
    if (evErr) {
      const e = evErr as { message?: string; code?: string };
      const msg = String(e.message || "").toLowerCase();
      const code = String(e.code || "");
      if (!(msg.includes("duplicate") || msg.includes("unique") || code === "23505")) throw evErr;
    }

    return NextResponse.json({ ok: true }, { status: 202 });
  } catch (err: unknown) {
    const e = err as { message?: string } | null;
    console.error("analytics.track error", e?.message || err);
    return NextResponse.json({ ok: false, error: "ingest_failed" }, { status: 500 });
  }
}
