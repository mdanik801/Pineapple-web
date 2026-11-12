import Link from "next/link";
import SmartImage from "@/components/SmartImage";
import { money } from "@/lib/format";
import type { ProductCardData } from "@/lib/data";

type Props = {
  products: ProductCardData[];
  label?: string;
  heading?: string;
  shopAllText?: string;
  shopAllHref?: string;
};

export default function EditorialShowcase({
  products,
  label = "Selected from the collection",
  heading = "Featured pieces",
  shopAllText = "Shop all",
  shopAllHref = "/shop",
}: Props) {
  if (!products.length) return null;

  return (
    <section className="border-y border-black/10 bg-[#f7f7f5] py-14 sm:py-20 lg:py-24">
      <div className="container-x">
        <div className="mb-8 flex items-end justify-between border-b border-black/10 pb-4 sm:mb-10">
          <div>
            {label ? <p className="mb-2 text-[10px] font-medium uppercase tracking-[.22em] text-neutral-500">{label}</p> : null}
            {heading ? <h2 className="font-serif text-3xl text-neutral-950 sm:text-4xl">{heading}</h2> : null}
          </div>
          {shopAllText && shopAllHref ? (
            <Link href={shopAllHref} className="text-xs uppercase tracking-[.12em] text-neutral-600 underline decoration-black/20 underline-offset-4 hover:text-black">{shopAllText}</Link>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-9">
          {products.map((product, idx) => (
            <article key={product.id} className="group">
              <Link href={`/product/${product.slug}`} aria-label={product.name} className="relative block aspect-[4/5] overflow-hidden bg-white">
                {product.image
                  ? <SmartImage src={product.image} alt={product.name} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" priority={idx === 0} className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]" />
                  : <div aria-hidden="true" className="absolute inset-0 bg-neutral-100" />}
                {product.image2 && <SmartImage src={product.image2} alt="" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />}
              </Link>
              <div className="flex items-start justify-between gap-3 border-b border-black/15 py-3 sm:py-4">
                <Link href={`/product/${product.slug}`} className="text-xs font-medium leading-5 text-neutral-950 sm:text-sm">{product.name}</Link>
                <p className="shrink-0 text-xs text-neutral-700 sm:text-sm sm:text-neutral-800">{money(product.price)}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}