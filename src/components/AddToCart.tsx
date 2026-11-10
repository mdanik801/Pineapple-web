"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Check } from "lucide-react";
import { useStore } from "@/lib/store";
import WishlistButton from "./WishlistButton";
import SmartImage from "./SmartImage";
import { money, discountPct } from "@/lib/format";
import type { Variant } from "@/lib/data";

type P = {
  id: string; name: string; slug: string; image: string | null;
  regular_price: number; sale_price: number | null; price: number;
  variants: Variant[]; baseStock: number;
};

export default function AddToCart({ p, onVariantImage, hideBuyNow }: { p: P; onVariantImage?: (u: string | null) => void; hideBuyNow?: boolean }) {
  const router = useRouter();
  const add = useStore((s) => s.add);
  const setBuyNow = useStore((s) => s.setBuyNow);
  const sizes = useMemo(() => [...new Set(p.variants.map((v) => v.size).filter(Boolean))] as string[], [p.variants]);
  const colors = useMemo(() => [...new Set(p.variants.map((v) => v.color).filter(Boolean))] as string[], [p.variants]);
  const [size, setSize] = useState<string | null>(sizes.length === 1 ? sizes[0] : null);
  const [color, setColor] = useState<string | null>(colors.length === 1 ? colors[0] : null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [err, setErr] = useState("");

  const hasVariants = p.variants.length > 0;
  const variant = hasVariants
    ? p.variants.find((v) => (sizes.length ? v.size === size : true) && (colors.length ? v.color === color : true)) ?? null
    : null;
  const price = variant?.price ?? p.price;
  const reg = variant?.regular_price ?? p.regular_price;
  const stock = hasVariants ? variant?.stock ?? 0 : p.baseStock;
  const off = discountPct(reg, variant?.sale_price ?? p.sale_price);
  const optionStock = (s: string | null, c: string | null) =>
    p.variants.some((v) => (s == null || v.size === s) && (c == null || v.color === c) && v.stock > 0);
  const canBuy = hasVariants ? !variant || stock > 0 : stock > 0;

  function lineItem() {
    if (hasVariants && !variant) {
      setErr(`Please select ${[sizes.length && !size ? "a size" : "", colors.length && !color ? "a color" : ""].filter(Boolean).join(" and ")}.`);
      return null;
    }
    if (stock < 1) return null;
    setErr("");
    return {
      productId: p.id,
      variantId: variant?.id ?? null,
      name: p.name,
      slug: p.slug,
      image: variant?.image_url ?? p.image,
      price,
      variantTitle: variant ? [variant.size, variant.color].filter(Boolean).join(" / ") : null,
      max: stock,
    };
  }

  function handleAdd() {
    const it = lineItem();
    if (!it) return;
    add(it, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleBuyNow() {
    const it = lineItem();
    if (!it) return;
    setBuyNow({ ...it, key: `${it.productId}:${it.variantId ?? "-"}`, qty: Math.min(qty, it.max) });
    router.push("/checkout?buy=1");
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
        <span className="text-xl sm:text-2xl font-semibold text-ink">{money(price)}</span>
        {price < reg && (
          <>
            <span className="text-xs sm:text-sm text-muted line-through">{money(reg)}</span>
            <span className="bg-gold px-2 py-0.5 text-[11px] sm:text-xs font-bold text-white">SAVE {off}%</span>
          </>
        )}
      </div>

      {colors.length > 0 && (
        <div className="mt-4 sm:mt-5">
          <p className="mb-2 text-xs sm:text-sm font-medium">Color{color && <span className="uppercase text-brand"> — {color}</span>}</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => {
              const img = p.variants.find((v) => v.color === c && v.image_url)?.image_url ?? null;
              const out = !optionStock(size, c);
              return (
                <button
                  key={c}
                  type="button"
                  title={c}
                  aria-label={c}
                  aria-pressed={color === c}
                  onClick={() => { setColor(c); setErr(""); setQty(1); onVariantImage?.(img); }}
                  className={`relative h-14 w-12 sm:h-[68px] sm:w-14 overflow-hidden rounded-xs border-2 bg-brand-100 transition-all duration-200 hover:scale-105 touch-manipulation ${color === c ? "border-brand ring-1 ring-brand" : "border-line"} ${out ? "opacity-40" : ""}`}
                  style={img ? undefined : { background: c.toLowerCase().replace(/\s+/g, "") }}
                >
                  {img ? <SmartImage src={img} alt="" sizes="56px" className="object-cover" /> : <span className="sr-only">{c}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div className="mt-4 sm:mt-5">
          <p className="mb-2 text-xs sm:text-sm font-medium">Size</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => {
              const out = !optionStock(s, color);
              return (
                <button
                  key={s}
                  type="button"
                  disabled={out}
                  aria-pressed={size === s}
                  onClick={() => { setSize(s); setErr(""); setQty(1); }}
                  className={`grid h-9 min-w-9 sm:h-10 sm:min-w-10 place-items-center rounded-full border px-2.5 sm:px-3 text-xs sm:text-sm transition-all duration-200 touch-manipulation ${size === s ? "border-brand bg-brand font-semibold text-white shadow-xs" : "border-line hover:border-brand"} ${out ? "cursor-not-allowed text-muted/60 line-through" : ""}`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="mt-3.5 sm:mt-4 text-xs sm:text-sm">
        {hasVariants && !variant ? (
          <span className="text-muted">Select options to see availability</span>
        ) : stock > 0 ? (
          <span className="font-medium text-brand">{stock <= 5 ? `Only ${stock} left in stock` : "In stock"}</span>
        ) : (
          <span className="font-semibold text-red-600">Out of stock</span>
        )}
      </p>

      {/* Action Buttons Row */}
      <div className="mt-4 sm:mt-5 space-y-2.5">
        <div className="flex items-stretch gap-2 sm:gap-3">
          {/* Quantity Selector */}
          <div className="flex items-center rounded-xs border border-line bg-white shrink-0">
            <button
              type="button"
              aria-label="Decrease"
              className="grid h-11 w-8 sm:h-[48px] sm:w-10 place-items-center hover:bg-brand-50 touch-manipulation"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              <Minus size={15} />
            </button>
            <span className="w-7 sm:w-9 text-center text-xs sm:text-sm font-semibold">{qty}</span>
            <button
              type="button"
              aria-label="Increase"
              className="grid h-11 w-8 sm:h-[48px] sm:w-10 place-items-center hover:bg-brand-50 touch-manipulation"
              onClick={() => setQty((q) => Math.min(Math.max(1, stock), q + 1))}
            >
              <Plus size={15} />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={!canBuy}
            className="btn btn-outline min-h-[44px] h-11 sm:h-[48px] flex-1 !px-2.5 sm:!px-5 text-xs sm:text-sm font-semibold tracking-wide touch-manipulation disabled:opacity-50"
          >
            {added ? (
              <>
                <Check size={16} className="shrink-0" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag size={16} className="shrink-0" />
                <span>Add to cart</span>
              </>
            )}
          </button>

          {/* Wishlist Button */}
          <WishlistButton
            productId={p.id}
            className="grid h-11 w-11 sm:h-[48px] sm:w-[48px] shrink-0 place-items-center rounded-full border border-line text-brand hover:border-brand touch-manipulation shadow-xs"
          />
        </div>

        {!hideBuyNow && (
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={!canBuy}
            className="btn btn-primary min-h-[44px] w-full !py-3 sm:!py-3.5 text-xs sm:text-sm font-semibold tracking-wider touch-manipulation disabled:opacity-50"
          >
            Buy it now
          </button>
        )}
      </div>

      {err && <p role="alert" className="mt-3 text-xs sm:text-sm text-red-600">{err}</p>}
    </div>
  );
}
