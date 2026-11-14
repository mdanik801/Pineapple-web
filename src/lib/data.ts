import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "./supabase";
import { effectivePrice } from "./format";
import { normalizeHeroBanners } from "./hero-banners";
import { normalizeSearchQuery, tokenizeSearchQuery, escapeIlikeTerm, logSearchError } from "./search-utils";

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
  brand?: string | null;
  sku?: string | null;
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
  mobile_image_url: string | null;
  active: true;
  sort_order: number | null;
};

const PRODUCT_COLS =
  "id,name,slug,sku,regular_price,sale_price,category_id,brand_id,featured_image,is_new_arrival,show_first,show_first_order,featured_added_at,created_at,brands(name),product_images(url,is_primary,display_order),product_variants(id,status,color,image_url,sku,size,attribute_summary)";

type RawProduct = {
  id: string; name: string; slug: string; sku?: string | null;
  regular_price: number; sale_price: number | null;
  category_id: string | null; featured_image: string | null; is_new_arrival: boolean | null;
  show_first?: boolean | null; show_first_order?: number | null;
  brand_id?: string | null;
  brands?: { name: string | null } | { name: string | null }[] | null;
  product_images?: { url: string; is_primary: boolean | null; display_order: number | null }[];
  product_variants?: { id: string; status: string | null; color?: string | null; image_url?: string | null; sku?: string | null; size?: string | null; attribute_summary?: string | null }[];
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

function brandNameOf(p: RawProduct): string | null {
  const b = p.brands;
  if (!b) return null;
  if (Array.isArray(b)) return b[0]?.name ?? null;
  return b.name ?? null;
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
      brand: brandNameOf(p),
      sku: p.sku ?? null,
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
  let allowedImageHost: string | undefined;
  try {
    allowedImageHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;
  } catch {}

  // Prefer existing homepage_banners table records when available (canonical legacy source), preserving order/schedule/active states.
  try {
    const nowIso = new Date().toISOString();
    const { data: rows, error } = await db
      .from("homepage_banners")
      .select("id,title,subtitle,description,image_url,mobile_image_url,cta_text,cta_link,button_text,button_url,display_order,is_active,start_date,end_date")
      .order("display_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });
    if (!error && Array.isArray(rows) && rows.length > 0) {
      type BannerRow = {
        id?: unknown; title?: unknown; subtitle?: unknown; description?: unknown;
        image_url?: unknown; mobile_image_url?: unknown; cta_text?: unknown; cta_link?: unknown;
        button_text?: unknown; button_url?: unknown; display_order?: unknown;
        is_active?: unknown; start_date?: unknown; end_date?: unknown;
      };
      const mapped = (rows as BannerRow[])
        .filter((r) => r && r.is_active !== false)
        .filter((r) => {
          const start = r.start_date ? String(r.start_date) : null;
          const end = r.end_date ? String(r.end_date) : null;
          if (start && start > nowIso) return false;
          if (end && end < nowIso) return false;
          return true;
        })
        .map((r) => ({
          id: r.id,
          title: r.title ?? '',
          subtitle: r.subtitle ?? null,
          description: r.description ?? null,
          image_url: r.image_url ?? null,
          mobile_image_url: r.mobile_image_url ?? null,
          cta_text: r.cta_text ?? r.button_text ?? null,
          cta_link: r.cta_link ?? r.button_url ?? null,
          active: r.is_active !== false,
          display_order: r.display_order ?? null,
        }));
      const normalized = normalizeHeroBanners(mapped, allowedImageHost);
      if (normalized.length > 0) return normalized;
    }
  } catch {}

  // Fallback: website_content.hero_banner (JSON/multi-slide) preserves existing content when table unavailable.
  const { data, error } = await db
    .from("website_content")
    .select("content_data")
    .eq("section_key", "hero_banner")
    .maybeSingle();
  if (error || !data) return [];
  return normalizeHeroBanners(data.content_data, allowedImageHost);
}, ["website-content-hero-banner-v6"], { revalidate: 60, tags: ["hero-banners"] });

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
        mobile_image_url: typeof row.mobile_image_url === "string" && row.mobile_image_url.trim() ? row.mobile_image_url.trim() : null,
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

export type SearchResult = {
  products: ProductCardData[];
  total: number;
  pages: number;
  error: string | null;
  query: string;
  unavailable: boolean;
};

export type ListOpts = {
  categoryIds?: string[]; q?: string; sort?: string; min?: number; max?: number;
  size?: string; avail?: "in" | "out"; collectionId?: string; flag?: "new" | "featured" | "trending"; limit?: number; page?: number; excludeId?: string;
};

export async function listProducts(o: ListOpts = {}): Promise<{ products: ProductCardData[]; total: number; pages: number }> {
  const limit = Math.max(1, Math.min(60, o.limit ?? 24));
  const page = Math.max(1, o.page ?? 1);
  const qText = normalizeSearchQuery(o.q);

  let base = db
    .from("products")
    .select(PRODUCT_COLS, { count: "exact" })
    .eq("status", "published")
    .is("deleted_at", null);

  if (o.categoryIds?.length) base = base.in("category_id", o.categoryIds);
  if (qText) base = base.ilike("name", `%${escapeIlikeTerm(qText)}%`);
  if (o.min != null) base = base.gte("regular_price", o.min);
  if (o.max != null) base = base.lte("regular_price", o.max);
  if (o.flag === "new") base = base.eq("is_new_arrival", true);
  if (o.flag === "featured") base = base.eq("is_featured", true);
  if (o.flag === "trending") base = base.eq("is_trending", true);
  if (o.excludeId) base = base.neq("id", o.excludeId);
  if (o.collectionId) base = base.eq("collection_id", o.collectionId);

  try {
    if (o.avail) {
      const s = await inStockSet();
      if (o.avail === "in") {
        if (!s.size) return { products: [], total: 0, pages: 1 };
        base = base.in("id", [...s]);
      } else if (s.size) base = base.not("id", "in", `(${[...s].join(",")})`);
    }
    if (o.size) {
      const { data: vs, error: vsErr } = await db.from("product_variants").select("product_id").eq("size", o.size).eq("status", "active");
      if (vsErr) throw vsErr;
      const ids = [...new Set((vs ?? []).map((v) => v.product_id))];
      if (!ids.length) return { products: [], total: 0, pages: 1 };
      base = base.in("id", ids);
    }
    // "Show First / Default Priority" is additive and separate from is_featured.
    // Pinned active/published products appear first within current listing context; others keep existing sort.
    base = base.order("show_first", { ascending: false, nullsFirst: false })
      .order("show_first_order", { ascending: false, nullsFirst: false });
    switch (o.sort) {
      case "price-asc": base = base.order("regular_price", { ascending: true }); break;
      case "price-desc": base = base.order("regular_price", { ascending: false }); break;
      case "name": base = base.order("name", { ascending: true }); break;
      default: base = base.order("created_at", { ascending: false });
    }
    const from = (page - 1) * limit;
    const { data, count, error } = await base.range(from, from + limit - 1);
    if (error) throw error;
    return { products: await toCards((data ?? []) as unknown as RawProduct[]), total: count ?? 0, pages: Math.max(1, Math.ceil((count ?? 0) / limit)) };
  } catch (e) {
    logSearchError("listProducts", e, { q: qText });
    return { products: [], total: 0, pages: 1 };
  }
}

export async function getProductsByIds(ids: string[]) {
  if (!ids.length) return [];
  try {
    const { data, error } = await db.from("products").select(PRODUCT_COLS).in("id", ids).eq("status", "published").is("deleted_at", null);
    if (error) throw error;
    const rows = (data ?? []) as unknown as RawProduct[];
    const showFirstRank = (r: RawProduct) => (r.show_first ? 1 : 0);
    rows.sort((a, b) => showFirstRank(b) - showFirstRank(a) || (Number(b.show_first_order) || 0) - (Number(a.show_first_order) || 0));
    const byId = new Map(rows.map((r) => [r.id, r]));
    return toCards(ids.map((id) => byId.get(id)).filter((r): r is RawProduct => !!r));
  } catch (e) {
    logSearchError("getProductsByIds", e);
    return [];
  }
}

export async function getFeaturedPiecesProducts(limit = 6): Promise<ProductCardData[]> {
  const safeLimit = Math.max(1, Math.min(50, Number(limit) || 6));
  try {
    // Homepage "Featured pieces" (actual DB data):
    // Priority 1 - products manually marked Default Featured by Admin (is_featured) always first,
    //             ordered by most recently added-to-featured (featured_added_at desc, fallback created_at desc).
    // Priority 2 - remaining eligible published/non-deleted products after featured, newest created first.
    // Server-side ordering before limit; no duplicates.
    const base = () => db.from("products")
      .select(PRODUCT_COLS)
      .eq("status", "published")
      .is("deleted_at", null);

    const [featuredRes, restRes] = await Promise.all([
      base()
        .eq("is_featured", true)
        .order("featured_added_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(safeLimit),
      base()
        .eq("is_featured", false)
        .order("created_at", { ascending: false })
        .limit(safeLimit),
    ]);

    if (featuredRes.error) throw featuredRes.error;
    if (restRes.error) throw restRes.error;

    const seen = new Set<string>();
    const merged: RawProduct[] = [];
    for (const r of [...((featuredRes.data ?? []) as unknown as RawProduct[]), ...((restRes.data ?? []) as unknown as RawProduct[])]) {
      if (!r?.id || seen.has(r.id)) continue;
      seen.add(r.id);
      merged.push(r);
      if (merged.length >= safeLimit) break;
    }

    const cards = await toCards(merged);
    return cards.slice(0, safeLimit);
  } catch (e) {
    logSearchError("getFeaturedPiecesProducts", e);
    return [];
  }
}

export async function getProductDetail(slug: string) {
  try {
    // Note: PRODUCT_COLS already includes brand_id/is_new_arrival/brands(name); avoid duplicate relation aliases.
    const { data: p, error } = await db
      .from("products")
      .select(`${PRODUCT_COLS},description,short_description,seo_title,seo_description,categories(id,name,slug)`)
      .eq("slug", slug).eq("status", "published").is("deleted_at", null).maybeSingle();
    if (error) throw error;
    if (!p) return null;
    const raw = p as unknown as RawProduct & {
      description: string | null; short_description: string | null;
      seo_title: string | null; seo_description: string | null;
      brands: { name: string } | { name: string }[] | null;
      categories: { id: string; name: string; slug: string } | null;
    };
    const [{ data: vars, error: vErr }, { data: inv, error: iErr }] = await Promise.all([
      db.from("product_variants").select("id,sku,size,color,regular_price,sale_price,image_url,attribute_summary").eq("product_id", raw.id).eq("status", "active").order("created_at"),
      db.from("inventory").select("variant_id,current_stock,reserved_stock").eq("product_id", raw.id),
    ]);
    if (vErr) throw vErr;
    if (iErr) throw iErr;
    const avail = (variantId: string | null) =>
      (inv ?? []).filter((r) => r.variant_id === variantId).reduce((s, r) => s + Math.max(0, (r.current_stock || 0) - (r.reserved_stock || 0)), 0);
    const variants: Variant[] = (vars ?? []).map((v) => ({
      id: v.id, sku: v.sku, size: v.size, color: v.color,
      regular_price: Number(v.regular_price), sale_price: v.sale_price == null ? null : Number(v.sale_price),
      price: effectivePrice(v.regular_price, v.sale_price),
      image_url: validProductImage(v.image_url), stock: avail(v.id),
    }));
    const baseStock = avail(null);
    const brandObj = raw.brands;
    const brand = Array.isArray(brandObj) ? (brandObj[0]?.name ?? null) : (brandObj?.name ?? null);
    return {
      id: raw.id, name: raw.name, slug: raw.slug, sku: raw.sku || "",
      description: raw.description, short_description: raw.short_description,
      seo_title: raw.seo_title, seo_description: raw.seo_description,
      regular_price: Number(raw.regular_price),
      sale_price: raw.sale_price == null ? null : Number(raw.sale_price),
      price: effectivePrice(raw.regular_price, raw.sale_price),
      images: pickImages(raw), brand: brandNameOf(raw) ?? brand, category: raw.categories,
      variants, stock: variants.length ? variants.reduce((s, v) => s + v.stock, 0) : baseStock,
      baseStock,
    };
  } catch (e) {
    logSearchError("getProductDetail", e, { slug });
    return null;
  }
}

export const getShippingZones = unstable_cache(async () => {
  try {
    const { data, error } = await db.from("shipping_zones").select("name,rate,estimated_days,free_shipping_threshold").eq("is_active", true).order("rate");
    if (error) throw error;
    const seen = new Set<string>();
    return (data ?? [])
      .filter((z) => (seen.has(z.name) ? false : (seen.add(z.name), true)))
      .map((z) => ({
        name: z.name as string, rate: Number(z.rate), estimated_days: z.estimated_days as string | null,
        free_shipping_threshold: z.free_shipping_threshold == null ? null : Number(z.free_shipping_threshold),
      }));
  } catch (e) {
    logSearchError("getShippingZones", e);
    return [];
  }
}, ["site-shipping-zones-v1"], { revalidate: SITE_CONTENT_REVALIDATE, tags: ["site-content"] });

/** Category + all descendants ids */
export function descendantIds(all: Category[], id: string): string[] {
  const out = [id];
  for (const c of all) if (c.parent_id === id) out.push(...descendantIds(all, c.id));
  return out;
}

export const getSizes = unstable_cache(async (): Promise<string[]> => {
  try {
    const { data, error } = await db.from("product_variants").select("size").eq("status", "active").not("size", "is", null);
    if (error) throw error;
    const uniq = [...new Set((data ?? []).map((r) => String(r.size)).filter(Boolean))];
    const order = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "3XL"];
    return uniq.sort((a, b) => {
      const na = parseFloat(a), nb = parseFloat(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      const ia = order.indexOf(a.toUpperCase()), ib = order.indexOf(b.toUpperCase());
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
    });
  } catch (e) {
    logSearchError("getSizes", e);
    return [];
  }
}, ["site-sizes-v1"], { revalidate: SITE_CONTENT_REVALIDATE, tags: ["site-content"] });

/** Most common meaningful words across published product names — used as "popular search terms". */
export const getPopularTerms = unstable_cache(async (): Promise<string[]> => {
  try {
    const { data, error } = await db.from("products").select("name").eq("status", "published").is("deleted_at", null).limit(300);
    if (error) throw error;
    const stop = new Set(["with", "and", "for", "the", "fit", "men", "mens", "women", "womens", "years", "pack", "set", "new", "from"]);
    const count = new Map<string, number>();
    for (const row of (data ?? []) as { name?: string | null }[]) {
      const name = String(row.name || "");
      for (const w of new Set(name.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/))) {
        if (w.length >= 4 && !stop.has(w)) count.set(w, (count.get(w) ?? 0) + 1);
      }
    }
    return [...count].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([w]) => w);
  } catch (e) {
    logSearchError("getPopularTerms", e);
    return [];
  }
}, ["site-popular-terms-v1"], { revalidate: SITE_CONTENT_REVALIDATE, tags: ["site-content"] });

