import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "./supabase";
import { effectivePrice } from "./format";
import { normalizeHeroBanners } from "./hero-banners";

const SITE_CONTENT_REVALIDATE = 60;

export type Category = {
  id: string; name: string; slug: string; description: string | null;
  image_url: string | null; parent_id: string | null; display_order: number | null;
};

export type ProductCardData = {
  id: string; name: string; slug: string;
  regular_price: number; sale_price: number | null; price: number;
  image: string | null; image2: string | null;
  category_id: string | null; is_new: boolean; in_stock: boolean;
  stock: number; has_variants: boolean;
  swatches: { color: string; image: string | null }[];
};

export type Variant = {
  id: string; sku: string; size: string | null; color: string | null;
  regular_price: number; sale_price: number | null; price: number;
  image_url: string | null; stock: number;
};

export type BrandData = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  logo_url: string | null;
};

export type PaymentMethod = { gateway_id: string; name: string };

export type HomepageBottomCarouselItem = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  button_text: string;
  button_url: string;
  image_url: string;
  active: true;
  sort_order: number | null;
};

const PRODUCT_COLS =
  "id,name,slug,regular_price,sale_price,category_id,featured_image,is_new_arrival,created_at,product_images(url,is_primary,display_order),product_variants(id,status,color,image_url)";

type RawProduct = {
  id: string; name: string; slug: string; regular_price: number; sale_price: number | null;
  category_id: string | null; featured_image: string | null; is_new_arrival: boolean | null;
  product_images?: { url: string; is_primary: boolean | null; display_order: number | null }[];
  product_variants?: { id: string; status: string | null; color: string | null; image_url: string | null }[];
};

function validProductImage(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const image = value.trim();
  if (image.startsWith("/") && !image.startsWith("//")) return image;

  try {
    const url = new URL(image);
    return (url.protocol === "https:" || url.protocol === "http:") ? image : null;
  } catch {
    return null;
  }
}

function pickImages(p: Pick<RawProduct, "featured_image" | "product_images">) {
  const gallery = [...(p.product_images ?? [])]
    .map((image) => ({ ...image, url: validProductImage(image.url) }))
    .filter((image): image is typeof image & { url: string } => !!image.url)
    .sort(
      (a, b) => Number(b.is_primary) - Number(a.is_primary) || (a.display_order ?? 0) - (b.display_order ?? 0),
    );
  const primary = gallery.find((image) => image.is_primary)?.url;
  const featured = validProductImage(p.featured_image);
  return [...new Set([primary, ...gallery.map((image) => image.url), featured].filter((url): url is string => !!url))];
}

function swatchesOf(p: RawProduct) {
  const seen = new Map<string, string | null>();
  for (const v of p.product_variants ?? []) {
    if (v.status !== "active" || !v.color) continue;
    const img = validProductImage(v.image_url);
    if (!seen.has(v.color) || (!seen.get(v.color) && img)) seen.set(v.color, img);
  }
  return [...seen].map(([color, image]) => ({ color, image }));
}

async function stockMap(productIds: string[]) {
  const map = new Map<string, number>();
  if (!productIds.length) return map;
  const { data } = await db.from("inventory").select("product_id,current_stock,reserved_stock").in("product_id", productIds);
  for (const r of data ?? []) {
    map.set(r.product_id, (map.get(r.product_id) ?? 0) + Math.max(0, r.current_stock - r.reserved_stock));
  }
  return map;
}

async function toCards(rows: RawProduct[]): Promise<ProductCardData[]> {
  const stock = await stockMap(rows.map((r) => r.id));
  return rows.map((p) => {
    const imgs = pickImages(p);
    return {
      id: p.id, name: p.name, slug: p.slug,
      regular_price: Number(p.regular_price),
      sale_price: p.sale_price == null ? null : Number(p.sale_price),
      price: effectivePrice(p.regular_price, p.sale_price),
      image: imgs[0] ?? null, image2: imgs[1] ?? null,
      category_id: p.category_id, is_new: !!p.is_new_arrival,
      in_stock: (stock.get(p.id) ?? 0) > 0,
      stock: stock.get(p.id) ?? 0,
      has_variants: (p.product_variants ?? []).some((v) => v.status === "active"),
      swatches: swatchesOf(p),
    };
  });
}

export const getCategories = unstable_cache(async (): Promise<Category[]> => {
  const { data } = await db
    .from("categories")
    .select("id,name,slug,description,image_url,parent_id,display_order")
    .eq("status", "active")
    .order("display_order", { ascending: true, nullsFirst: false })
    .order("name");
  return (data ?? []) as Category[];
}, ["site-categories-v1"], { revalidate: SITE_CONTENT_REVALIDATE, tags: ["site-content"] });

