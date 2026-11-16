import Link from "next/link";
import { Suspense, cloneElement, isValidElement } from "react";
import CategoryImage from "@/components/CategoryImage";
import HeroSlider from "@/components/HeroSlider";
import HomepageBottomCarousel from "@/components/HomepageBottomCarousel";
import BottomCategorySection from "@/components/BottomCategorySection";
import EditorialShowcase from "@/components/EditorialShowcase";
import CategoriesCarousel from "@/components/CategoriesCarousel";
import { getBanners, getCategories, getFeaturedPiecesProducts, getProductsByIds, getHomepageBottomCategories } from "@/lib/data";
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
  const [cms, banners, categories, featuredByProduct] = await Promise.all([
    getPublishedHomepageCms(),
    getBanners(),
    getCategories(),
    getFeaturedPiecesProducts(16),
  ]);

  const topCategories = categories.filter((category) => !category.parent_id);

  const featuredCfg = (cms.featured_pieces || {}) as Record<string, unknown>;
  const HOME_FEATURED_MAX = 16;
  // Home Featured pieces: show up to 16 items (4 rows on lg 4-col grid) when eligible, preserving existing selection/sort logic.
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
  // Deduplicate by id while preserving priority/order, then cap to display limit.
  const seenFeatured = new Set<string>();
  orderedFeatured = orderedFeatured.filter((p) => {
    if (!p?.id || seenFeatured.has(p.id)) return false;
    seenFeatured.add(p.id);
    return true;
  }).slice(0, displayLimit);

  const categoriesCfg = (cms.categories || {}) as Record<string, unknown>;
  const companyCfg = (cms.company_description || {}) as Record<string, unknown>;
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
          <section key="categories" className="w-full min-w-0 pt-6 sm:pt-8 lg:pt-10 pb-6 sm:pb-8 lg:pb-10">
            <div className="content-full">
              <div className="relative mb-8 border-b border-black/10 pb-4 sm:mb-10">
                <div className="text-center px-1">
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-[.22em] text-neutral-500">{text(categoriesCfg.label, "Browse the collection")}</p>
                  <h2 className="font-serif text-3xl text-neutral-950 sm:text-4xl">{text(categoriesCfg.heading, "Categories")}</h2>
                </div>
                <Link href={text(categoriesCfg.all_products_link, "/shop")} className="mt-3 inline-block w-full text-center text-xs uppercase tracking-[.12em] text-neutral-600 underline decoration-black/20 underline-offset-4 hover:text-black sm:absolute sm:right-0 sm:bottom-4 sm:mt-0 sm:w-auto sm:text-right">
                  {text(categoriesCfg.all_products_text, "All products")}
                </Link>
              </div>
              <CategoriesCarousel categories={topCategories} />
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
          <section key="company_description" className="w-full border-y border-black/10 bg-[#f7f7f5] py-16 text-center sm:py-24">
            <div className="content-full">
              {label && <p className="mb-3 text-[10px] font-medium uppercase tracking-[.24em] text-neutral-500">{label}</p>}
              <p className="mx-auto max-w-2xl font-serif text-xl leading-relaxed text-neutral-800 sm:text-2xl">{desc}</p>
            </div>
          </section>
        );
      }
      // case "our_brands": {
      //   const visible = bool(brandsCfg.visible, true) && isSectionVisible(cms, "our_brands");
      //   if (!visible || !brands.some((brand) => brand.logo_url)) return null;
      //   return (
      //     <section key="our_brands" className="content-full py-14 sm:py-20">
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
            <img src={img} alt={heading || "Promotional banner"} loading="lazy" decoding="async" className="h-auto w-full object-cover" />
            {(heading || desc || btnText) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-white">
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
  const bottomCategories = await getHomepageBottomCategories();
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
      <BottomCategorySection categories={bottomCategories} />
      <Suspense fallback={<section aria-label="Loading homepage carousel" className="aspect-[4/5] w-full animate-pulse bg-neutral-100 sm:aspect-[16/8] lg:aspect-[16/7]" />}>
        <HomepageBottomCarousel />
      </Suspense>
    </>
  );
}