/** ids of products that currently have sellable stock */
export const inStockSet = unstable_cache(async (): Promise<Set<string>> => {
  try {
    const { data, error } = await db.from("inventory").select("product_id,current_stock,reserved_stock").limit(5000);
    if (error) throw error;
    const sum = new Map<string, number>();
    for (const r of (data ?? []) as { product_id: string; current_stock: number; reserved_stock: number }[]) {
      sum.set(r.product_id, (sum.get(r.product_id) ?? 0) + Math.max(0, (r.current_stock || 0) - (r.reserved_stock || 0)));
    }
    return new Set([...sum].filter(([, n]) => n > 0).map(([id]) => id));
  } catch (e) {
    logSearchError("inStockSet", e);
    return new Set();
  }
}, ["site-instock-set-v1"], { revalidate: SITE_CONTENT_REVALIDATE, tags: ["site-content"] });

// --- Universal Search -------------------------------------------------------

function isUuidLike(s: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s); }

type SearchCtx = {
  brandIdsByToken: Map<string, Set<string>>;
  catIdsByToken: Map<string, Set<string>>;
  catNameById: Map<string, string>;
  variantProductIdsByToken: Map<string, Set<string>>;
  brandNameById: Map<string, string>;
};

function uniqStrings(values: (string | null | undefined)[]) {
  return [...new Set(values.filter((v): v is string => typeof v === "string" && v.length > 0))];
}

