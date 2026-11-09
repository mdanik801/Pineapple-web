import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Truck } from "lucide-react";
import ProductView from "@/components/ProductView";
import Section from "@/components/Section";
import ProductGrid from "@/components/ProductGrid";
import Accordion from "@/components/Accordion";
import ShareButton from "@/components/ShareButton";
import { getProductDetail, listProducts, getPolicies, getShippingZones } from "@/lib/data";
import { money } from "@/lib/format";

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
    <div className="container-x py-8 md:py-12">
      <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap justify-center gap-x-2 text-xs text-muted">
        <Link href="/" className="hover:text-brand">Home</Link><span>›</span>
        <Link href="/shop" className="hover:text-brand">Products</Link><span>›</span>
        {p.category && <><Link href={`/category/${p.category.slug}`} className="hover:text-brand">{p.category.name}</Link><span>›</span></>}
        <span className="text-ink/70">{p.name}</span>
      </nav>
      <ProductView
        p={p}
        header={
          <>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-semibold leading-snug text-ink md:text-[28px]">{p.name}</h1>
              <ShareButton title={p.name} />
            </div>
            <p className="mt-3 text-xs text-muted">SKU: <span className="ml-1 text-ink/80">{p.sku}</span></p>
            {p.category && <p className="mt-1 text-xs text-muted">Product Type: <Link href={`/category/${p.category.slug}`} className="ml-1 text-ink/80 hover:text-brand">{p.category.name}</Link></p>}
            {p.brand && <p className="mt-1 text-xs text-muted">Brand: <span className="ml-1 text-ink/80">{p.brand}</span></p>}
            <div className="mt-5" />
          </>
        }
        details={
          <div className="mt-8">
            {p.short_description && <p className="mb-6 text-sm leading-7 text-ink/75">{p.short_description}</p>}
            {p.description && <Accordion title="Description"><p className="whitespace-pre-line">{p.description}</p></Accordion>}
            {policies.shipping_policy && <Accordion title="Shipping"><p className="whitespace-pre-line">{policies.shipping_policy}</p></Accordion>}
            {policies.return_policy && <Accordion title="Returns & Exchange"><p className="whitespace-pre-line">{policies.return_policy}</p></Accordion>}
            {free && (
              <p className="mt-5 flex items-center gap-3 text-sm text-ink/80"><Truck size={22} className="text-gold" />Free shipping inside {free.name} on orders over {money(free.free_shipping_threshold)}</p>
            )}
          </div>
        }
      />
      {related.length > 0 && <div className="-mx-4 md:-mx-6"><Section title="You may also like"><ProductGrid products={related} /></Section></div>}
    </div>
  );
}