export const getSettings = unstable_cache(async () => {
  const { data } = await db
    .from("business_settings")
    .select("company_name,brand_name,company_logo,website,phone,email,support_phone,support_email,whatsapp,address,office_address,business_hours,description")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}, ["site-settings-v1"], { revalidate: SITE_CONTENT_REVALIDATE, tags: ["site-content"] });

export const getBrands = unstable_cache(async (): Promise<BrandData[]> => {
  const { data } = await db
    .from("brands")
    .select("id,name,slug,description,logo_url,status")
    .eq("status", "active")
    .order("name");
  return (data ?? []) as BrandData[];
}, ["site-brands-v1"], { revalidate: SITE_CONTENT_REVALIDATE, tags: ["site-content"] });

export const getPaymentMethods = unstable_cache(async (): Promise<PaymentMethod[]> => {
  const { data } = await db
    .from("payment_gateways_config")
    .select("gateway_id,name,is_enabled")
    .eq("is_enabled", true)
    .order("name");
  return (data ?? []).map(({ gateway_id, name }) => ({ gateway_id, name }));
}, ["site-payment-methods-v1"], { revalidate: SITE_CONTENT_REVALIDATE, tags: ["site-content"] });

export const getSocial = unstable_cache(async () => {
  const { data } = await db.from("website_content").select("content_data").eq("section_key", "social_links").maybeSingle();
  return (data?.content_data ?? {}) as Record<string, string>;
}, ["site-social-links-v1"], { revalidate: SITE_CONTENT_REVALIDATE, tags: ["site-content"] });

export const getPolicies = unstable_cache(async () => {
  const { data } = await db.from("website_content").select("content_data").eq("section_key", "policies").maybeSingle();
  return (data?.content_data ?? {}) as Record<string, string>;
}, ["site-policies-v1"], { revalidate: SITE_CONTENT_REVALIDATE, tags: ["site-content"] });

export const getBanners = unstable_cache(async () => {
  const { data, error } = await db
    .from("website_content")
    .select("content_data")
    .eq("section_key", "hero_banner")
    .maybeSingle();
  if (error || !data) return [];

  let allowedImageHost: string | undefined;
  try {
    allowedImageHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;
  } catch {}
  return normalizeHeroBanners(data.content_data, allowedImageHost);
}, ["website-content-hero-banner-v3"], { revalidate: 60, tags: ["hero-banners"] });

function normalizeHomepageBottomCarousel(value: unknown): HomepageBottomCarouselItem[] {
  if (!value || typeof value !== "object" || !Array.isArray((value as { items?: unknown }).items)) return [];

  const items = (value as { items: unknown[] }).items;
  return items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !!item && typeof item === "object" && (item as { active?: unknown }).active === true)
    .sort((a, b) => {
      const aOrder = (a.item as { sort_order?: unknown }).sort_order;
      const bOrder = (b.item as { sort_order?: unknown }).sort_order;
      const aValue = typeof aOrder === "number" && Number.isFinite(aOrder) ? aOrder : Number.POSITIVE_INFINITY;
      const bValue = typeof bOrder === "number" && Number.isFinite(bOrder) ? bOrder : Number.POSITIVE_INFINITY;
      return aValue - bValue || a.index - b.index;
    })
    .map(({ item, index }) => {
      const row = item as Record<string, unknown>;
      const text = (field: unknown) => typeof field === "string" ? field : "";
      const order = row.sort_order;
      return {
        id: text(row.id) || `homepage-bottom-${index}`,
        title: text(row.title),
        subtitle: text(row.subtitle),
        description: text(row.description),
        button_text: text(row.button_text),
        button_url: text(row.button_url),
        image_url: text(row.image_url),
        active: true as const,
        sort_order: typeof order === "number" && Number.isFinite(order) ? order : null,
      };
    });
}

export const getHomepageBottomCarousel = unstable_cache(async (): Promise<HomepageBottomCarouselItem[]> => {
  try {
    const { data, error } = await db
      .from("website_content")
      .select("content_data")
      .eq("section_key", "homepage_bottom_carousel")
      .maybeSingle();
    if (error || !data) return [];
    return normalizeHomepageBottomCarousel(data.content_data);
  } catch {
    return [];
  }
}, ["website-content-homepage-bottom-carousel-v1"], {
  revalidate: 60,
  tags: ["homepage-bottom-carousel"],
});

export type ListOpts = {
  categoryIds?: string[]; q?: string; sort?: string; min?: number; max?: number;
  size?: string; avail?: "in" | "out"; collectionId?: string; flag?: "new" | "featured" | "trending"; limit?: number; page?: number; excludeId?: string;
};