async function resolveSearchContext(tokens: string[]): Promise<SearchCtx> {
  const brandIdsByToken = new Map<string, Set<string>>();
  const catIdsByToken = new Map<string, Set<string>>();
  const variantProductIdsByToken = new Map<string, Set<string>>();
  const catNameById = new Map<string, string>();
  const brandNameById = new Map<string, string>();

  const add = (map: Map<string, Set<string>>, token: string, values: string[]) => {
    const set = map.get(token) ?? new Set<string>();
    for (const v of values) if (v) set.add(v);
    map.set(token, set);
  };

  await Promise.all(tokens.map(async (token) => {
    const esc = escapeIlikeTerm(token);
    if (!esc) return;
    try {
      const [brandsRes, catsRes, variantsRes] = await Promise.all([
        db.from("brands").select("id,name").eq("status", "active").ilike("name", `%${esc}%`).limit(100),
        db.from("categories").select("id,name").eq("status", "active").ilike("name", `%${esc}%`).limit(150),
        db.from("product_variants").select("product_id,sku").eq("status", "active").ilike("sku", `%${esc}%`).limit(400),
      ]);
      if (!brandsRes.error) {
        const rows = (brandsRes.data ?? []) as any[];
        add(brandIdsByToken, token, uniqStrings(rows.map((b) => b.id)));
        for (const b of rows) if (b?.id && b?.name) brandNameById.set(String(b.id), String(b.name));
      }
      if (!catsRes.error) {
        const rows = (catsRes.data ?? []) as any[];
        add(catIdsByToken, token, uniqStrings(rows.map((c) => c.id)));
        for (const c of rows) if (c?.id && c?.name) catNameById.set(String(c.id), String(c.name));
      }
      if (!variantsRes.error) add(variantProductIdsByToken, token, uniqStrings((variantsRes.data ?? []).map((v: any) => v.product_id)));
    } catch (e) {
      logSearchError("resolveSearchContext.token", e, { token });
    }
  }));

  return { brandIdsByToken, catIdsByToken, catNameById, variantProductIdsByToken, brandNameById };
}

