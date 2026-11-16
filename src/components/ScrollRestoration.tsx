"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const KEY_PREFIX = "scroll-pos:";

function getKey() {
  if (typeof window === "undefined") return "";
  return KEY_PREFIX + window.location.pathname + window.location.search;
}

export default function ScrollRestoration() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isPopRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in window.history) {
      try { window.history.scrollRestoration = "manual"; } catch {}
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const key = getKey();
    const isPop = isPopRef.current;
    isPopRef.current = false;

    const raw = isPop ? sessionStorage.getItem(key) : null;
    if (isPop && raw) {
      const y = Number(raw);
      if (Number.isFinite(y) && y >= 0) {
        // Restore saved position on back/forward navigation
        requestAnimationFrame(() => window.scrollTo(0, y));
        setTimeout(() => window.scrollTo(0, y), 150);
      } else {
        window.scrollTo(0, 0);
      }
    } else {
      // Fresh navigations (e.g. link clicks like See All -> /shop) always start at top
      window.scrollTo(0, 0);
      try { sessionStorage.removeItem(key); } catch {}
    }

    const save = () => {
      try { sessionStorage.setItem(getKey(), String(window.scrollY || window.pageYOffset || 0)); } catch {}
    };

    const onPopState = () => {
      isPopRef.current = true;
    };

    window.addEventListener("scroll", save, { passive: true });
    window.addEventListener("pagehide", save);
    window.addEventListener("beforeunload", save);
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
