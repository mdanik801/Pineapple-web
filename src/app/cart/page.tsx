"use client";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useStore, useMounted } from "@/lib/store";
import SmartImage from "@/components/SmartImage";
import { money } from "@/lib/format";

export default function CartPage() {
  const mounted = useMounted();
  const { items, setQty, remove } = useStore();
  if (!mounted) return <div className="container-x min-h-[50vh] py-12" />;
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div className="container-x py-8 sm:py-10">
      <h1 className="section-title text-2xl sm:text-3xl mb-6 sm:mb-8">Shopping Cart</h1>
      {items.length === 0 ? (
        <div className="rounded-xl border border-line bg-white py-16 text-center shadow-xs">
          <ShoppingBag className="mx-auto text-brand/30" size={56} />
          <p className="mt-4 text-sm sm:text-base text-muted">Your cart is empty.</p>
          <Link href="/shop" className="btn btn-primary mt-6 !px-6 !py-3 text-xs sm:text-sm">Start shopping</Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <ul className="divide-y divide-line border-y border-line bg-white">
            {items.map((i) => (
              <li key={i.key} className="flex gap-3 sm:gap-4 py-4 sm:py-5">
                <Link href={`/product/${i.slug}`} className="relative h-24 w-20 sm:h-32 sm:w-24 shrink-0 overflow-hidden rounded bg-brand-50 shadow-xs">
                  <SmartImage src={i.image} alt={i.name} sizes="96px" className="object-cover" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div>
                    <Link href={`/product/${i.slug}`} className="font-medium text-sm sm:text-base hover:text-brand leading-snug line-clamp-2">
                      {i.name}
                    </Link>
                    {i.variantTitle && <p className="mt-0.5 text-xs text-muted uppercase">{i.variantTitle}</p>}
                    <p className="mt-1 font-semibold text-brand text-sm sm:text-base">{money(i.price)}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-3">
                    <div className="flex items-center rounded border border-line bg-white">
                      <button aria-label="Decrease" className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center hover:bg-brand-50 touch-manipulation" onClick={() => setQty(i.key, i.qty - 1)}>
                        <Minus size={13} />
                      </button>
                      <span className="w-8 sm:w-10 text-center text-xs sm:text-sm font-medium">{i.qty}</span>
                      <button aria-label="Increase" className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center hover:bg-brand-50 touch-manipulation" onClick={() => setQty(i.key, i.qty + 1)}>
                        <Plus size={13} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm sm:text-base font-bold text-ink">{money(i.price * i.qty)}</span>
                      <button aria-label="Remove item" onClick={() => remove(i.key)} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-red-50 hover:text-red-600 touch-manipulation">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <aside className="h-fit rounded-xl border border-line bg-[#f8faf9] p-5 sm:p-6 shadow-xs">
            <h2 className="font-serif text-lg sm:text-xl text-brand">Order Summary</h2>
            <div className="mt-4 flex justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="font-semibold text-ink">{money(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-muted leading-normal">Shipping calculated at checkout.</p>
            <Link href="/checkout" className="btn btn-gold mt-6 w-full !py-3.5 text-xs sm:text-sm">Proceed to checkout</Link>
            <Link href="/shop" className="btn btn-outline mt-2.5 w-full !py-3 text-xs sm:text-sm">Continue shopping</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
