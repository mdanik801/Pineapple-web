"use server";
import { getProductsByIds, getProductDetail, listProducts } from "@/lib/data";

export async function getWishlistProducts(ids: string[]) {
  return getProductsByIds(ids.filter((i) => /^[0-9a-f-]{36}$/i.test(i)).slice(0, 100));
}

export async function getQuickView(slug: string) {
  const p = await getProductDetail(slug);
  if (!p) return null;
  return {
    id: p.id, name: p.name, slug: p.slug, images: p.images,
    regular_price: p.regular_price, sale_price: p.sale_price, price: p.price,
    variants: p.variants, baseStock: p.baseStock,
  };
}

export async function searchProducts(q: string) {
  const term = q.trim().slice(0, 60);
  if (term.length < 2) return [];
  return (await listProducts({ q: term, limit: 8 })).products;
}

export async function getSuggestedProducts() {
  const f = await listProducts({ flag: "featured", limit: 4 });
  return f.products.length ? f.products : (await listProducts({ limit: 4 })).products;
}
