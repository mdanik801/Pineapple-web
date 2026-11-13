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

export async function searchProducts(q: string): Promise<SearchActionResult> {
  try {
    const query = normalizeSearchQuery(q);
    if (query.length < 2) return { items: [], query, error: null, unavailable: false };
    const res = await searchProductsUniversal({ q: query, limit: 8, page: 1 });
    return { items: res.products, query: res.query, error: res.error, unavailable: res.unavailable };
  } catch {
    return { items: [], query: normalizeSearchQuery(q), error: "Search is temporarily unavailable. Please try again.", unavailable: true };
  }
}

export async function getSuggestedProducts() {
  try {
    const f = await listProducts({ flag: "featured", limit: 4 });
    return f.products.length ? f.products : (await listProducts({ limit: 4 })).products;
  } catch {
    return [];
  }
}