function productHay(row: RawProduct, ctx: SearchCtx) {
  const brand = brandNameOf(row) || (row.brand_id ? ctx.brandNameById.get(row.brand_id) : "") || "";
  const catName = (row.category_id && ctx.catNameById.get(row.category_id)) || "";
  const vtxt = (row.product_variants ?? []).map((v) => String(v.sku || "")).join(" ");
  return [row.name || "", row.slug || "", row.sku || "", brand, catName, vtxt].join(" ").toLowerCase();
}

function tokenMatchesRow(row: RawProduct, token: string, hay: string, ctx: SearchCtx) {
  const t = token.toLowerCase();
  if (!t) return true;
  if (hay.includes(t)) return true; // partial, case-insensitive (name/sku/slug/brand/category/variant sku text)
  const bset = ctx.brandIdsByToken.get(token);
  if (bset && row.brand_id && bset.has(row.brand_id)) return true; // brand name match
  const cset = ctx.catIdsByToken.get(token);
  if (cset && row.category_id && cset.has(row.category_id)) return true; // category name match
  const vset = ctx.variantProductIdsByToken.get(token);
  if (vset && vset.has(row.id)) return true; // variant SKU match
  return false;
}

function scoreSearchHit(row: RawProduct, tokens: string[], ctx: SearchCtx) {
  const name = (row.name || "").toLowerCase();
  const sku = (row.sku || "").toLowerCase();
  const brand = (brandNameOf(row) || (row.brand_id ? ctx.brandNameById.get(row.brand_id) : "") || "").toLowerCase();
  const catName = ((row.category_id && ctx.catNameById.get(row.category_id)) || "").toLowerCase();
  const vtxt = (row.product_variants ?? []).map((v) => String(v.sku || "")).join(" ").toLowerCase();
  let score = 0;
  for (const tRaw of tokens) {
    const t = tRaw.toLowerCase();
    if (!t) continue;
    if (name === t) score += 140; else if (name.startsWith(t)) score += 90; else if (name.includes(t)) score += 55;
    if (sku === t) score += 150; else if (sku.startsWith(t)) score += 110; else if (sku.includes(t)) score += 80;
    if (brand === t) score += 80; else if (brand.startsWith(t)) score += 55; else if (brand.includes(t)) score += 35;
    if (catName === t) score += 80; else if (catName.startsWith(t)) score += 55; else if (catName.includes(t)) score += 35;
    if (vtxt === t) score += 70; else if (vtxt.startsWith(t)) score += 45; else if (vtxt.includes(t)) score += 25;
  }
  return score;
}

