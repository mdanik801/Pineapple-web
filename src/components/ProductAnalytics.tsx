"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics-client";

export default function ProductAnalytics({
  productId,
  productSlug,
  categoryId,
  categorySlug,
}: {
  productId?: string | null;
  productSlug?: string | null;
  categoryId?: string | null;
  categorySlug?: string | null;
}) {
  useEffect(() => {
    if (!productId && !productSlug) return;
    trackEvent({
      event_type: "product_view",
      page_type: "product",
      page_path: typeof window !== "undefined" ? window.location.pathname : undefined,
      page_url: typeof window !== "undefined" ? window.location.href : undefined,
      page_title: typeof document !== "undefined" ? document.title : undefined,
      product_id: productId ?? null,
      product_slug: productSlug ?? null,
      category_id: categoryId ?? null,
      category_slug: categorySlug ?? null,
    });
  }, [productId, productSlug, categoryId, categorySlug]);

  return null;
}
