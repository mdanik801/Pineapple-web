import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import CategoryImage from "@/components/CategoryImage";
import HeroSlider from "@/components/HeroSlider";
import HomepageBottomCarousel from "@/components/HomepageBottomCarousel";
import EditorialShowcase from "@/components/EditorialShowcase";
import { getBanners, getBrands, getCategories, getSettings, getShippingZones, listProducts } from "@/lib/data";
import { money } from "@/lib/format";
import { categoryHref } from "@/lib/slug";

export const revalidate = 60;

export default async function Home() {
  const [banners, categories, settings, brands, zones, featured] = await Promise.all([
    getBanners(),
    getCategories(),
    getSettings(),
    getBrands(),
    getShippingZones(),
    listProducts({ flag: "featured", limit: 6 }),
  ]);
  const topCategories = categories.filter((category) => !category.parent_id);
  const featuredProducts = featured.products;
  const brandName = settings?.brand_name?.trim() || settings?.company_name?.trim() || "";
  const brandDescription = settings?.description?.trim() || "";
  const campaign = banners[0];
  const deliveryRate = zones.length ? Math.min(...zones.map((zone) => zone.rate)) : null;

  return (
    <>
      {banners.length > 0 && <HeroSlider banners={banners} />}

      {(campaign || deliveryRate !== null) && (
        <section className="container-x border-b border-black/10 py-12 text-center sm:py-16 lg:py-20">
          {deliveryRate !== null && <p className="mb-5 text-[10px] font-medium uppercase tracking-[.22em] text-neutral-500">Delivery rates from {money(deliveryRate)}</p>}
          {brandName && <p className="mb-3 text-[10px] font-medium uppercase tracking-[.24em] text-neutral-500">{brandName}</p>}
          {campaign?.title && <h1 className="mx-auto max-w-3xl font-serif text-3xl leading-tight text-neutral-950 sm:text-4xl lg:text-5xl">{campaign.title}</h1>}
          {campaign?.subtitle && <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-neutral-600 sm:text-base">{campaign.subtitle}</p>}
        </section>
      )}

      {topCategories.length > 0 && (
        <section className="mx-auto w-full max-w-[94vw] 2xl:max-w-[2400px] px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 py-14 sm:py-20 lg:py-24">
          <div className="mb-8 flex items-end justify-between border-b border-black/10 pb-4 sm:mb-10">
            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[.22em] text-neutral-500">Browse the collection</p>
              <h2 className="font-serif text-3xl text-neutral-950 sm:text-4xl">Categories</h2>
            </div>
            <Link href="/shop" className="text-xs uppercase tracking-[.12em] text-neutral-600 underline decoration-black/20 underline-offset-4 hover:text-black">All products</Link>
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
      )}

      {featuredProducts.length > 0 && <EditorialShowcase products={featuredProducts} />}

      {brandDescription && (
        <section className="border-y border-black/10 bg-[#f7f7f5] px-4 py-16 text-center sm:py-24">
          {brandName && <p className="mb-3 text-[10px] font-medium uppercase tracking-[.24em] text-neutral-500">{brandName}</p>}
          <p className="mx-auto max-w-2xl font-serif text-xl leading-relaxed text-neutral-800 sm:text-2xl">{brandDescription}</p>
        </section>
      )}

      {brands.some((brand) => brand.logo_url) && (
        <section className="container-x py-14 sm:py-20">
          <div className="mb-8 text-center">
            <p className="text-[10px] font-medium uppercase tracking-[.22em] text-neutral-500">The label portfolio</p>
            <h2 className="mt-2 font-serif text-2xl text-neutral-950 sm:text-3xl">Our brands</h2>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8 border-y border-black/10 py-8 sm:gap-x-16 sm:py-10">
            {brands.map((brand) => brand.logo_url ? (
              <div key={brand.id} className="flex h-12 min-w-24 items-center justify-center sm:h-16 sm:min-w-32">
                <Image src={brand.logo_url} alt={brand.name} width={160} height={64} unoptimized={brand.logo_url.toLowerCase().endsWith(".svg")} style={{ width: "auto", height: "auto" }} className="max-h-12 max-w-36 object-contain sm:max-h-16 sm:max-w-44" />
              </div>
            ) : null)}
          </div>
        </section>
      )}

      <Suspense fallback={<section aria-label="Loading homepage carousel" className="aspect-[4/5] w-full animate-pulse bg-neutral-100 sm:aspect-[16/8] lg:aspect-[16/7]" />}>
        <HomepageBottomCarousel />
      </Suspense>
    </>
  );
}
