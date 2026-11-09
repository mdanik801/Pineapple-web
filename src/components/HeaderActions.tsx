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
  const badge = "grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] font-bold text-white";
  const mBadge = "absolute -right-1 -top-1 " + badge;

  return (
    <>
      {/* Desktop: search + text links, like Yellow */}
      <div className="hidden flex-col items-end gap-4 md:flex">
        <button type="button" onClick={() => setOpen(true)} aria-label="Open search"
          className="group flex w-72 items-center justify-between rounded-full border border-brand/20 bg-[#f6f8f7] py-1 pl-5 pr-1 text-left text-sm text-muted shadow-sm transition-all duration-300 hover:w-80 hover:border-brand hover:bg-white hover:shadow-[0_8px_24px_-10px_rgba(10,60,42,.5)] focus-visible:ring-4 focus-visible:ring-brand/15">
          <span className="truncate transition-colors duration-300 group-hover:text-ink">Search products…</span>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-white transition-all duration-300 group-hover:bg-gold group-hover:rotate-[-8deg] group-hover:scale-105"><Search size={17} /></span>
        </button>
        <div className="flex items-center gap-6 text-sm text-ink">
          <button onClick={() => setDrawer(true)} className="flex items-center gap-2 hover:text-gold"><ShoppingBag size={20} />Shopping Cart <span className={badge}>{mounted ? cartCount : 0}</span></button>
          <Link href="/wishlist" className="flex items-center gap-2 hover:text-gold"><Heart size={20} />My Wish List{mounted && wishCount > 0 && <span className={badge}>{wishCount}</span>}</Link>
          <Link href={name ? "/account" : "/login"} className="flex items-center gap-2 hover:text-gold">{name ? <><User size={20} />{name}</> : "Sign In"}</Link>
        </div>
      </div>

      {/* Mobile: compact icons */}
      <div className="flex items-center text-brand md:hidden">
        <button aria-label="Search" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center"><Search size={21} /></button>
        <Link href="/wishlist" aria-label="Wishlist" className="relative grid h-10 w-10 place-items-center"><Heart size={21} />{mounted && wishCount > 0 && <span className={mBadge}>{wishCount}</span>}</Link>
        <button aria-label="Open cart" onClick={() => setDrawer(true)} className="relative grid h-10 w-10 place-items-center"><ShoppingBag size={21} />{mounted && cartCount > 0 && <span className={mBadge}>{cartCount}</span>}</button>
      </div>

      {open && <SearchModal popular={popular} onClose={() => setOpen(false)} />}
    </>
  );
}