async function fetchSearchCandidates(query: string, tokens: string[], opts: { categoryIds?: string[]; collectionId?: string }) {
  const normalizedQuery = normalizeSearchQuery(query);
  if (!normalizedQuery || !tokens.length) return [] as RawProduct[];

  // Safe core select/filters only (avoid schema-dependent optional columns causing query failures)
  const selects = PRODUCT_COLS;
  const base = () => {
    let q = db.from("products").select(selects).eq("status", "published").is("deleted_at", null);
    if (opts.categoryIds?.length) q = q.in("category_id", opts.categoryIds);
    if (opts.collectionId) q = q.eq("collection_id", opts.collectionId);
    return q;
  };

  const ctx = await resolveSearchContext(tokens);
  const queries: Promise<any>[] = [];

  // DB-level partial, case-insensitive OR matching across core searchable fields (per token, supports 1-2+ chars)
  for (const token of tokens.slice(0, 6)) {
    const esc = escapeIlikeTerm(token);
    if (!esc) continue;
    queries.push(Promise.resolve(base().or([
      `name.ilike.%${esc}%`,
      `sku.ilike.%${esc}%`,
      `slug.ilike.%${esc}%`,
    ].join(",")).limit(500)));
  }

  // Full normalized query phrase for stronger exact/phrase relevance
  const escFull = escapeIlikeTerm(normalizedQuery);
  if (escFull) {
    queries.push(Promise.resolve(base().or(`name.ilike.%${escFull}%,sku.ilike.%${escFull}%,slug.ilike.%${escFull}%`).limit(400)));
  }

  // Related-field matches (OR across supported field types): brand name, category name, variant SKU
  const allBrandIds = uniqStrings([...ctx.brandIdsByToken.values()].flatMap((s) => [...s]));
  const allCatIds = uniqStrings([...ctx.catIdsByToken.values()].flatMap((s) => [...s]));
  const allVariantProductIds = uniqStrings([...ctx.variantProductIdsByToken.values()].flatMap((s) => [...s]));
  if (allBrandIds.length) queries.push(Promise.resolve(base().in("brand_id", allBrandIds.slice(0, 300)).limit(500)));
  if (allCatIds.length) queries.push(Promise.resolve(base().in("category_id", allCatIds.slice(0, 300)).limit(500)));
  if (allVariantProductIds.length) queries.push(Promise.resolve(base().in("id", allVariantProductIds.slice(0, 400)).limit(500)));
  if (isUuidLike(normalizedQuery)) queries.push(Promise.resolve(base().eq("id", normalizedQuery).limit(5)));

  const settled = await Promise.allSettled(queries);
  const rows: RawProduct[] = [];
  const seen = new Set<string>();
  let hadSuccess = false;
  let lastErr: unknown = null;
  for (const s of settled) {
    if (s.status !== "fulfilled") { lastErr = s.reason; continue; }
    const { data, error } = s.value || {};
    if (error) { lastErr = error; continue; }
    hadSuccess = true;
    for (const r of (data ?? []) as unknown as RawProduct[]) {
      if (!r?.id || seen.has(r.id)) continue;
      seen.add(r.id);
      rows.push(r);
    }
  }
  if (!hadSuccess && lastErr) throw lastErr;

  // Each token must match at least one supported field (OR across fields/types); supports partial & multi-word combos
  const matched = rows.filter((row) => {
    const hay = productHay(row, ctx);
    return tokens.every((t) => tokenMatchesRow(row, t, hay, ctx));
  });

  return matched
    .map((r) => ({ r, score: scoreSearchHit(r, tokens, ctx) }))
    .sort((a, b) => b.score - a.score || (a.r.name || "").localeCompare(b.r.name || ""))
    .map((x) => x.r);
}

