"use client";

export type AnalyticsEventType = "page_view" | "product_view" | "category_view" | "search" | "inquiry" | "heartbeat" | "session_start";

export type TrackPayload = {
  event_type: AnalyticsEventType;
  page_url?: string;
  page_path?: string;
  page_title?: string;
  page_type?: string;
  product_id?: string | null;
  product_slug?: string | null;
  category_id?: string | null;
  category_slug?: string | null;
  referrer?: string | null;
  metadata?: Record<string, unknown>;
  occurred_at?: string;
};

const VISITOR_KEY = "alec_visitor_id_v1";
const SESSION_KEY = "alec_session_id_v1";
const SESSION_LAST = "alec_session_last_v1";
const LAST_PAGEVIEW_KEY = "alec_last_pv_v1";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 min inactivity -> new session

function safeNowIso() { return new Date().toISOString(); }
function randId() {
  try { if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID(); } catch {}
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getOrCreateVisitorId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) { id = randId(); localStorage.setItem(VISITOR_KEY, id); }
    return id;
  } catch { return null; }
}

export function getOrCreateSessionId(): { sessionId: string | null; isNew: boolean } {
  if (typeof window === "undefined") return { sessionId: null, isNew: false };
  try {
    const now = Date.now();
    const last = Number(sessionStorage.getItem(SESSION_LAST) || "0");
    let id = sessionStorage.getItem(SESSION_KEY);
    let isNew = false;
    if (!id || !last || (now - last) > SESSION_TIMEOUT_MS) {
      id = randId();
      isNew = true;
      sessionStorage.setItem(SESSION_KEY, id);
      try { sessionStorage.removeItem(LAST_PAGEVIEW_KEY); } catch {}
    }
    sessionStorage.setItem(SESSION_LAST, String(now));
    return { sessionId: id, isNew };
  } catch { return { sessionId: null, isNew: false }; }
}

function deviceType(): "Desktop" | "Mobile" | "Tablet" | "Unknown" {
  if (typeof navigator === "undefined") return "Unknown";
  const ua = navigator.userAgent || "";
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return "Tablet";
  if (/Mobi|Android|iPhone|iPod|IEMobile|BlackBerry|Opera Mini/i.test(ua)) return "Mobile";
  return "Desktop";
}

function browserFamily(): string {
  if (typeof navigator === "undefined") return "Unknown";
  const ua = navigator.userAgent || "";
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\/|Opera/.test(ua)) return "Opera";
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua) && !/OPR\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "Safari";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/MSIE |Trident\//.test(ua)) return "IE";
  return "Other";
}

function pageKey(p: TrackPayload) {
  return `${p.event_type}|${p.page_path || ""}|${p.product_id || ""}|${p.category_id || ""}`;
}

export async function trackEvent(payload: TrackPayload): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const visitorId = getOrCreateVisitorId();
    const { sessionId, isNew } = getOrCreateSessionId();
    if (!visitorId || !sessionId) return;

    // Basic client-side dedupe for identical rapid page_view/product/category events
    if (["page_view", "product_view", "category_view"].includes(payload.event_type)) {
      const key = pageKey(payload);
      const now = Date.now();
      let last: { key: string; at: number } | null = null;
      try { last = JSON.parse(sessionStorage.getItem(LAST_PAGEVIEW_KEY) || "null"); } catch {}
      if (last && last.key === key && (now - last.at) < 1500) return;
      try { sessionStorage.setItem(LAST_PAGEVIEW_KEY, JSON.stringify({ key, at: now })); } catch {}
    }

    const body = {
      visitor_id: visitorId,
      session_id: sessionId,
      session_is_new: isNew,
      device_type: deviceType(),
      browser_family: browserFamily(),
      referrer: payload.referrer ?? (typeof document !== "undefined" ? (document.referrer || null) : null),
      event_key: `${payload.event_type}:${payload.page_path || ""}:${payload.product_id || ""}:${payload.category_id || ""}:${Math.floor(Date.now() / 2000)}`,
      occurred_at: payload.occurred_at || safeNowIso(),
      ...payload,
      page_url: payload.page_url || (typeof window !== "undefined" ? window.location.href : undefined),
      page_path: payload.page_path || (typeof window !== "undefined" ? window.location.pathname + window.location.search : undefined),
      page_title: payload.page_title || (typeof document !== "undefined" ? document.title : undefined),
    };

    const json = JSON.stringify(body);
    // Prefer sendBeacon for page transitions/unload-safe events
    if (payload.event_type === "heartbeat" && typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      try {
        const blob = new Blob([json], { type: "application/json" });
        navigator.sendBeacon("/api/analytics/track", blob);
        return;
      } catch {}
    }

    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json,
      keepalive: payload.event_type === "page_view" || payload.event_type === "heartbeat",
      cache: "no-store",
    }).catch(() => {});
  } catch {
    // Never break customer site if tracking fails
  }
}
