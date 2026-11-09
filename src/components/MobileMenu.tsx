"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";

type Cat = { id: string; name: string; slug: string; children: { name: string; slug: string }[] };

export default function MobileMenu({ cats }: { cats: Cat[] }) {
  const [open, setOpen] = useState(false);
  const [exp, setExp] = useState<string | null>(null);
  const close = () => setOpen(false);
  return (
    <>
      <button aria-label="Open menu" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center text-brand"><Menu size={24} /></button>
      <div className={`fixed inset-0 z-[60] bg-black/50 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={close} />
      <aside aria-hidden={!open} className={`fixed left-0 top-0 z-[60] h-full w-80 max-w-[85%] overflow-y-auto bg-white transition-transform ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between bg-brand px-5 py-4 text-white"><span className="font-serif text-lg">Menu</span><button aria-label="Close menu" onClick={close}><X /></button></div>
        <ul className="divide-y divide-line">
          <li><Link href="/shop" onClick={close} className="block px-5 py-4 font-semibold text-brand">All Products</Link></li>
          {cats.map((c) => (
            <li key={c.id}>
              <div className="flex items-center">
                <Link href={`/category/${c.slug}`} onClick={close} className="flex-1 px-5 py-4 font-semibold text-brand">{c.name}</Link>
                {c.children.length > 0 && (
                  <button aria-label={`Toggle ${c.name}`} aria-expanded={exp === c.id} className="px-5 py-4" onClick={() => setExp(exp === c.id ? null : c.id)}>
                    <ChevronDown size={18} className={exp === c.id ? "rotate-180" : ""} />
                  </button>
                )}
              </div>
              {exp === c.id && <ul className="bg-brand-50 pb-2">{c.children.map((k) => <li key={k.slug}><Link href={`/category/${k.slug}`} onClick={close} className="block px-8 py-2.5 text-sm">{k.name}</Link></li>)}</ul>}
            </li>
          ))}
          <li><Link href="/wishlist" onClick={close} className="block px-5 py-4">Wishlist</Link></li>
          <li><Link href="/track-order" onClick={close} className="block px-5 py-4">Track Order</Link></li>
          <li><Link href="/account" onClick={close} className="block px-5 py-4">My Account</Link></li>
          <li><Link href="/account/orders" onClick={close} className="block px-5 py-4">My Orders</Link></li>
        </ul>
      </aside>
    </>
  );
}
