import Link from "next/link";
import SmartImage from "./SmartImage";
import { money } from "@/lib/format";
import type { ProductCardData } from "@/lib/data";

export default function ProductCard({ p, priority }: { p: ProductCardData; priority?: boolean }) {
  const ease = "transition-[scale,opacity] duration-[1100ms] ease-[cubic-bezier(.19,1,.22,1)]";
  const main = p.image;
  const second = p.image2;

  return (
    <div className="group relative min-w-0">
      <div className="relative aspect-[5/6] overflow-hidden bg-brand-50">
        <Link href={`/product/${p.slug}`} aria-label={p.name} prefetch className="absolute inset-0 block">
          <SmartImage src={main} alt={p.name} priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1023px) 50vw, 25vw"
            className={`object-cover ${ease} will-change-[scale,opacity] group-hover:scale-110 ${second ? "group-hover:opacity-0" : ""}`} />
          {second && <SmartImage src={second} alt="" sizes="(max-width: 640px) 100vw, (max-width: 1023px) 50vw, 25vw" className={`object-cover opacity-0 ${ease} will-change-[scale,opacity] group-hover:scale-110 group-hover:opacity-100`} />}
        </Link>
      </div>
      <Link href={`/product/${p.slug}`} className="block px-1.5 pt-4 text-center sm:px-2 sm:pt-5">
        <h3 className="line-clamp-2 min-h-[3rem] text-[15px] font-semibold leading-snug text-[#111827] transition-colors duration-300 group-hover:text-brand sm:min-h-[3.25rem] sm:text-[16px] md:text-[17px]">{p.name || "Unnamed product"}</h3>
        <p className="mt-2 flex flex-wrap items-baseline justify-center gap-x-2 gap-y-0.5">
          <span className="text-[16px] font-medium text-[#111827] sm:text-[17px] md:text-[18px]">{money(p.price)}</span>
        </p>
      </Link>
    </div>
  );
}
