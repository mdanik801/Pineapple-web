import Link from "next/link";
import Image from "next/image";
import { Suspense, cloneElement, isValidElement } from "react";
import CategoryImage from "@/components/CategoryImage";
import HeroSlider from "@/components/HeroSlider";
import HomepageBottomCarousel from "@/components/HomepageBottomCarousel";
import EditorialShowcase from "@/components/EditorialShowcase";
import { getBanners, getBrands, getCategories, getFeaturedPiecesProducts, getProductsByIds } from "@/lib/data";
import { getPublishedHomepageCms, isSectionVisible, orderedSections } from "@/lib/homepage-cms";
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
  const [cms, banners, categories, brands, featuredByProduct] = await Promise.all([
    getPublishedHomepageCms(),
    getBanners(),
    getCategories(),
    getBrands(),
    getFeaturedPiecesProducts(8),
  ]);

  const topCategories = categories.filter((category) => !category.parent_id);

  const featuredCfg = (cms.featured_pieces || {}) as Record<string, unknown>;
  const HOME_FEATURED_MAX = 8;
  // Home must show up to 8 (4x2) when eligible; ignore lower CMS/default caps that would hide featured products.
  const displayLimit = HOME_FEATURED_MAX;
  const featuredIds = arr<string>(featuredCfg.product_ids).filter((x): x is string => typeof x === "string" && x.length > 0);
  // Primary source of truth: product-level "Show in Homepage Featured Pieces" (products.is_featured).
  // Server fetch returns: Priority 1 manually featured first, Priority 2 remaining eligible newest-created first (before limit).
  let orderedFeatured = featuredByProduct.slice(0, displayLimit);
  if (orderedFeatured.length === 0 && featuredIds.length > 0) {
    // Legacy CMS fallback if product-level feed returns nothing.
    const legacy = await getProductsByIds(featuredIds);
    orderedFeatured = legacy.slice(0, displayLimit);
  }
  // Deduplicate by id while preserving priority/order, then cap to 8.
  const seenFeatured = new Set<string>();
  orderedFeatured = orderedFeatured.filter((p) => {
    if (!p?.id || seenFeatured.has(p.id)) return false;
    seenFeatured.add(p.id);
    return true;
  }).slice(0, displayLimit);

  const categoriesCfg = (cms.categories || {}) as Record<string, unknown>;
  const companyCfg = (cms.company_description || {}) as Record<string, unknown>;
  const brandsCfg = (cms.our_brands || {}) as Record<string, unknown>;
  const promoCfg = (cms.promotional_banner || {}) as Record<string, unknown>;

  const sections = (() => {
    const seen = new Set<string>();
    return orderedSections(cms).filter((s) => {
      if (s.enabled === false) return false;
      const id = typeof s?.id === "string" ? s.id.trim() : "";
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  })();

  const renderSection = (id: string) => {
    switch (id) {
      case "announcement_bar":
      case "header":
        return null; // layout/header
      case "hero_banner":
        return banners.length > 0 && isSectionVisible(cms, "hero_banner")
          ? <HeroSlider key="hero" banners={banners} />
          : null;
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
        const desc = text(companyCfg.description);
        if (!visible || !desc) return null;
        const label = text(companyCfg.label);
        return (
          <section key="company_description" className="border-y border-black/10 bg-[#f7f7f5] px-4 py-16 text-center sm:py-24">
            {label && <p className="mb-3 text-[10px] font-medium uppercase tracking-[.24em] text-neutral-500">{label}</p>}
            <p className="mx-auto max-w-2xl font-serif text-xl leading-relaxed text-neutral-800 sm:text-2xl">{desc}</p>
          </section>
        );
      }
      // case "our_brands": {
      //   const visible = bool(brandsCfg.visible, true) && isSectionVisible(cms, "our_brands");
      //   if (!visible || !brands.some((brand) => brand.logo_url)) return null;
      //   return (
      //     <section key="our_brands" className="container-x py-14 sm:py-20">
      //       <div className="mb-8 text-center">
      //         <p className="text-[10px] font-medium uppercase tracking-[.22em] text-neutral-500">{text(brandsCfg.label, "The label portfolio")}</p>
      //         <h2 className="mt-2 font-serif text-2xl text-neutral-950 sm:text-3xl">{text(brandsCfg.heading, "Our brands")}</h2>
      //       </div>
      //       <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8 border-y border-black/10 py-8 sm:gap-x-16 sm:py-10">
      //         {brands.map((brand) =>
      //           brand.logo_url ? (
      //             <div key={brand.id} className="flex h-12 min-w-24 items-center justify-center sm:h-16 sm:min-w-32">
      //               <Image
      //                 src={brand.logo_url}
      //                 alt={brand.name}
      //                 width={160}
      //                 height={64}
      //                 unoptimized={brand.logo_url.toLowerCase().endsWith(".svg")}
      //                 style={{ width: "auto", height: "auto" }}
      //                 className="max-h-12 max-w-36 object-contain sm:max-h-16 sm:max-w-44"
      //               />
      //             </div>
      //           ) : null,
      //         )}
      //       </div>
      //     </section>
      //   );
      // }
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

  const renderedSectionIds = new Set<string>();
  return (
    <>
      {sections.map((s, i) => {
        const id = typeof s.id === "string" ? s.id.trim() : String(s.id || "");
        if (!id || renderedSectionIds.has(id)) return null;
        const node = renderSection(id);
        if (!node || !isValidElement(node)) return null;
        renderedSectionIds.add(id);
        return cloneElement(node, { key: `${id}-${i}` });
      })}
      <Suspense fallback={<section aria-label="Loading homepage carousel" className="aspect-[4/5] w-full animate-pulse bg-neutral-100 sm:aspect-[16/8] lg:aspect-[16/7]" />}>
        <HomepageBottomCarousel />
      </Suspense>
    </>
  );
}
