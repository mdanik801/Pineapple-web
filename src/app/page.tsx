import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import CategoryImage from "@/components/CategoryImage";
import HeroSlider from "@/components/HeroSlider";
import HomepageBottomCarousel from "@/components/HomepageBottomCarousel";
import EditorialShowcase from "@/components/EditorialShowcase";
import { getBanners, getBrands, getCategories, getProductsByIds, getSettings, getShippingZones, listProducts } from "@/lib/data";
import { getPublishedHomepageCms, isSectionVisible, orderedSections } from "@/lib/homepage-cms";
import { money } from "@/lib/format";
import { categoryHref } from "@/lib/slug";

export const revalidate = 60;

function text(v: unknown, fallback = "") {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}
function bool(v: unknown, fallback: boolean) {
  return typeof v === "boolean" ? v : fallback;
}
function arr<T = unknown>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export default async function Home() {
  const [cms, banners, categories, settings, brands, zones, featuredFallback] = await Promise.all([
    getPublishedHomepageCms(),
    getBanners(),
    getCategories(),
    getSettings(),
    getBrands(),
    getShippingZones(),
    listProducts({ flag: "featured", limit: 6 }),
  ]);

  const topCategories = categories.filter((category) => !category.parent_id);
  const brandName = settings?.brand_name?.trim() || settings?.company_name?.trim() || "";
  const brandDescription = settings?.description?.trim() || "";
  const campaign = banners[0];
  const deliveryRate = zones.length ? Math.min(...zones.map((zone) => zone.rate)) : null;

  const featuredCfg = (cms.featured_pieces || {}) as Record<string, unknown>;
  const featuredIds = arr<string>(featuredCfg.product_ids).filter((x) => typeof x === "string");
  const featuredFromCms = featuredIds.length ? await getProductsByIds(featuredIds) : [];
  const featuredProducts = (featuredFromCms.length ? featuredFromCms : featuredFallback.products).slice(
    0,
    Math.max(1, Number(featuredCfg.display_limit || 6) || 6),
  );
  const mainId = typeof featuredCfg.main_product_id === "string" ? featuredCfg.main_product_id : null;
  const orderedFeatured = mainId
    ? [...featuredProducts.filter((p) => p.id === mainId), ...featuredProducts.filter((p) => p.id !== mainId)]
    : featuredProducts;

  const categoriesCfg = (cms.categories || {}) as Record<string, unknown>;
  const brandIntroCfg = (cms.brand_intro || {}) as Record<string, unknown>;
  const companyCfg = (cms.company_description || {}) as Record<string, unknown>;
  const brandsCfg = (cms.our_brands || {}) as Record<string, unknown>;
  const promoCfg = (cms.promotional_banner || {}) as Record<string, unknown>;

  const sections = orderedSections(cms).filter((s) => s.enabled !== false);

  const renderSection = (id: string) => {
    switch (id) {
      case "announcement_bar":
      case "header":
        return null; // layout/header
      case "hero_banner":
        return banners.length > 0 && isSectionVisible(cms, "hero_banner")
          ? <HeroSlider key="hero" banners={banners} />
          : null;
      case "brand_intro": {
        const visible = bool(brandIntroCfg.visible, true) && isSectionVisible(cms, "brand_intro");
        if (!visible) return null;
        const hasExplicit = !!text(brandIntroCfg.label) || !!text(brandIntroCfg.heading) || !!text(brandIntroCfg.description);
        const label = text(brandIntroCfg.label, deliveryRate !== null ? `Delivery rates from ${money(deliveryRate)}` : "");
        const heading = text(brandIntroCfg.heading, brandName || campaign?.title || "");
        const desc = text(brandIntroCfg.description, campaign?.subtitle || "");
        if (!hasExplicit && !campaign && deliveryRate === null && !brandName) return null;
        return (
          <section key="brand_intro" className="container-x border-b border-black/10 py-12 text-center sm:py-16 lg:py-20">
            {label && <p className="mb-5 text-[10px] font-medium uppercase tracking-[.22em] text-neutral-500">{label}</p>}
            {brandName && !text(brandIntroCfg.heading) && heading && (
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[.24em] text-neutral-500">{brandName}</p>
            )}
            {heading && <h1 className="mx-auto max-w-3xl font-serif text-3xl leading-tight text-neutral-950 sm:text-4xl lg:text-5xl">{heading}</h1>}
            {desc && <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-neutral-600 sm:text-base">{desc}</p>}
          </section>
        );
      }
      case "categories": {
        const visible = bool(categoriesCfg.visible, true) && isSectionVisible(cms, "categories");
        if (!visible || topCategories.length === 0) return null;
        return (
          <section key="categories" className="mx-auto w-full max-w-[94vw] 2xl:max-w-[2400px] px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 py-14 sm:py-20 lg:py-24">
            <div className="mb-8 flex items-end justify-between border-b border-black/10 pb-4 sm:mb-10">
              <div>
                <p className="mb-2 text-[10px] font-medium uppercase tracking-[.22em] text-neutral-500">{text(categoriesCfg.label, "Browse the collection")}</p>
                <h2 className="font-serif text-3xl text-neutral-950 sm:text-4xl">{text(categoriesCfg.heading, "Categories")}</h2>
              </div>
              <Link href={text(categoriesCfg.all_products_link, "/shop")} className="text-xs uppercase tracking-[.12em] text-neutral-600 underline decoration-black/20 underline-offset-4 hover:text-black">
                {text(categoriesCfg.all_products_text, "All products")}
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6 xl:gap-x-7 2xl:gap-x-8 lg:gap-y-10">
              {topCategories.map((category) => (
                <Link key={category.id} href={categoryHref(category.slug)} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
                    <CategoryImage key={`${category.id}:${category.image_url ?? ""}`} src={category.image_url} alt={category.name} sizes="(max-width: 640px) 48vw, (max-width: 1024px) 32vw, 25vw" />
                  </div>
                  <div className="flex items-center justify-between border-b border-black/10 py-3">
                    <h3 className="text-xs font-medium uppercase tracking-[.12em] text-neutral-900 sm:text-sm">{category.name}</h3>
                    <span aria-hidden="true" className="text-sm text-neutral-500 transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      }
      case "featured_pieces": {
        const visible = bool(featuredCfg.visible, true) && isSectionVisible(cms, "featured_pieces");
        if (!visible || orderedFeatured.length === 0) return null;
        return (
          <EditorialShowcase
            key="featured_pieces"
            products={orderedFeatured}
            label={text(featuredCfg.label, "Selected from the collection")}
            heading={text(featuredCfg.heading, "Featured pieces")}
            shopAllText={text(featuredCfg.shop_all_text, "Shop all")}
            shopAllHref={text(featuredCfg.shop_all_link, "/shop")}
          />
        );
      }
      case "company_description": {
        const visible = bool(companyCfg.visible, true) && isSectionVisible(cms, "company_description");
        const desc = text(companyCfg.description, brandDescription);
        if (!visible || !desc) return null;
        const label = text(companyCfg.label, brandName);
        return (
          <section key="company_description" className="border-y border-black/10 bg-[#f7f7f5] px-4 py-16 text-center sm:py-24">
            {label && <p className="mb-3 text-[10px] font-medium uppercase tracking-[.24em] text-neutral-500">{label}</p>}
            <p className="mx-auto max-w-2xl font-serif text-xl leading-relaxed text-neutral-800 sm:text-2xl">{desc}</p>
          </section>
        );
      }
      case "our_brands": {
        const visible = bool(brandsCfg.visible, true) && isSectionVisible(cms, "our_brands");
        if (!visible || !brands.some((brand) => brand.logo_url)) return null;
        return (
          <section key="our_brands" className="container-x py-14 sm:py-20">
            <div className="mb-8 text-center">
              <p className="text-[10px] font-medium uppercase tracking-[.22em] text-neutral-500">{text(brandsCfg.label, "The label portfolio")}</p>
              <h2 className="mt-2 font-serif text-2xl text-neutral-950 sm:text-3xl">{text(brandsCfg.heading, "Our brands")}</h2>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8 border-y border-black/10 py-8 sm:gap-x-16 sm:py-10">
              {brands.map((brand) =>
                brand.logo_url ? (
                  <div key={brand.id} className="flex h-12 min-w-24 items-center justify-center sm:h-16 sm:min-w-32">
                    <Image
                      src={brand.logo_url}
                      alt={brand.name}
                      width={160}
                      height={64}
                      unoptimized={brand.logo_url.toLowerCase().endsWith(".svg")}
                      style={{ width: "auto", height: "auto" }}
                      className="max-h-12 max-w-36 object-contain sm:max-h-16 sm:max-w-44"
                    />
                  </div>
                ) : null,
              )}
            </div>
          </section>
        );
      }
      case "promotional_banner": {
        const visible = bool(promoCfg.visible, false) && isSectionVisible(cms, "promotional_banner");
        const img = text(promoCfg.image_desktop) || text(promoCfg.image_mobile);
        if (!visible || !img) return null;
        const heading = text(promoCfg.heading);
        const desc = text(promoCfg.description);
        const btnText = text(promoCfg.button_text);
        const btnUrl = text(promoCfg.button_url);
        return (
          <section key="promotional_banner" className="relative w-full overflow-hidden bg-neutral-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt={heading || "Promotional banner"} className="h-auto w-full object-cover" />
            {(heading || desc || btnText) && (
              <div className="container-x absolute inset-0 flex flex-col items-center justify-center text-center text-white">
                {heading && <h2 className="font-serif text-3xl sm:text-4xl">{heading}</h2>}
                {desc && <p className="mt-3 max-w-xl text-sm sm:text-base">{desc}</p>}
                {btnText && btnUrl && <Link href={btnUrl} className="btn btn-gold mt-5">{btnText}</Link>}
              </div>
            )}
          </section>
        );
      }
      default:
        return null;
    }
  };

  return (
    <>
      {sections.map((s) => renderSection(s.id))}
      <Suspense fallback={<section aria-label="Loading homepage carousel" className="aspect-[4/5] w-full animate-pulse bg-neutral-100 sm:aspect-[16/8] lg:aspect-[16/7]" />}>
        <HomepageBottomCarousel />
      </Suspense>
    </>
  );
}
