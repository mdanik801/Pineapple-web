"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, ChevronDown, ShoppingBag } from "lucide-react";
import { useStore, useMounted } from "@/lib/store";

type Cat = { id: string; name: string; slug: string; children: { name: string; slug: string }[] };

export default function MobileMenu({ cats }: { cats: Cat[] }) {
  const [open, setOpen] = useState(false);
  const [exp, setExp] = useState<string | null>(null);
  const mounted = useMounted();
  const cartCount = useStore((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const setDrawer = useStore((s) => s.setDrawer);
  const close = () => setOpen(false);
  return (
    <>
      <button aria-label="Open menu" onClick={() => setOpen(true)} className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center text-neutral-900 touch-manipulation"><Menu size={22} /></button>
      <div className={`fixed inset-0 z-[60] bg-black/50 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={close} />
      <aside aria-hidden={!open} className={`fixed left-0 top-0 z-[60] h-full w-80 max-w-[85%] overflow-y-auto bg-white transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between bg-[#0A3C2A] px-5 py-4 text-white">
          <span className="font-serif text-lg font-medium tracking-wide">Menu</span>
          <button aria-label="Close menu" onClick={close} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10"><X size={20} /></button>
        </div>
        <ul className="divide-y divide-line">
          <li><Link href="/shop?sort=new" onClick={close} className="block px-5 py-3.5 font-bold uppercase tracking-wider text-[#C49A3E]">New Arrivals</Link></li>
          <li><Link href="/shop" onClick={close} className="block px-5 py-3.5 font-semibold text-brand uppercase tracking-wider text-xs">All Products</Link></li>
          {cats.map((c) => (
            <li key={c.id}>
              <div className="flex items-center">
                <Link href={`/category/${c.slug}`} onClick={close} className="flex-1 px-5 py-3.5 font-semibold text-brand uppercase tracking-wider text-xs">{c.name}</Link>
                {c.children.length > 0 && (
                  <button aria-label={`Toggle ${c.name}`} aria-expanded={exp === c.id} className="px-5 py-3.5" onClick={() => setExp(exp === c.id ? null : c.id)}>
                    <ChevronDown size={18} className={exp === c.id ? "rotate-180" : ""} />
                  </button>
                )}
              </div>
              {exp === c.id && <ul className="bg-brand-50 pb-2">{c.children.map((k) => <li key={k.slug}><Link href={`/category/${k.slug}`} onClick={close} className="block px-8 py-2.5 text-sm">{k.name}</Link></li>)}</ul>}
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => { close(); setDrawer(true); }}
              className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-medium text-ink/80 hover:text-[#0A3C2A]"
            >
              <span className="flex items-center gap-2.5"><ShoppingBag size={17} /> Shopping Cart</span>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C49A3E] px-1.5 text-[11px] font-bold text-white">
                {mounted ? cartCount : 0}
              </span>
            </button>
          </li>
          <li><Link href="/wishlist" onClick={close} className="block px-5 py-3.5 text-sm font-medium text-ink/80">Wishlist</Link></li>
          <li><Link href="/track-order" onClick={close} className="block px-5 py-3.5 text-sm font-medium text-ink/80">Track Order</Link></li>
          <li><Link href="/account" onClick={close} className="block px-5 py-3.5 text-sm font-medium text-ink/80">My Account</Link></li>
          <li><Link href="/account/orders" onClick={close} className="block px-5 py-3.5 text-sm font-medium text-ink/80">My Orders</Link></li>
        </ul>
      </aside>
    </>
  );
}
