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
            {label ? <p className="mb-2 text-[11px] font-medium uppercase tracking-[.22em] text-[#4B5563] sm:text-xs">{label}</p> : null}
            {heading ? <h2 className="text-[1.875rem] font-bold leading-tight text-[#111827] sm:text-[2.25rem]">{heading}</h2> : null}
          </div>
          {shopAllText && shopAllHref ? (
            <Link href={shopAllHref} className="text-xs font-medium uppercase tracking-[.12em] text-[#4B5563] underline decoration-black/20 underline-offset-4 transition-colors duration-200 hover:text-[#111827] sm:text-sm">{shopAllText}</Link>
          ) : null}
        </div>

        <div className="grid w-full grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-7 lg:gap-y-10">
          {products.map((product, idx) => (
            <article key={product.id} className="group min-w-0">
              <Link href={`/product/${product.slug}`} aria-label={product.name} className="relative block aspect-[4/5] w-full overflow-hidden bg-white">
                {product.image
                  ? <SmartImage src={product.image} alt={product.name} sizes="(max-width: 640px) 100vw, (max-width: 1023px) 50vw, 25vw" priority={idx < 4} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]" />
                  : <div aria-hidden="true" className="absolute inset-0 bg-neutral-100" />}
                {product.image2 && <SmartImage src={product.image2} alt="" sizes="(max-width: 640px) 100vw, (max-width: 1023px) 50vw, 25vw" className="h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />}
              </Link>
              <div className="flex items-start justify-between gap-3 border-b border-black/15 py-4 sm:py-5">
                <Link href={`/product/${product.slug}`} className="line-clamp-2 text-[15px] font-semibold leading-snug text-[#111827] transition-colors duration-200 hover:text-brand sm:text-[16px] md:text-[17px]">{product.name}</Link>
                <p className="shrink-0 text-right">
                  <span className="block text-[16px] font-medium text-[#111827] sm:text-[17px] md:text-[18px]">{money(product.price)}</span>
                  {product.price < product.regular_price && <span className="mt-0.5 block text-[13px] font-normal text-[#DC2626] line-through sm:text-sm">{money(product.regular_price)}</span>}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}