"use client";
import Link from "next/link";
import { useState } from "react";
import SmartImage from "./SmartImage";
import WishlistButton from "./WishlistButton";
import CardAddButton from "./CardAddButton";
import { money, discountPct } from "@/lib/format";
import type { ProductCardData } from "@/lib/data";

export default function ProductCard({ p, priority }: { p: ProductCardData; priority?: boolean }) {
  const [sel, setSel] = useState<string | null>(null); // selected swatch color
  const off = discountPct(p.regular_price, p.sale_price);
  const ease = "transition-[scale,opacity] duration-[1100ms] ease-[cubic-bezier(.19,1,.22,1)]";
  const swImg = sel ? p.swatches.find((s) => s.color === sel)?.image ?? null : null;
  const main = swImg ?? p.image;
  const second = swImg ? null : p.image2;
  const sw = p.swatches.slice(0, 5);
  return (
    <div className="group relative">
      <div className="relative aspect-[5/6] overflow-hidden bg-brand-50">
        <Link href={`/product/${p.slug}`} aria-label={p.name} className="absolute inset-0 block">
          <SmartImage src={main} alt={p.name} priority={priority}
            className={`object-cover ${ease} will-change-[scale,opacity] group-hover:scale-110 ${second ? "group-hover:opacity-0" : ""}`} />
          {second && <SmartImage src={second} alt="" className={`object-cover opacity-0 ${ease} will-change-[scale,opacity] group-hover:scale-110 group-hover:opacity-100`} />}
        </Link>
        <div className="pointer-events-none absolute left-2 top-2 flex flex-col gap-1">
          {off > 0 && <span className="bg-gold px-2 py-1 text-[11px] font-bold text-white">-{off}%</span>}
        </div>
        {!p.in_stock && (
          <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 bg-ink/75 py-1.5 text-center text-xs font-semibold tracking-wider text-white">SOLD OUT</div>
        )}
        <CardAddButton p={p} />
        <WishlistButton productId={p.id} className="absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-brand shadow transition-[translate,opacity,scale,background-color] duration-300 hover:scale-110 hover:bg-white md:translate-y-1 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:focus-visible:opacity-100" />
      </div>
      <Link href={`/product/${p.slug}`} className="block px-1.5 pt-4 text-center sm:px-2 sm:pt-5">
        <h3 className="line-clamp-2 min-h-[3rem] text-[15px] font-semibold leading-snug text-[#111827] transition-colors duration-300 group-hover:text-brand sm:min-h-[3.25rem] sm:text-[16px] md:text-[17px]">{p.name || "Unnamed product"}</h3>
        {(p.brand || p.sku) && <p className="mt-1.5 line-clamp-1 text-[13px] font-medium text-[#4B5563] sm:text-sm">{[p.brand, p.sku].filter(Boolean).join(" • ")}</p>}
        <p className="mt-2 flex flex-wrap items-baseline justify-center gap-x-2 gap-y-0.5">
          <span className="text-[16px] font-medium text-[#111827] sm:text-[17px] md:text-[18px]">{money(p.price)}</span>
          {p.price < p.regular_price && <span className="text-[13px] font-normal text-[#DC2626] line-through sm:text-sm">{money(p.regular_price)}</span>}
        </p>
      </Link>
      {sw.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-1.5 sm:mt-2.5">
          {sw.map((s) => (
            <button key={s.color} type="button" title={s.color} aria-label={`Color ${s.color}`} aria-pressed={sel === s.color}
              onClick={(e) => {
                if (typeof window !== "undefined" && window.matchMedia("(hover: none), (pointer: coarse)").matches) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
                setSel(sel === s.color ? null : s.color);
              }}
              className={`relative h-6 w-6 overflow-hidden rounded-full border bg-brand-100 transition-all duration-200 hover:scale-110 ${sel === s.color ? "border-brand ring-1 ring-brand" : "border-line"}`}
              style={s.image ? undefined : { background: s.color.toLowerCase().replace(/\s+/g, "") }}>
              {s.image && <SmartImage src={s.image} alt="" sizes="24px" className="object-cover" />}
            </button>
          ))}
          {p.swatches.length > sw.length && <span className="text-xs font-medium text-[#4B5563]">+{p.swatches.length - sw.length}</span>}
        </div>
      )}
    </div>
  );
}
