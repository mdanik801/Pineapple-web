"use server";
import { getProductsByIds, getProductDetail, searchProductsUniversal, listProducts } from "@/lib/data";
import { normalizeSearchQuery } from "@/lib/search-utils";

export async function getWishlistProducts(ids: string[]) {
  try {
    return await getProductsByIds(ids.filter((i) => /^[0-9a-f-]{36}$/i.test(i)).slice(0, 100));
  } catch {
    return [];
  }
}

export async function getQuickView(slug: string) {
  try {
    const p = await getProductDetail(slug);
    if (!p) return null;
    return {
      id: p.id, name: p.name, slug: p.slug, images: p.images,
      regular_price: p.regular_price, sale_price: p.sale_price, price: p.price,
      variants: p.variants, baseStock: p.baseStock,
    };
  } catch {
    return null;
  }
}

export type SearchActionResult = {
  items: Awaited<ReturnType<typeof searchProductsUniversal>>["products"];
  query: string;
  error: string | null;
  unavailable: boolean;
};

export async function searchProducts(q: string, limit = 8): Promise<SearchActionResult> {
  try {
    const query = normalizeSearchQuery(q);
    if (query.length < 1) return { items: [], query, error: null, unavailable: false };
    const safeLimit = Math.max(1, Math.min(12, Number(limit) || 8));
    const res = await searchProductsUniversal({ q: query, limit: safeLimit, page: 1 });
    return { items: res.products, query: res.query, error: res.error, unavailable: res.unavailable };
  } catch {
    return { items: [], query: normalizeSearchQuery(q), error: "Search is temporarily unavailable. Please try again.", unavailable: true };
  }
}

export async function getSuggestedProducts(limit = 8) {
  try {
    const safeLimit = Math.max(1, Math.min(12, Number(limit) || 8));
    const f = await listProducts({ flag: "featured", limit: safeLimit });
    if (f.products.length) return f.products.slice(0, safeLimit);
    const recent = await listProducts({ limit: safeLimit, sort: "new" });
    return (recent.products || []).slice(0, safeLimit);
  } catch {
    return [];
  }
}
