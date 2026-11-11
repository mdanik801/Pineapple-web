export type HeroBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  mobile_image_url: string | null;
  cta_text: string | null;
  cta_link: string | null;
};

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function imageSource(value: unknown, _allowedHost?: string): string | null {
  const source = text(value);
  if (!source) return null;
  if (source.startsWith("/") && !source.startsWith("//")) return source;

  try {
    const url = new URL(source);
    if (url.protocol === "https:" || url.protocol === "http:") {
      return source;
    }
  } catch {}

  return null;
}

function safeLink(value: unknown): string | null {
  const link = text(value);
  if (!link) return null;
  if (link.startsWith("/") && !link.startsWith("//")) return link;

  try {
    const url = new URL(link);
    return url.protocol === "https:" || url.protocol === "http:" ? link : null;
  } catch {
    return /^[A-Za-z0-9][A-Za-z0-9._~/-]*(?:[?#][^\s]*)?$/.test(link) ? `/${link}` : null;
  }
}

function isDeleted(banner: JsonObject): boolean {
  const deletedAt = text(banner.deleted_at);
  const status = text(banner.status)?.toLowerCase();
  return banner.deleted === true || banner.is_deleted === true || !!deletedAt || status === "deleted";
}

export function normalizeHeroBanners(contentData: unknown, allowedImageHost?: string): HeroBanner[] {
  const root = isObject(contentData) ? contentData : null;
  const wrappedBanners = root && Array.isArray(root.banners) ? root.banners : null;
  const legacyBanner = root && !wrappedBanners ? root : null;
  const records = Array.isArray(contentData)
    ? contentData
    : wrappedBanners ?? (legacyBanner ? [legacyBanner] : []);

  return records.flatMap((value, index) => {
    if (!isObject(value) || isDeleted(value)) return [];

    const isLegacy = value === legacyBanner;
    const active = isLegacy && value.active === undefined ? value.is_active !== false : value.active === true;
    const status = text(value.status)?.toLowerCase();
    if (!active || status === "inactive") return [];

    const image = imageSource(value.banner_url ?? value.image_url, allowedImageHost);
    if (!image) return [];

    const headline = text(value.headline) ?? text(value.title) ?? "";
    const title = /[\p{L}\p{N}]/u.test(headline) ? headline : "";
    return [{
      id: text(value.id) ?? `hero-banner-${index}`,
      title,
      subtitle: text(value.subheadline) ?? text(value.subtitle),
      image_url: image,
      mobile_image_url: imageSource(value.mobile_image_url, allowedImageHost),
      cta_text: text(value.cta_text),
      cta_link: safeLink(value.cta_link),
    }];
  });
}