export async function searchProductsUniversal(opts: {
  q: string; categoryIds?: string[]; avail?: "in" | "out"; min?: number; max?: number; size?: string;
  sort?: string; limit?: number; page?: number; collectionId?: string;
}): Promise<SearchResult> {
  const query = normalizeSearchQuery(opts.q);
  const limit = Math.max(1, Math.min(40, opts.limit ?? 20));
  const page = Math.max(1, opts.page ?? 1);
  if (!query) return { products: [], total: 0, pages: 1, error: null, query, unavailable: false };
  try {
    const tokens = tokenizeSearchQuery(query);
    const effectiveTokens = tokens.length ? tokens : [query.toLowerCase()];
    if (!effectiveTokens.length) return { products: [], total: 0, pages: 1, error: null, query, unavailable: false };

    let candidates = await fetchSearchCandidates(query, effectiveTokens, { categoryIds: opts.categoryIds, collectionId: opts.collectionId });

    if (opts.min != null) candidates = candidates.filter((r) => Number(r.regular_price) >= (opts.min as number));
    if (opts.max != null) candidates = candidates.filter((r) => Number(r.regular_price) <= (opts.max as number));
    if (opts.size) {
      const want = opts.size.toLowerCase();
      candidates = candidates.filter((r) => (r.product_variants ?? []).some((v) => v.status === "active" && (v.size || "").toLowerCase() === want));
    }
    if (opts.avail) {
      const stockRaw = await inStockSet();
      const stock = stockRaw instanceof Set ? stockRaw : new Set<string>(Array.isArray(stockRaw) ? (stockRaw as string[]) : []);
      candidates = candidates.filter((r) => opts.avail === "in" ? stock.has(r.id) : !stock.has(r.id));
    }

    const sortCandidates = (arr: RawProduct[]) => {
      const byExisting = (a: RawProduct, b: RawProduct) => {
        if (opts.sort === "price-asc") return Number(a.regular_price) - Number(b.regular_price);
        if (opts.sort === "price-desc") return Number(b.regular_price) - Number(a.regular_price);
        if (opts.sort === "name") return (a.name || "").localeCompare(b.name || "");
        return 0; // preserve relevance order from fetchSearchCandidates for default search
      };
      return arr.sort((a, b) => {
        const sf = (b.show_first ? 1 : 0) - (a.show_first ? 1 : 0);
        if (sf !== 0) return sf;
        const so = (Number(b.show_first_order) || 0) - (Number(a.show_first_order) || 0);
        if (so !== 0) return so;
        return byExisting(a, b);
      });
    };
    sortCandidates(candidates);

    const total = candidates.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const from = (page - 1) * limit;
    const pageRows = candidates.slice(from, from + limit);
    const products = await toCards(pageRows);
    return { products, total, pages, error: null, query, unavailable: false };
  } catch (e) {
    logSearchError("searchProductsUniversal", e, { query });
    return { products: [], total: 0, pages: 1, error: "Search is temporarily unavailable. Please try again.", query, unavailable: true };
  }
}

