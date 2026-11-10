"use client";
import { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { useStore } from "@/lib/store";
import QuickAdd from "./QuickAdd";
import type { ProductCardData } from "@/lib/data";

export default function CardAddButton({ p }: { p: ProductCardData }) {
  const add = useStore((s) => s.add);
  const [done, setDone] = useState(false);
  const [quick, setQuick] = useState(false);
  const soldOut = !p.in_stock;

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (soldOut) return;
    if (p.has_variants) {
      setQuick(true);
      return;
    }
    add({
      productId: p.id,
      variantId: null,
      name: p.name,
      slug: p.slug,
      image: p.image,
      price: p.price,
      variantTitle: null,
      max: p.stock,
    });
    setDone(true);
    setTimeout(() => setDone(false), 1400);
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={soldOut}
        aria-label={`Add ${p.name} to cart`}
        className="absolute inset-x-0 bottom-0 z-10 flex min-h-[38px] sm:min-h-[42px] items-center justify-center gap-1.5 sm:gap-2 bg-brand/95 px-2 py-2.5 text-xs font-semibold tracking-wide text-white backdrop-blur-xs transition-[translate,opacity,background-color] duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:bg-gold disabled:hidden translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100 touch-manipulation sm:py-3 sm:text-sm [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100"
      >
        {done ? (
          <>
            <Check size={15} className="shrink-0" />
            <span>Added</span>
          </>
        ) : (
          <>
            <ShoppingBag size={15} className="shrink-0" />
            <span>Add to cart</span>
          </>
        )}
      </button>
      {quick && <QuickAdd slug={p.slug} onClose={() => setQuick(false)} />}
    </>
  );
}
