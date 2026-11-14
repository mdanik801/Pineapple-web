"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { categoryHref } from "@/lib/slug";
import MobileMenu from "./MobileMenu";
import AnimatedLogo from "./AnimatedLogo";
import SearchModal from "./SearchModal";

type CatNode = {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string; children: { id: string; name: string; slug: string }[] }[];
};

export default function HeaderNav({
  brandName,
  top,
  popular = [],
}: {
  brandName: string;
  top: CatNode[];
  popular?: string[];
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => { setOpenId(null); }, [pathname]);

  useEffect(() => {
    function onDocDown(e: MouseEvent | TouchEvent) {
      if (!navRef.current) return;
      if (!navRef.current.contains(e.target as Node)) setOpenId(null);
    }
    function onEsc(e: KeyboardEvent) { if (e.key === "Escape") setOpenId(null); }
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("touchstart", onDocDown, { passive: true });
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("touchstart", onDocDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const cancelClose = () => { if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; } };
  const scheduleClose = () => { cancelClose(); closeTimer.current = setTimeout(() => setOpenId(null), 140); };
  useEffect(() => () => cancelClose(), []);

  const mobileCats = top.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    children: c.children.map((k) => ({ name: k.name, slug: k.slug })),
  }));

  return (
    <>
      <nav
        ref={navRef}
        aria-label="Main"
        className={`fixed inset-x-0 top-0 z-40 w-full bg-brand text-white shadow-xs transition-transform duration-200 ease-out will-change-transform md:sticky md:relative md:w-auto ${
          scrolled ? "translate-y-0 opacity-100 pointer-events-auto" : "-translate-y-full opacity-0 pointer-events-none md:translate-y-0 md:opacity-100 md:pointer-events-auto"
        }`}
      >
        <div className="container-x flex h-[42px] items-center justify-between md:hidden">
          <div className="flex items-center text-white [&>button]:text-white">
            <MobileMenu cats={mobileCats} />
          </div>
          <Link href="/" aria-label={brandName ? `${brandName} home` : "Home"} className="flex items-center py-1 text-white">
            <AnimatedLogo variant="compact" textColor="#ffffff" />
          </Link>
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className="grid h-9 w-9 place-items-center text-white hover:text-[#C49A3E] touch-manipulation"
          >
            <Search size={20} />
          </button>
        </div>
        <ul className="container-x hidden min-h-[48px] items-center justify-center gap-x-2 gap-y-1 md:flex md:flex-wrap lg:min-h-[52px] lg:gap-x-6 xl:gap-x-8">
          <li>
            <Link
              href="/shop"
              className="nav-link block px-3 py-2.5 text-[15px] font-semibold uppercase tracking-[0.08em] text-white transition-colors duration-200 hover:text-[#C49A3E] lg:px-4 lg:py-3 lg:text-base"
            >
              All Products
            </Link>
          </li>
          {top.map((c) => {
            const children = c.children;
            const groups = children.map((k) => ({ k, items: k.children }));
            const nested = groups.some((g) => g.items.length);
            const columns = nested
              ? groups.map((g) => ({ title: g.k.name, href: g.k.slug, items: g.items.length ? g.items : [] }))
              : Array.from({ length: Math.ceil(children.length / 8) }, (_, i) => ({ title: i === 0 ? "Shop by type" : "", href: null as string | null, items: children.slice(i * 8, i * 8 + 8) }));
            const isOpen = openId === c.id;
            const hasChildren = children.length > 0;
            return (
              <li
                key={c.id}
                className="md:static"
                onMouseEnter={() => { if (hasChildren) { cancelClose(); setOpenId(c.id); } }}
                onMouseLeave={() => { if (hasChildren) scheduleClose(); }}
              >
                <Link
                  href={categoryHref(c.slug)}
                  onClick={(e) => {
                    if (!hasChildren) { setOpenId(null); return; }
                    // Desktop click toggles dropdown; second click on same open trigger navigates
                    if (!isOpen) { e.preventDefault(); cancelClose(); setOpenId(c.id); }
                    else { setOpenId(null); }
                  }}
                  className={`nav-link block px-3 py-2.5 text-[15px] font-semibold uppercase tracking-[0.08em] transition-colors duration-200 hover:text-[#C49A3E] lg:px-4 lg:py-3 lg:text-base ${isOpen || pathname === categoryHref(c.slug) || pathname.startsWith(categoryHref(c.slug) + "/") ? "text-[#C49A3E]" : "text-white"}`}
                  aria-haspopup={hasChildren ? "menu" : undefined}
                  aria-expanded={hasChildren ? isOpen : undefined}
                >
                  {c.name}
                </Link>
                {hasChildren && (
                  <div
                    className={`absolute left-0 right-0 top-full z-50 w-full border-t border-[#0A3C2A]/20 bg-white shadow-2xl transition-all duration-300 ease-out ${isOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0 pointer-events-none"}`}
                    onMouseEnter={() => { cancelClose(); setOpenId(c.id); }}
                    onMouseLeave={scheduleClose}
                  >
                    <div
                      className="mx-auto grid w-full max-w-7xl gap-x-6 gap-y-6 px-4 py-6 sm:px-6 sm:gap-x-8 sm:py-7 lg:px-8 lg:gap-x-10"
                      style={{ gridTemplateColumns: `repeat(${Math.min(Math.max(columns.length, 1), 4)}, minmax(180px, 1fr))`, maxHeight: "min(70vh, 28rem)", overflowY: "auto" }}
                    >
                      {columns.map((col, i) => (
                        <div key={i} className="min-w-0">
                          {col.title && (col.href
                            ? (
                              <Link
                                href={categoryHref(col.href)}
                                onClick={() => setOpenId(null)}
                                className={`mb-3 block whitespace-normal break-words text-[13px] font-semibold uppercase tracking-[0.08em] leading-5 transition-colors duration-200 hover:text-[#C49A3E] ${pathname === categoryHref(col.href) || pathname.startsWith(categoryHref(col.href) + "/") ? "text-[#C49A3E]" : "text-[#0A3C2A]"}`}
                              >
                                {col.title}
                              </Link>
                            )
                            : <p className="mb-3 whitespace-normal break-words text-[13px] font-semibold uppercase tracking-[0.08em] leading-5 text-[#0A3C2A]">{col.title}</p>)}
                          <ul className="space-y-2.5">
                            {i === 0 && !nested && (
                              <li className="min-w-0">
                                <Link
                                  href={categoryHref(c.slug)}
                                  onClick={() => setOpenId(null)}
                                  className={`block whitespace-normal break-words text-[15px] font-semibold leading-6 transition-colors duration-200 ${pathname === categoryHref(c.slug) ? "text-[#C49A3E]" : "text-[#B8891E] hover:text-[#C49A3E]"}`}
                                >
                                  Shop all {c.name}
                                </Link>
                              </li>
                            )}
                            {col.items.map((k) => {
                              const active = pathname === categoryHref(k.slug) || pathname.startsWith(categoryHref(k.slug) + "/");
                              return (
                                <li key={k.id} className="min-w-0">
                                  <Link
                                    href={categoryHref(k.slug)}
                                    onClick={() => setOpenId(null)}
                                    className={`block whitespace-normal break-words text-[15px] font-medium leading-6 transition-all duration-200 hover:translate-x-1 hover:text-[#C49A3E] ${active ? "text-[#C49A3E]" : "text-neutral-800"}`}
                                  >
                                    {k.name}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      {searchOpen && <SearchModal popular={popular} onClose={() => setSearchOpen(false)} />}
    </>
  );
}
