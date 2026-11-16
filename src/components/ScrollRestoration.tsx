"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const KEY_PREFIX = "scroll-pos:";

function getKey() {
  if (typeof window === "undefined") return "";
  return KEY_PREFIX + window.location.pathname + window.location.search;
}

export default function ScrollRestoration() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in window.history) {
      try { window.history.scrollRestoration = "manual"; } catch {}
    }

    const key = getKey();
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const y = Number(raw);
      if (Number.isFinite(y) && y >= 0) {
        // Restore after paint/layout; retry once for async content
        requestAnimationFrame(() => window.scrollTo(0, y));
        setTimeout(() => window.scrollTo(0, y), 150);
      }
    } else {
      window.scrollTo(0, 0);
    }

    const save = () => {
      try { sessionStorage.setItem(getKey(), String(window.scrollY || window.pageYOffset || 0)); } catch {}
    };

    window.addEventListener("scroll", save, { passive: true });
    window.addEventListener("pagehide", save);
    window.addEventListener("beforeunload", save);
    const onPopState = () => {
      // allow next effect/render to restore saved position
      setTimeout(() => {
        const k = KEY_PREFIX + window.location.pathname + window.location.search;
        const v = sessionStorage.getItem(k);
        if (v) {
          const y = Number(v);
          if (Number.isFinite(y)) window.scrollTo(0, y);
        }
      }, 0);
    };
    window.addEventListener("popstate", onPopState);

    return () => {
      save();
      window.removeEventListener("scroll", save);
      window.removeEventListener("pagehide", save);
      window.removeEventListener("beforeunload", save);
      window.removeEventListener("popstate", onPopState);
    };
  }, [pathname, searchParams]);

  return null;
}