export async function listProducts(o: ListOpts = {}) {
  const limit = o.limit ?? 24;
  const page = Math.max(1, o.page ?? 1);
  let q = db
    .from("products")
    .select(PRODUCT_COLS, { count: "exact" })
    .eq("status", "published")
    .is("deleted_at", null);
  if (o.categoryIds?.length) q = q.in("category_id", o.categoryIds);
  if (o.q) q = q.ilike("name", `%${o.q.replace(/[%,]/g, " ")}%`);
  if (o.min != null) q = q.gte("regular_price", o.min);
  if (o.max != null) q = q.lte("regular_price", o.max);
  if (o.flag === "new") q = q.eq("is_new_arrival", true);
  if (o.flag === "featured") q = q.eq("is_featured", true);
  if (o.flag === "trending") q = q.eq("is_trending", true);
  if (o.excludeId) q = q.neq("id", o.excludeId);
  if (o.collectionId) q = q.eq("collection_id", o.collectionId);
  if (o.avail) {
    const s = await inStockSet();
    if (o.avail === "in") {
      if (!s.size) return { products: [] as ProductCardData[], total: 0, pages: 1 };
      q = q.in("id", [...s]);
    } else if (s.size) q = q.not("id", "in", `(${[...s].join(",")})`);
  }
  if (o.size) {
    const { data: vs } = await db.from("product_variants").select("product_id").eq("size", o.size).eq("status", "active");
    const ids = [...new Set((vs ?? []).map((v) => v.product_id))];
    if (!ids.length) return { products: [] as ProductCardData[], total: 0, pages: 1 };
    q = q.in("id", ids);
  }
  switch (o.sort) {
    case "price-asc": q = q.order("regular_price", { ascending: true }); break;
    case "price-desc": q = q.order("regular_price", { ascending: false }); break;
    case "name": q = q.order("name", { ascending: true }); break;
    default: q = q.order("created_at", { ascending: false });
  }
  const from = (page - 1) * limit;
  const { data, count } = await q.range(from, from + limit - 1);
  return { products: await toCards((data ?? []) as unknown as RawProduct[]), total: count ?? 0, pages: Math.max(1, Math.ceil((count ?? 0) / limit)) };
}

export async function getProductsByIds(ids: string[]) {
  if (!ids.length) return [];
  const { data } = await db
    .from("products").select(PRODUCT_COLS).in("id", ids).eq("status", "published").is("deleted_at", null);
  return toCards((data ?? []) as unknown as RawProduct[]);
}

export async function getProductDetail(slug: string) {
  const { data: p } = await db
    .from("products")
    .select(`${PRODUCT_COLS},sku,description,short_description,seo_title,seo_description,brand_id,is_new_arrival,brands(name),categories(id,name,slug)`)
    .eq("slug", slug).eq("status", "published").is("deleted_at", null).maybeSingle();
  if (!p) return null;
  const raw = p as unknown as RawProduct & {
    sku: string; description: string | null; short_description: string | null;
    seo_title: string | null; seo_description: string | null;
    brands: { name: string } | null; categories: { id: string; name: string; slug: string } | null;
  };
  const [{ data: vars }, { data: inv }] = await Promise.all([
    db.from("product_variants").select("id,sku,size,color,regular_price,sale_price,image_url").eq("product_id", raw.id).eq("status", "active").order("created_at"),
    db.from("inventory").select("variant_id,current_stock,reserved_stock").eq("product_id", raw.id),
  ]);
  const avail = (variantId: string | null) =>
    (inv ?? []).filter((r) => r.variant_id === variantId).reduce((s, r) => s + Math.max(0, r.current_stock - r.reserved_stock), 0);
  const variants: Variant[] = (vars ?? []).map((v) => ({
    id: v.id, sku: v.sku, size: v.size, color: v.color,
    regular_price: Number(v.regular_price), sale_price: v.sale_price == null ? null : Number(v.sale_price),
    price: effectivePrice(v.regular_price, v.sale_price),
    image_url: v.image_url, stock: avail(v.id),
  }));
  const baseStock = avail(null);
  return {
    id: raw.id, name: raw.name, slug: raw.slug, sku: raw.sku,
    description: raw.description, short_description: raw.short_description,
    seo_title: raw.seo_title, seo_description: raw.seo_description,
    regular_price: Number(raw.regular_price),
    sale_price: raw.sale_price == null ? null : Number(raw.sale_price),
    price: effectivePrice(raw.regular_price, raw.sale_price),
    images: pickImages(raw), brand: raw.brands?.name ?? null, category: raw.categories,
    variants, stock: variants.length ? variants.reduce((s, v) => s + v.stock, 0) : baseStock,
    baseStock,
  };
}

