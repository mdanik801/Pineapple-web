import Link from "next/link";
import SmartImage from "@/components/SmartImage";
import { money } from "@/lib/format";
import type { ProductCardData } from "@/lib/data";

export default function EditorialShowcase({ products }: { products: ProductCardData[] }) {
  const [lead, ...supporting] = products;
  if (!lead) return null;

  return (
    <section className="border-y border-black/10 bg-[#f7f7f5] py-14 sm:py-20 lg:py-24">
      <div className="container-x">
        <div className="mb-8 flex items-end justify-between border-b border-black/10 pb-4 sm:mb-10">
          <div>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[.22em] text-neutral-500">Selected from the collection</p>
            <h2 className="font-serif text-3xl text-neutral-950 sm:text-4xl">Featured pieces</h2>
          </div>
          <Link href="/shop" className="text-xs uppercase tracking-[.12em] text-neutral-600 underline decoration-black/20 underline-offset-4 hover:text-black">Shop all</Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <article className="group lg:col-span-7">
            <Link href={`/product/${lead.slug}`} aria-label={lead.name} className="relative block aspect-[4/3] overflow-hidden bg-white sm:aspect-[5/3]">
              {lead.image
                ? <SmartImage src={lead.image} alt={lead.name} sizes="(max-width: 1024px) 100vw, 58vw" priority className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]" />
                : <div aria-hidden="true" className="absolute inset-0 bg-neutral-100" />}
              {lead.image2 && <SmartImage src={lead.image2} alt="" sizes="(max-width: 1024px) 100vw, 58vw" className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />}
            </Link>
            <div className="flex items-start justify-between gap-4 border-b border-black/15 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-[.18em] text-neutral-500">Featured</p>
                <h3 className="mt-1 text-sm font-medium text-neutral-950 sm:text-base">{lead.name}</h3>
              </div>
              <p className="shrink-0 text-sm text-neutral-800">{money(lead.price)}</p>
            </div>
          </article>

          {supporting.length > 0 && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:gap-x-6 lg:col-span-5 lg:grid-cols-1 lg:gap-y-6">
              {supporting.map((product) => (
                <article key={product.id} className="group">
                  <Link href={`/product/${product.slug}`} aria-label={product.name} className="relative block aspect-[4/5] overflow-hidden bg-white lg:aspect-[16/9]">
                    {product.image
                      ? <SmartImage src={product.image} alt={product.name} sizes="(max-width: 1024px) 48vw, 40vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]" />
                      : <div aria-hidden="true" className="absolute inset-0 bg-neutral-100" />}
                    {product.image2 && <SmartImage src={product.image2} alt="" sizes="(max-width: 1024px) 48vw, 40vw" className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />}
                  </Link>
                  <div className="flex items-start justify-between gap-3 border-b border-black/15 py-3">
                    <Link href={`/product/${product.slug}`} className="text-xs font-medium leading-5 text-neutral-950 sm:text-sm">{product.name}</Link>
                    <p className="shrink-0 text-xs text-neutral-700">{money(product.price)}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}