import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Truck } from "lucide-react";
import ProductView from "@/components/ProductView";
import ProductGrid from "@/components/ProductGrid";
import Accordion from "@/components/Accordion";
import ShareButton from "@/components/ShareButton";
import { getProductDetail, listProducts, getPolicies, getShippingZones } from "@/lib/data";
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
  const [related, policies, zones] = await Promise.all([
    p.category ? listProducts({ categoryIds: [p.category.id], excludeId: p.id, limit: 5 }).then((r) => r.products) : Promise.resolve([]),
    getPolicies(), getShippingZones(),
  ]);
  const free = zones.find((z) => z.free_shipping_threshold != null);

  return (
    <div className="container-x py-6 sm:py-8 md:py-12">
      <nav aria-label="Breadcrumb" className="mb-6 sm:mb-8 flex flex-wrap items-center justify-start gap-x-1.5 sm:gap-x-2 text-[11px] sm:text-xs text-muted">
        <Link href="/" className="hover:text-brand">Home</Link>
        <span>›</span>
        <Link href="/shop" className="hover:text-brand">Products</Link>
        <span>›</span>
        {p.category && (
          <>
            <Link href={categoryHref(p.category.slug)} className="hover:text-brand">{p.category.name}</Link>
            <span>›</span>
          </>
        )}
        <span className="text-ink/80 truncate max-w-[200px] sm:max-w-none">{p.name}</span>
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

      {related.length > 0 && (
        <div className="mt-14 sm:mt-20">
          <div className="mb-6 sm:mb-7">
            <h2 className="section-title text-xl sm:text-2xl md:text-3xl">You may also like</h2>
            <span className="mt-2 block h-0.5 w-14 bg-gold" />
          </div>
          <ProductGrid products={related} />
        </div>
      )}
    </div>
  );
}
