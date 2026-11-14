import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "./supabase";

type CmsRecord = Record<string, unknown>;

export type HomepageCmsConfig = {
  version: number;
  sections: { id: string; enabled: boolean; order: number }[];
  announcement_bar: CmsRecord;
  header: CmsRecord;
  hero_banner: CmsRecord;
  brand_intro: CmsRecord;
  categories: CmsRecord;
  featured_pieces: CmsRecord;
  company_description: CmsRecord;
  our_brands: CmsRecord;
  promotional_banner: CmsRecord;
  meta?: CmsRecord;
};

const defaultConfig: HomepageCmsConfig = {
  version: 1,
  sections: [
    { id: "announcement_bar", enabled: true, order: 1 },
    { id: "header", enabled: true, order: 2 },
    { id: "hero_banner", enabled: true, order: 3 },
    { id: "brand_intro", enabled: true, order: 4 },
    { id: "categories", enabled: true, order: 5 },
    { id: "featured_pieces", enabled: true, order: 6 },
    { id: "company_description", enabled: true, order: 7 },
    { id: "our_brands", enabled: true, order: 8 },
    { id: "promotional_banner", enabled: true, order: 9 },
  ],
  announcement_bar: { text: "", link: "/shop", bg_color: "#0A3C2A", text_color: "#FFFFFF", visible: true, start_date: null, end_date: null },
  header: { logo_url: "", contact_info: "", nav_items: [], show_search: true, show_account: true, show_wishlist: true, show_cart: true },
  hero_banner: { use_banner_table: true, autoplay: true, interval_ms: 6500 },
  brand_intro: { label: "DELIVERY DIRECT FROM US", heading: "", description: "", text_align: "center", visible: true },
  categories: { label: "BROWSE OUR CATEGORIES", heading: "Categories", all_products_text: "ALL PRODUCTS", all_products_link: "/shop", items: [], visible: true },
  featured_pieces: { label: "SELECTED FROM THE COLLECTION", heading: "Featured pieces", description: "", shop_all_text: "SHOP ALL", shop_all_link: "/shop", product_ids: [], main_product_id: null, display_limit: 8, visible: true },
  company_description: { label: "", description: "", text_align: "center", visible: true, spacing: "normal" },
  our_brands: { label: "THE LABEL PORTFOLIO", heading: "Our brands", items: [], visible: true },
  promotional_banner: { image_desktop: "", image_mobile: "", heading: "", description: "", button_text: "", button_url: "", image_position: "center", overlay_enabled: false, overlay_color: "#000000", overlay_opacity: 0.3, visible: false },
};

function isRecord(value: unknown): value is CmsRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function mergeDeep(base: unknown, incoming: unknown): unknown {
  if (!isRecord(incoming)) return base;
  if (Array.isArray(base)) return Array.isArray(incoming) ? [...incoming] : base;
  if (!isRecord(base)) return { ...incoming };
  const out: CmsRecord = { ...base };
  for (const [k, v] of Object.entries(incoming)) {
    if (isRecord(v) && isRecord(base[k])) {
      out[k] = mergeDeep(base[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export const getPublishedHomepageCms = unstable_cache(async (): Promise<HomepageCmsConfig> => {
  try {
    const { data, error } = await db
      .from("website_content")
      .select("content_data")
      .eq("section_key", "homepage_cms_published")
      .maybeSingle();
    if (error || !data?.content_data) return defaultConfig;
    return mergeDeep(defaultConfig, data.content_data) as HomepageCmsConfig;
  } catch {
    return defaultConfig;
  }
}, ["homepage-cms-published-v1"], { revalidate: 60, tags: ["homepage-cms"] });

export type WebsiteContentSection = Record<string, unknown>;

export const getWebsiteContentSection = unstable_cache(async (sectionKey: string): Promise<WebsiteContentSection | null> => {
  try {
    const { data, error } = await db
      .from("website_content")
      .select("content_data")
      .eq("section_key", sectionKey)
      .maybeSingle();
    if (error || !data || !isRecord(data.content_data)) return null;
    return data.content_data as WebsiteContentSection;
  } catch {
    return null;
  }
}, ["website-content-section-v1"], { revalidate: 60, tags: ["homepage-cms", "site-content"] });

export async function getHomepageSectionsConfig(): Promise<WebsiteContentSection | null> {
  return getWebsiteContentSection("homepage_sections");
}

export async function getHeroSettingsConfig(): Promise<WebsiteContentSection | null> {
  return getWebsiteContentSection("hero_settings");
}

export function isSectionVisible(cfg: HomepageCmsConfig, id: string): boolean {
  const sec = (cfg.sections || []).find((s) => s.id === id);
  return sec ? sec.enabled !== false : true;
}

export function orderedSections(cfg: HomepageCmsConfig) {
  return [...(cfg.sections || defaultConfig.sections)].sort((a, b) => (a.order || 0) - (b.order || 0));
}
