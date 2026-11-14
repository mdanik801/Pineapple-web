"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { Menu, X, ChevronDown, ShoppingBag } from "lucide-react";
import { useStore, useMounted } from "@/lib/store";
import { categoryHref } from "@/lib/slug";

type Cat = { id: string; name: string; slug: string; children: { name: string; slug: string }[] };

export default function MobileMenu({ cats }: { cats: Cat[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [exp, setExp] = useState<string | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const mounted = useMounted();
  const cartCount = useStore((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const setDrawer = useStore((s) => s.setDrawer);
  const close = () => setOpen(false);

  useEffect(() => { setPortalReady(true); }, []);

  const panel = (
    <>
      <div className={`fixed inset-0 z-[60] bg-black/50 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={close} />
      <aside aria-hidden={!open} className={`fixed left-0 top-0 z-[60] h-full w-80 max-w-[85%] overflow-y-auto bg-white transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between bg-[#0A3C2A] px-5 py-4 text-white">
          <span className="font-serif text-lg font-medium tracking-wide">Menu</span>
          <button aria-label="Close menu" onClick={close} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10"><X size={20} /></button>
        </div>
        <ul className="divide-y divide-line">
          <li><Link href="/shop" onClick={close} className={`block px-5 py-3.5 text-[13px] font-semibold uppercase tracking-[0.08em] leading-5 transition-colors duration-200 ${pathname === "/shop" ? "text-[#C49A3E]" : "text-[#0A3C2A]"}`}>All Products</Link></li>
          {cats.map((c) => {
            const hasChildren = c.children.length > 0;
            const expanded = exp === c.id;
            const catHref = categoryHref(c.slug);
            const catActive = pathname === catHref || pathname.startsWith(catHref + "/");
            const gold = "text-[#C49A3E]";
            const baseCat = "text-[#0A3C2A]";
            return (
              <li key={c.id}>
                <div className="flex items-center">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => setExp(expanded ? null : c.id)}
                      className={`flex-1 px-5 py-3.5 text-left text-[13px] font-semibold uppercase tracking-[0.08em] leading-5 transition-colors duration-200 hover:text-[#C49A3E] ${expanded || catActive ? gold : baseCat}`}
                      aria-expanded={expanded}
                    >
                      {c.name}
                    </button>
                  ) : (
                    <Link href={catHref} onClick={close} className={`flex-1 px-5 py-3.5 text-[13px] font-semibold uppercase tracking-[0.08em] leading-5 transition-colors duration-200 hover:text-[#C49A3E] ${catActive ? gold : baseCat}`}>{c.name}</Link>
                  )}
                  {hasChildren && (
                    <button aria-label={`Toggle ${c.name}`} aria-expanded={expanded} className={`px-5 py-3.5 transition-colors duration-200 hover:text-[#C49A3E] ${expanded || catActive ? gold : "text-[#0A3C2A]"}`} onClick={() => setExp(expanded ? null : c.id)}>
                      <ChevronDown size={18} className={expanded ? "rotate-180" : ""} />
                    </button>
                  )}
                </div>
                {expanded && hasChildren && (
                  <ul className="bg-brand-50 pb-2">
                    <li><Link href={catHref} onClick={close} className={`block px-8 py-2.5 text-[15px] font-semibold leading-6 transition-colors duration-200 hover:text-[#C49A3E] ${pathname === catHref ? gold : "text-[#B8891E]"}`}>Shop all {c.name}</Link></li>
                    {c.children.map((k) => {
                      const kHref = categoryHref(k.slug);
                      const kActive = pathname === kHref || pathname.startsWith(kHref + "/");
                      return <li key={k.slug}><Link href={kHref} onClick={close} className={`block px-8 py-2.5 text-[15px] font-medium leading-6 transition-colors duration-200 hover:text-[#C49A3E] ${kActive ? gold : "text-neutral-800"}`}>{k.name}</Link></li>;
                    })}
                  </ul>
                )}
              </li>
            );
          })}
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

  return (
    <>
      <button aria-label="Open menu" onClick={() => setOpen(true)} className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center text-neutral-900 touch-manipulation"><Menu size={22} /></button>
      {portalReady ? createPortal(panel, document.body) : null}
    </>
  );
}
