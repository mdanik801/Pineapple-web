"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/analytics-client";

function inferPageType(path: string): string {
  if (path === "/") return "home";
  if (path.startsWith("/product/")) return "product";
  if (path.startsWith("/category/")) return "category";
  if (path.startsWith("/collection/")) return "collection";
  if (path.startsWith("/search")) return "search";
  if (path.startsWith("/shop")) return "shop";
  if (path.startsWith("/cart")) return "cart";
  if (path.startsWith("/checkout")) return "checkout";
  if (path.startsWith("/pages/")) return "page";
  return "other";
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastKeyRef = useRef<string>("");
  const hbRef = useRef<number | null>(null);

  useEffect(() => {
    if (!pathname) return;
    const qs = searchParams?.toString();
    const fullPath = qs ? `${pathname}?${qs}` : pathname;
    if (lastKeyRef.current === fullPath) return;
    lastKeyRef.current = fullPath;

    const pageType = inferPageType(pathname);
    const base = {
      page_path: fullPath,
      page_url: typeof window !== "undefined" ? window.location.href : undefined,
      page_title: typeof document !== "undefined" ? document.title : undefined,
      page_type: pageType,
    } as const;

    // Generic page view for all pages
    trackEvent({ event_type: "page_view", ...base });

    // Lightweight aggregate search event (query length only, no sensitive data)
    if (pathname === "/search") {
      const q = searchParams?.get("q") || "";
      const qLen = q.trim().length;
      if (qLen > 0) {
        trackEvent({ event_type: "search", ...base, metadata: { query_length: Math.min(qLen, 120), has_query: true } });
      }
    }

    // Heartbeat for live-visitor last_activity updates
    if (hbRef.current) window.clearInterval(hbRef.current);
    hbRef.current = window.setInterval(() => {
      trackEvent({ event_type: "heartbeat", page_path: fullPath, page_type: pageType, page_url: typeof window !== "undefined" ? window.location.href : undefined });
    }, 30000);

    const onVis = () => {
      if (document.visibilityState === "visible") {
        trackEvent({ event_type: "heartbeat", page_path: fullPath, page_type: pageType, page_url: typeof window !== "undefined" ? window.location.href : undefined });
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      if (hbRef.current) { window.clearInterval(hbRef.current); hbRef.current = null; }
    };
  }, [pathname, searchParams]);

  return null;
}
