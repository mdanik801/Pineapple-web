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
      <div
        onClick={close}
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-label="Shopping cart"
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[400px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] sm:rounded-l-2xl ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-start justify-between px-4 pb-3 pt-5 sm:px-6 sm:pb-4 sm:pt-6 border-b border-line">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-brand">Shopping Cart</h2>
            <p className="mt-0.5 text-xs text-muted">{count} item{count === 1 ? "" : "s"}</p>
          </div>
          <button
            aria-label="Close cart"
            onClick={close}
            className="grid h-9 w-9 place-items-center rounded-full text-neutral-800 hover:bg-brand-50 touch-manipulation"
          >
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="grid flex-1 place-items-center p-6 text-center">
            <div>
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-line text-brand/50"><ShoppingBag size={32} /></div>
              <p className="mt-4 text-sm text-muted">Your cart is empty.</p>
              <Link href="/shop" onClick={close} className="btn btn-primary mt-5 !px-6 !py-3 text-xs sm:text-sm">Continue shopping</Link>
            </div>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
              {items.map((i) => (
                <li key={i.key} className="flex gap-3 sm:gap-4 border-b border-line pb-4 [animation:fadeIn_.3s_ease]">
                  <Link href={`/product/${i.slug}`} onClick={close} className="relative h-20 w-16 sm:h-[96px] sm:w-20 shrink-0 overflow-hidden rounded bg-brand-50 shadow-xs">
                    <SmartImage src={i.image} alt={i.name} sizes="80px" className="object-cover" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/product/${i.slug}`} onClick={close} className="line-clamp-2 text-xs sm:text-sm font-medium hover:text-brand leading-snug">{i.name}</Link>
                    {i.variantTitle && (
                      <p className="mt-1 flex items-center gap-1.5 text-[11px] uppercase text-muted">
                        <span>{i.variantTitle}</span>
                        <Link href={`/product/${i.slug}`} onClick={close} aria-label="Change options" className="text-brand hover:text-gold"><SquarePen size={12} /></Link>
                      </p>
                    )}
                    <p className="mt-1 text-xs sm:text-sm font-semibold text-brand">{money(i.price)}</p>
                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="flex items-center rounded border border-line bg-white">
                        <button aria-label="Decrease quantity" className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center hover:bg-brand-50 touch-manipulation" onClick={() => setQty(i.key, i.qty - 1)}><Minus size={12} /></button>
                        <span className="w-6 sm:w-7 text-center text-xs font-semibold">{i.qty}</span>
                        <button aria-label="Increase quantity" className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center hover:bg-brand-50 touch-manipulation" onClick={() => setQty(i.key, i.qty + 1)}><Plus size={12} /></button>
                      </div>
                      <button aria-label="Remove item" onClick={() => remove(i.key)} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-red-50 hover:text-red-600 touch-manipulation"><X size={16} /></button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-line bg-[#fafbfa] px-4 pb-5 pt-4 sm:px-6 sm:pb-6">
              <dl className="space-y-1.5 text-xs sm:text-sm">
                <div className="flex justify-between text-muted"><dt>Subtotal:</dt><dd className="font-medium text-ink">{money(subtotal)}</dd></div>
                <div className="flex justify-between text-sm sm:text-base font-bold text-brand"><dt>Total:</dt><dd>{money(subtotal)}</dd></div>
              </dl>
              <p className="mb-4 mt-2 text-[11px] leading-relaxed text-muted">{note ?? "Shipping calculated at checkout."}</p>
              <Link href="/checkout" onClick={close} className="btn btn-primary w-full !py-3.5 text-xs sm:text-sm">Proceed to Checkout</Link>
              <Link href="/cart" onClick={close} className="btn btn-outline mt-2 w-full !py-3 text-xs sm:text-sm">View Cart</Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
