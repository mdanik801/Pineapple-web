"use client";
import Link from "next/link";
import { useState } from "react";
import { Search, Heart, ShoppingBag, User } from "lucide-react";
import { useStore, useMounted } from "@/lib/store";
import SearchModal from "./SearchModal";

export default function HeaderActions({ name, popular }: { name: string | null; popular: string[] }) {
  const mounted = useMounted();
  const [open, setOpen] = useState(false);
  const cartCount = useStore((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const wishCount = useStore((s) => s.wishlist.length);
  const setDrawer = useStore((s) => s.setDrawer);
  const badge = "grid h-5 min-w-5 place-items-center rounded-full bg-black px-1 text-[10px] font-medium text-white";
  const mBadge = "absolute -right-0.5 -top-0.5 " + badge;

  return (
    <>
      <div className="hidden items-center gap-3 text-neutral-900 md:flex lg:gap-5">
        <button type="button" onClick={() => setOpen(true)} aria-label="Open search" title="Search products"
          className="group grid h-10 w-10 place-items-center text-neutral-700 hover:text-black lg:w-auto lg:grid-cols-[auto_1fr] lg:gap-2 lg:border-b lg:border-black/20 lg:px-1">
          <Search size={18} />
          <span className="hidden text-xs lg:inline">Search</span>
        </button>
        <button onClick={() => setDrawer(true)} aria-label={`Shopping cart, ${mounted ? cartCount : 0} items`} title="Shopping cart" className="relative grid h-10 w-10 place-items-center hover:text-neutral-500"><ShoppingBag size={19} /><span className={badge}>{mounted ? cartCount : 0}</span></button>
        <Link href="/wishlist" aria-label="Wishlist" title="Wishlist" className="relative grid h-10 w-10 place-items-center hover:text-neutral-500"><Heart size={19} />{mounted && wishCount > 0 && <span className={badge}>{wishCount}</span>}</Link>
        <Link href={name ? "/account" : "/login"} aria-label={name ? "My account" : "Sign in"} title={name || "Sign in"} className="grid h-10 w-10 place-items-center hover:text-neutral-500"><User size={19} /></Link>
      </div>

      <div className="flex items-center text-neutral-900 md:hidden">
        <button aria-label="Search" onClick={() => setOpen(true)} className="grid h-9 w-9 place-items-center"><Search size={19} /></button>
        <Link href="/wishlist" aria-label="Wishlist" className="relative grid h-9 w-9 place-items-center"><Heart size={19} />{mounted && wishCount > 0 && <span className={mBadge}>{wishCount}</span>}</Link>
        <button aria-label="Open cart" onClick={() => setDrawer(true)} className="relative grid h-9 w-9 place-items-center"><ShoppingBag size={19} /><span className={mBadge}>{mounted ? cartCount : 0}</span></button>
        <Link href={name ? "/account" : "/login"} aria-label={name ? "My account" : "Sign in"} className="grid h-9 w-9 place-items-center"><User size={19} /></Link>
      </div>

      {open && <SearchModal popular={popular} onClose={() => setOpen(false)} />}
    </>
  );
}
