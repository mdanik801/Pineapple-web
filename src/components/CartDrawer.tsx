"use client";
import Link from "next/link";
import { X, Minus, Plus, SquarePen, ShoppingBag } from "lucide-react";
import { useStore, useMounted } from "@/lib/store";
import SmartImage from "./SmartImage";
import { money } from "@/lib/format";

export default function CartDrawer({ note }: { note?: string }) {
  const mounted = useMounted();
  const { items, drawerOpen, setDrawer, setQty, remove } = useStore();
  const open = mounted && drawerOpen;
  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const close = () => setDrawer(false);
  return (
    <>
      <div onClick={close} className={`fixed inset-0 z-50 bg-black/55 transition-opacity duration-500 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} />
      <aside role="dialog" aria-label="Shopping cart" aria-hidden={!open}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] sm:rounded-l-2xl ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-start justify-between px-6 pb-4 pt-6">
          <div>
            <h2 className="text-lg font-semibold">Shopping Cart</h2>
            <p className="mt-1 text-xs text-muted">{count} item{count === 1 ? "" : "s"}</p>
          </div>
          <button aria-label="Close cart" onClick={close} className="grid h-9 w-9 place-items-center rounded-full hover:bg-brand-50"><X size={22} /></button>
        </div>

        {items.length === 0 ? (
          <div className="grid flex-1 place-items-center p-8 text-center">
            <div>
              <div className="mx-auto grid h-24 w-24 place-items-center border border-line text-brand/50"><ShoppingBag size={36} /></div>
              <p className="mt-4 text-muted">Your cart is empty.</p>
              <Link href="/shop" onClick={close} className="btn btn-primary mt-5">Continue shopping</Link>
            </div>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
              {items.map((i) => (
                <li key={i.key} className="flex gap-4 [animation:fadeIn_.4s_ease]">
                  <Link href={`/product/${i.slug}`} onClick={close} className="relative h-[104px] w-20 shrink-0 overflow-hidden bg-brand-50">
                    <SmartImage src={i.image} alt={i.name} sizes="80px" className="object-cover" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/product/${i.slug}`} onClick={close} className="line-clamp-2 text-sm font-medium hover:text-brand">{i.name}</Link>
                    {i.variantTitle && (
                      <p className="mt-1.5 flex items-center gap-2 text-xs uppercase text-muted">{i.variantTitle}
                        <Link href={`/product/${i.slug}`} onClick={close} aria-label="Change options" className="text-brand hover:text-gold"><SquarePen size={14} /></Link>
                      </p>
                    )}
                    <p className="mt-1.5 text-sm font-semibold">{money(i.price)}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center border border-line">
                        <button aria-label="Decrease quantity" className="grid h-9 w-9 place-items-center hover:bg-brand-50" onClick={() => setQty(i.key, i.qty - 1)}><Minus size={14} /></button>
                        <span className="w-8 text-center text-sm">{i.qty}</span>
                        <button aria-label="Increase quantity" className="grid h-9 w-9 place-items-center hover:bg-brand-50" onClick={() => setQty(i.key, i.qty + 1)}><Plus size={14} /></button>
                      </div>
                      <button aria-label="Remove item" onClick={() => remove(i.key)} className="grid h-9 w-9 place-items-center rounded-full text-ink hover:bg-brand-50 hover:text-red-600"><X size={20} /></button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-6 pb-6 pt-4">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between font-semibold"><dt>Subtotal:</dt><dd>{money(subtotal)}</dd></div>
                <div className="flex justify-between text-base font-bold"><dt>Total:</dt><dd>{money(subtotal)}</dd></div>
              </dl>
              <p className="mb-5 mt-3 text-xs leading-5 text-muted">{note ?? "Shipping calculated at checkout."}</p>
              <Link href="/checkout" onClick={close} className="btn btn-primary w-full !py-4">Checkout</Link>
              <Link href="/cart" onClick={close} className="btn btn-outline mt-3 w-full !py-4">View cart</Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
