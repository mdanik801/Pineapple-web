const fs = require('fs');
const path = 'src/lib/data.ts';
let text = fs.readFileSync(path, 'utf8');
const start = 'export async function listProducts(o: ListOpts = {}) {';
const end = '/** Most common meaningful words across published product names — used as "popular search terms". */';
const i = text.indexOf(start);
const j = text.indexOf(end, i);
if (i === -1 || j === -1) { console.error('markers missing', i, j); process.exit(1); }

const replacement = `export async function listProducts(o: ListOpts = {}): Promise<{ products: ProductCardData[]; total: number; pages: number }> {
  const limit = Math.max(1, Math.min(60, o.limit ?? 24));
  const page = Math.max(1, o.page ?? 1);
  const qText = normalizeSearchQuery(o.q);

  let base = db
    .from("products")
    .select(PRODUCT_COLS, { count: "exact" })
    .eq("status", "published")
    .is("deleted_at", null);

  if (o.categoryIds?.length) base = base.in("category_id", o.categoryIds);
  if (qText) {
    base = base.ilike("name", \`%\${escapeIlikeTerm(qText)}%\`);
  }
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
      } else if (s.size) base = base.not("id", "in", \`(\${[...s].join(",")})\`);
    }
    if (o.size) {
      const { data: vs, error: vsErr } = await db.from("product_variants").select("product_id").eq("size", o.size).eq("status", "active");
      if (vsErr) throw vsErr;
      const ids = [...new Set((vs ?? []).map((v) => v.product_id))];
      if (!ids.length) return { products: [], total: 0, pages: 1 };
      base = base.in("id", ids);
    }

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
    const { data, error } = await db
      .from("products").select(PRODUCT_COLS).in("id", ids).eq("status", "published").is("deleted_at", null);
    if (error) throw error;
    const rows = (data ?? []) as unknown as RawProduct[];
    const byId = new Map(rows.map((r) => [r.id, r]));
    const ordered = ids.map((id) => byId.get(id)).filter((r): r is RawProduct => !!r);
    return toCards(ordered);
  } catch (e) {
    logSearchError("getProductsByIds", e);
    return [];
  }
}

export async function getFeaturedPiecesProducts(limit = 6): Promise<ProductCardData[]> {
  const safeLimit = Math.max(1, Math.min(50, Number(limit) || 6));
  try {
    const { data, error } = await db
      .from("products")
      .select(PRODUCT_COLS)
      .eq("status", "published")
      .is("deleted_at", null)
      .eq("is_featured", true)
      .order("display_order", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    const cards = await toCards((data ?? []) as unknown as RawProduct[]);
    return cards.filter((p) => p.in_stock || p.price >= 0).slice(0, safeLimit);
  } catch (e) {
    logSearchError("getFeaturedPiecesProducts", e);
    return [];
  }
}

export async function getProductDetail(slug: string) {
  try {
    const { data: p, error } = await db
      .from("products")
      .select(\`\${PRODUCT_COLS},description,short_description,seo_title,seo_description,brand_id,is_new_arrival,brands(name),categories(id,name,slug)\`)
      .eq("slug", slug).eq("status", "published").is("deleted_at", null).maybeSingle();
    if (error) throw error;
    if (!p) return null;
    const raw = p as unknown as RawProduct & {
      description: string | null; short_description: string | null;
      seo_title: string | null; seo_description: string | null;
      brands: { name: string } | null; categories: { id: string; name: string; slug: string } | null;
    };
    const [{ data: vars, error: vErr }, { data: inv, error: iErr }] = await Promise.all([
      db.from("product_variants").select("id,sku,size,color,regular_price,sale_price,image_url").eq("product_id", raw.id).eq("status", "active").order("created_at"),
      db.from("inventory").select("variant_id,current_stock,reserved_stock").eq("product_id", raw.id),
    ]);
    if (vErr) throw vErr;
    if (iErr) throw iErr;
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
      id: raw.id, name: raw.name, slug: raw.slug, sku: raw.sku || "",
      description: raw.description, short_description: raw.short_description,
      seo_title: raw.seo_title, seo_description: raw.seo_description,
      regular_price: Number(raw.regular_price),
      sale_price: raw.sale_price == null ? null : Number(raw.sale_price),
      price: effectivePrice(raw.regular_price, raw.sale_price),
      images: pickImages(raw), brand: brandNameOf(raw) ?? raw.brands?.name ?? null, category: raw.categories,
      variants, stock: variants.length ? variants.reduce((s, v) => s + v.stock, 0) : baseStock,
      baseStock,
    };
  } catch (e) {
    logSearchError("getProductDetail", e, { slug });
    return null;
  }
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
    const ia = order.indexOf(a.toUpperCase()), ib = order.indexOf(b.
