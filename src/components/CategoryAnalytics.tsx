"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics-client";

export default function CategoryAnalytics({
  categoryId,
  categorySlug,
}: {
  categoryId?: string | null;
  categorySlug?: string | null;
}) {
  useEffect(() => {
    if (!categoryId && !categorySlug) return;
    trackEvent({
      event_type: "category_view",
      page_type: "category",
      page_path: typeof window !== "undefined" ? window.location.pathname : undefined,
      page_url: typeof window !== "undefined" ? window.location.href : undefined,
      page_title: typeof document !== "undefined" ? document.title : undefined,
      category_id: categoryId ?? null,
      category_slug: categorySlug ?? null,
    });
  }, [categoryId, categorySlug]);

  return null;
}
