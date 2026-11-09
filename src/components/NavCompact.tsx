"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Search, Heart, ShoppingBag, User } from "lucide-react";
import { useStore, useMounted } from "@/lib/store";
import SearchModal from "./SearchModal";

/** Shown inside the sticky nav bar once the page is scrolled past the top row. Slides in/out vertically. */
export default function NavCompact({ name, popular }: { name: string | null; popular: string[] }) {
  const mounted = useMounted();
  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState(false);
  const cart = useStore((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const wish = useStore((s) => s.wishlist.length);
  const setDrawer = useStore((s) => s.setDrawer);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 110);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const slide = (delay: number) => ({
    transform: scrolled ? "translateY(0)" : "translateY(-130%)",
    opacity: scrolled ? 1 : 0,
    transition: `transform .55s cubic-bezier(.22,1,.36,1) ${scrolled ? delay : 0}ms, opacity .4s ease ${scrolled ? delay : 0}ms`,
  });
  const badge = "absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold leading-none text-white";

  return (
    <>
      <div className={`container-x pointer-events-none absolute inset-0 hidden items-center justify-between md:flex ${scrolled ? "" : "invisible delay-500"}`} aria-hidden={!scrolled}>
        <div className="h-full overflow-hidden py-1.5">
          <Link href="/" aria-label="Pineapple home" style={slide(0)} tabIndex={scrolled ? 0 : -1} className="pointer-events-auto flex h-full items-center rounded-sm bg-white px-2 transition-transform duration-300 hover:scale-105">
            <Image src="/logo-mark.png" alt="Pineapple" width={32} height={60} className="h-[30px] w-auto" />
          </Link>
        </div>
        <div className="flex h-full items-center gap-1 overflow-hidden">
          <button style={slide(60)} tabIndex={scrolled ? 0 : -1} aria-label="Search" title="Search" onClick={() => setSearch(true)} className="nav-icon pointer-events-auto"><Search size={20} /></button>
          <Link style={slide(120)} tabIndex={scrolled ? 0 : -1} href="/wishlist" aria-label="My wish list" title="My Wish List" className="nav-icon pointer-events-auto"><Heart size={20} />{mounted && wish > 0 && <span className={badge}>{wish}</span>}</Link>
          <button style={slide(180)} tabIndex={scrolled ? 0 : -1} aria-label="Shopping cart" title="Shopping Cart" onClick={() => setDrawer(true)} className="nav-icon pointer-events-auto"><ShoppingBag size={20} />{mounted && cart > 0 && <span className={badge}>{cart}</span>}</button>
          <Link style={slide(240)} tabIndex={scrolled ? 0 : -1} href={name ? "/account" : "/login"} aria-label={name ? "My account" : "Sign in"} title={name ?? "Sign in"} className="nav-icon pointer-events-auto"><User size={20} /></Link>
        </div>
      </div>
      {search && <SearchModal popular={popular} onClose={() => setSearch(false)} />}
    </>
  );
}
