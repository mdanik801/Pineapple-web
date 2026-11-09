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
    <div className="container-x py-10">
      <h1 className="section-title mb-8">Shopping Cart</h1>
      {items.length === 0 ? (
        <div className="py-16 text-center">
          <ShoppingBag className="mx-auto text-brand/30" size={64} />
          <p className="mt-4 text-muted">Your cart is empty.</p>
          <Link href="/shop" className="btn btn-primary mt-6">Start shopping</Link>
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
          <ul className="divide-y divide-line border-y border-line">
            {items.map((i) => (
              <li key={i.key} className="flex gap-4 py-5">
                <Link href={`/product/${i.slug}`} className="relative h-32 w-24 shrink-0 bg-brand-50"><SmartImage src={i.image} alt={i.name} sizes="96px" className="object-cover" /></Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link href={`/product/${i.slug}`} className="font-medium hover:text-brand">{i.name}</Link>
                  {i.variantTitle && <p className="text-sm text-muted">{i.variantTitle}</p>}
                  <p className="mt-1 font-bold text-brand">{money(i.price)}</p>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex items-center border border-line">
                      <button aria-label="Decrease" className="grid h-9 w-9 place-items-center" onClick={() => setQty(i.key, i.qty - 1)}><Minus size={14} /></button>
                      <span className="w-10 text-center">{i.qty}</span>
                      <button aria-label="Increase" className="grid h-9 w-9 place-items-center" onClick={() => setQty(i.key, i.qty + 1)}><Plus size={14} /></button>
                    </div>
                    <span className="font-semibold">{money(i.price * i.qty)}</span>
                    <button aria-label="Remove" onClick={() => remove(i.key)} className="text-muted hover:text-red-600"><Trash2 size={18} /></button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <aside className="h-fit border border-line bg-brand-50 p-6">
            <h2 className="font-serif text-xl text-brand">Order Summary</h2>
            <div className="mt-4 flex justify-between"><span>Subtotal</span><span className="font-semibold">{money(subtotal)}</span></div>
            <p className="mt-1 text-xs text-muted">Shipping calculated at checkout.</p>
            <Link href="/checkout" className="btn btn-gold mt-6 w-full">Proceed to checkout</Link>
            <Link href="/shop" className="btn btn-outline mt-2 w-full">Continue shopping</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