/** Facet counts for a search term (ignores other active filters). */
export async function searchFacets(term: string) {
  const q = normalizeSearchQuery(term);
  if (!q) return { total: 0, inStock: 0, outStock: 0, byCategory: new Map<string, number>(), maxPrice: 0 };
  try {
    const tokens = tokenizeSearchQuery(q);
    const effectiveTokens = tokens.length ? tokens : [q.toLowerCase()];
    const candidates = await fetchSearchCandidates(q, effectiveTokens, {});
    const stockRaw = await inStockSet();
    const stock = stockRaw instanceof Set ? stockRaw : new Set<string>(Array.isArray(stockRaw) ? (stockRaw as string[]) : []);
    const inStock = candidates.filter((r) => stock.has(r.id)).length;
    const byCategory = new Map<string, number>();
    for (const r of candidates) if (r.category_id) byCategory.set(r.category_id, (byCategory.get(r.category_id) ?? 0) + 1);
    return {
      total: candidates.length,
      inStock,
      outStock: Math.max(0, candidates.length - inStock),
      byCategory,
      maxPrice: Math.ceil(Math.max(0, ...candidates.map((r) => Number(r.regular_price) || 0)) / 100) * 100,
    };
  } catch (e) {
    logSearchError("searchFacets", e, { q });
    return { total: 0, inStock: 0, outStock: 0, byCategory: new Map<string, number>(), maxPrice: 0 };
  }
}

export type CollectionLite = { id: string; name: string; slug: string; description: string | null; image_url: string | null };

export async function searchCollections(term: string): Promise<CollectionLite[]> {
  const q = normalizeSearchQuery(term);
  if (!q) return [];
  try {
    const t = escapeIlikeTerm(q);
    const { data, error } = await db.from("collections").select("id,name,slug,description,image_url")
      .eq("status", "active").ilike("name", `%${t}%`).order("name").limit(60);
    if (error) throw error;
    return (data ?? []) as CollectionLite[];
  } catch (e) {
    logSearchError("searchCollections", e, { q });
    return [];
  }
}

export async function getCollection(slug: string): Promise<CollectionLite | null> {
  try {
    const { data, error } = await db.from("collections").select("id,name,slug,description,image_url").eq("slug", slug).eq("status", "active").maybeSingle();
    if (error) throw error;
    return (data as CollectionLite) ?? null;
  } catch (e) {
    logSearchError("getCollection", e, { slug });
    return null;
  }
}

