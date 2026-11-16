import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Truck } from "lucide-react";
import ProductView from "@/components/ProductView";
import Accordion from "@/components/Accordion";
import ShareButton from "@/components/ShareButton";
import ProductAnalytics from "@/components/ProductAnalytics";
import RelatedProducts from "./RelatedProducts";
import { getProductDetail, getPolicies, getShippingZones } from "@/lib/data";
import { money } from "@/lib/format";
import { categoryHref } from "@/lib/slug";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProductDetail((await params).slug);
  if (!p) return { title: "Product not found" };
  return {
    title: p.seo_title || p.name,
    description: p.seo_description || p.short_description || undefined,
    openGraph: p.images[0] ? { images: [p.images[0]] } : undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const p = await getProductDetail((await params).slug);
  if (!p) notFound();
  const [policies, zones] = await Promise.all([
    getPolicies(),
    getShippingZones(),
  ]);
  const free = zones.find((z) => z.free_shipping_threshold != null);

  return (
    <div className="content-full py-6 sm:py-8 md:py-12">
      <ProductAnalytics
        productId={p.id}
        productSlug={p.slug}
        categoryId={p.category?.id ?? null}
        categorySlug={p.category?.slug ?? null}
      />
      <nav aria-label="Breadcrumb" className="mb-6 sm:mb-8 flex flex-wrap items-center justify-start gap-x-1.5 gap-y-1 sm:gap-x-2 text-[11px] sm:text-xs text-muted min-w-0">
        <Link href="/" className="hover:text-brand shrink-0">Home</Link>
        <span className="shrink-0">›</span>
        <Link href="/shop" className="hover:text-brand shrink-0">Products</Link>
        <span className="shrink-0">›</span>
        {p.category && (
          <>
            <Link href={categoryHref(p.category.slug)} className="hover:text-brand min-w-0 break-words">{p.category.name}</Link>
            <span className="shrink-0">›</span>
          </>
        )}
        <span className="text-ink/80 min-w-0 break-words">{p.name}</span>
      </nav>

      <ProductView
        p={p}
        header={
          <>
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <h1 className="text-xl sm:text-2xl md:text-[28px] font-semibold leading-snug text-ink break-words">{p.name}</h1>
              <ShareButton title={p.name} />
            </div>
            <p className="mt-2.5 sm:mt-3 text-xs text-muted">SKU: <span className="ml-1 text-ink/80">{p.sku}</span></p>
            {p.category && <p className="mt-1 text-xs text-muted">Product Type: <Link href={categoryHref(p.category.slug)} className="ml-1 text-ink/80 hover:text-brand">{p.category.name}</Link></p>}
            {p.brand && <p className="mt-1 text-xs text-muted">Brand: <span className="ml-1 text-ink/80">{p.brand}</span></p>}
            <div className="mt-4 sm:mt-5" />
          </>
        }
        details={
          <div className="mt-6 sm:mt-8">
            {p.short_description && <p className="mb-5 sm:mb-6 text-xs sm:text-sm leading-relaxed text-ink/75">{p.short_description}</p>}
            {p.description && <Accordion title="Description"><p className="whitespace-pre-line text-xs sm:text-sm leading-relaxed">{p.description}</p></Accordion>}
            {policies.shipping_policy && <Accordion title="Shipping"><p className="whitespace-pre-line text-xs sm:text-sm leading-relaxed">{policies.shipping_policy}</p></Accordion>}
            {policies.return_policy && <Accordion title="Returns & Exchange"><p className="whitespace-pre-line text-xs sm:text-sm leading-relaxed">{policies.return_policy}</p></Accordion>}
            {free && (
              <p className="mt-5 flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm text-ink/80">
                <Truck size={20} className="text-gold shrink-0" />
                <span>Free shipping inside {free.name} on orders over {money(free.free_shipping_threshold)}</span>
              </p>
            )}
          </div>
        }
      />

      <Suspense fallback={
        <div className="mt-14 sm:mt-20">
          <div className="mb-6 sm:mb-7"><div className="skeleton h-8 w-56 rounded" /></div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="skeleton aspect-[5/6] w-full rounded-sm" />
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-4 w-1/3 rounded" />
              </div>
            ))}
          </div>
        </div>
      }>
        <RelatedProducts categoryId={p.category?.id ?? null} excludeId={p.id} />
      </Suspense>
    </div>
  );
}