export const getShippingZones = unstable_cache(async () => {
  const { data } = await db.from("shipping_zones").select("name,rate,estimated_days,free_shipping_threshold").eq("is_active", true).order("rate");
  const seen = new Set<string>();
  return (data ?? [])
    .filter((z) => (seen.has(z.name) ? false : (seen.add(z.name), true)))
    .map((z) => ({
      name: z.name as string, rate: Number(z.rate), estimated_days: z.estimated_days as string | null,
      free_shipping_threshold: z.free_shipping_threshold == null ? null : Number(z.free_shipping_threshold),
    }));
}, ["site-shipping-zones-v1"], { revalidate: SITE_CONTENT_REVALIDATE, tags: ["site-content"] });

/** Category + all descendants ids */
export function descendantIds(all: Category[], id: string): string[] {
  const out = [id];
  for (const c of all) if (c.parent_id === id) out.push(...descendantIds(all, c.id));
  return out;
}

export const getSizes = unstable_cache(async (): Promise<string[]> => {
  const { data } = await db.from("product_variants").select("size").eq("status", "active").not("size", "is", null);
  const uniq = [...new Set((data ?? []).map((r) => String(r.size)))];
  const order = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "3XL"];
  return uniq.sort((a, b) => {
    const na = parseFloat(a), nb = parseFloat(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    const ia = order.indexOf(a.toUpperCase()), ib = order.indexOf(b.toUpperCase());
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });
}, ["site-sizes-v1"], { revalidate: SITE_CONTENT_REVALIDATE, tags: ["site-content"] });

/** Most common meaningful words across published product names — used as "popular search terms". */
export const getPopularTerms = unstable_cache(async (): Promise<string[]> => {
  const { data } = await db.from("products").select("name").eq("status", "published").is("deleted_at", null).limit(300);
  const stop = new Set(["with", "and", "for", "the", "fit", "men", "mens", "women", "womens", "years", "pack", "set"]);
  const count = new Map<string, number>();
  for (const { name } of data ?? []) {
    for (const w of new Set(String(name).toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/))) {
      if (w.length >= 4 && !stop.has(w)) count.set(w, (count.get(w) ?? 0) + 1);
    }
  }
  return [...count].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([w]) => w);
}, ["site-popular-terms-v1"], { revalidate: SITE_CONTENT_REVALIDATE, tags: ["site-content"] });

/** ids of products that currently have sellable stock */
export const inStockSet = unstable_cache(async (): Promise<Set<string>> => {
  const { data } = await db.from("inventory").select("product_id,current_stock,reserved_stock").limit(5000);
  const sum = new Map<string, number>();
  for (const r of data ?? []) sum.set(r.product_id, (sum.get(r.product_id) ?? 0) + Math.max(0, r.current_stock - r.reserved_stock));
  return new Set([...sum].filter(([, n]) => n > 0).map(([id]) => id));
}, ["site-instock-set-v1"], { revalidate: SITE_CONTENT_REVALIDATE, tags: ["site-content"] });

const esc = (s: string) => s.replace(/[%,()]/g, " ").trim();

/** Facet counts for a search term (ignores other active filters). */
export async function searchFacets(term: string) {
  const { data } = await db.from("products").select("id,category_id,regular_price")
    .eq("status", "published").is("deleted_at", null).ilike("name", `%${esc(term)}%`).limit(1000);
  const rows = data ?? [];
  const stock = await inStockSet();
  const inStock = rows.filter((r) => stock.has(r.id)).length;
  const byCategory = new Map<string, number>();
  for (const r of rows) if (r.category_id) byCategory.set(r.category_id, (byCategory.get(r.category_id) ?? 0) + 1);
  return {
    total: rows.length, inStock, outStock: rows.length - inStock, byCategory,
    maxPrice: Math.ceil(Math.max(0, ...rows.map((r) => Number(r.regular_price))) / 100) * 100,
  };
}

export type CollectionLite = { id: string; name: string; slug: string; description: string | null; image_url: string | null };

export async function searchCollections(term: string): Promise<CollectionLite[]> {
  const { data } = await db.from("collections").select("id,name,slug,description,image_url")
    .eq("status", "active").ilike("name", `%${esc(term)}%`).order("name");
  return (data ?? []) as CollectionLite[];
}

export async function getCollection(slug: string): Promise<CollectionLite | null> {
  const { data } = await db.from("collections").select("id,name,slug,description,image_url").eq("slug", slug).eq("status", "active").maybeSingle();
  return (data as CollectionLite) ?? null;
}
