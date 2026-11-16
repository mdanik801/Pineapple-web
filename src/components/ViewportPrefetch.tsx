"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Prefetch a route when the given element enters the viewport.
 * Conservative: only prefetches likely-next product links and only on capable connections.
 */
export default function ViewportPrefetch({ href, rootMargin = "180px" }: { href: string; rootMargin?: string }) {
  const router = useRouter();

  useEffect(() => {
    if (!href) return;
    if (typeof window === "undefined") return;
    // Avoid wasting mobile/cellular data when user opted-in to data saving or on slow/2g-like connections.
    const nav = (navigator as any);
    const saveData = !!nav?.connection?.saveData;
    const effectiveType = String(nav?.connection?.effectiveType || "");
    if (saveData || effectiveType.includes("2g")) return;

    const el = document.getElementById(`prefetch-${href.replace(/[^a-zA-Z0-9_-]/g, "_")}`);
    if (!el) return;

    let done = false;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting || done) continue;
        done = true;
        try { router.prefetch(href); } catch {}
        io.disconnect();
        break;
      }
    }, { rootMargin, threshold: 0.01 });

    io.observe(el);
    return () => io.disconnect();
  }, [href, rootMargin, router]);

  return <span id={`prefetch-${href.replace(/[^a-zA-Z0-9_-]/g, "_")}`} aria-hidden className="absolute inset-0 pointer-events-none" />;
}
