"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { categoryHref } from "@/lib/slug";
import MobileMenu from "./MobileMenu";
import AnimatedLogo from "./AnimatedLogo";

type CatNode = {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string; children: { id: string; name: string; slug: string }[] }[];
};

export default function HeaderNav({
  brandName,
  top,
}: {
  brandName: string;
  top: CatNode[];
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const mobileCats = top.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    children: c.children.map((k) => ({ name: k.name, slug: k.slug })),
  }));

  return (
    <nav
      aria-label="Main"
      className={`fixed inset-x-0 top-0 z-40 w-full bg-brand text-white shadow-xs transition-transform duration-200 ease-out will-change-transform md:sticky md:w-auto ${
        scrolled ? "translate-y-0 opacity-100 pointer-events-auto" : "-translate-y-full opacity-0 pointer-events-none md:translate-y-0 md:opacity-100 md:pointer-events-auto"
      }`}
    >
      <div className="container-x flex h-[42px] items-center justify-between md:hidden">
        <div className="flex items-center text-white [&_button]:text-white">
          <MobileMenu cats={mobileCats} />
        </div>
        <Link href="/" aria-label={brandName ? `${brandName} home` : "Home"} className="flex items-center py-1 text-white">
          <AnimatedLogo variant="compact" textColor="#ffffff" />
        </Link>
        <div className="w-9" aria-hidden="true" />
      </div>
      <ul className="container-x hidden items-center justify-center gap-1.5 md:flex lg:gap-5 xl:gap-7">
        <li className="group">
          <Link
            href="/shop?sort=new"
            className="nav-link block px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[.05em] text-[#C49A3E] transition-colors hover:text-[#deb250] lg:px-3.5 lg:py-2 lg:text-[12px]"
          >
            New Arrivals
          </Link>
        </li>
        {top.map((c) => {
          const children = c.children;
          const groups = children.map((k) => ({ k, items: k.children }));
          const nested = groups.some((g) => g.items.length);
          const columns = nested
            ? groups.map((g) => ({ title: g.k.name, href: g.k.slug, items: g.items.length ? g.items : [] }))
            : Array.from({ length: Math.ceil(children.length / 8) }, (_, i) => ({ title: i === 0 ? "Shop by type" : "", href: null as string | null, items: children.slice(i * 8, i * 8 + 8) }));
          return (
            <li key={c.id} className="group">
              <Link
                href={categoryHref(c.slug)}
                className="nav-link block px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[.05em] text-white transition-colors hover:text-[#C49A3E] lg:px-3.5 lg:py-2 lg:text-[12px]"
              >
                {c.name}
              </Link>
              {children.length > 0 && (
                <div className="invisible absolute inset-x-0 top-full -translate-y-2 border-t border-[#0A3C2A]/20 bg-white opacity-0 shadow-2xl transition-all duration-300 ease-out group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                  <div className="container-x grid gap-x-8 gap-y-6 py-7 sm:gap-x-10 sm:gap-y-8 sm:py-9" style={{ gridTemplateColumns: `repeat(${Math.min(Math.max(columns.length, 1), 4) + 0}, minmax(0, 1fr))`, paddingInline: "clamp(1rem, 6vw, 8rem)" }}>
                    {columns.map((col, i) => (
                      <div key={i}>
                        {col.title && (col.href
                          ? <Link href={categoryHref(col.href)} className="mb-3 block text-xs font-bold uppercase tracking-widest text-[#0A3C2A] hover:text-[#C49A3E]">{col.title}</Link>
                          : <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#0A3C2A]">{col.title}</p>)}
                        <ul className="space-y-2.5">
                          {i === 0 && !nested && <li><Link href={categoryHref(c.slug)} className="text-sm font-semibold text-[#a37d2b] hover:underline">Shop all {c.name}</Link></li>}
                          {col.items.map((k) => (
                            <li key={k.id}><Link href={categoryHref(k.slug)} className="text-sm text-ink/80 transition-all duration-200 hover:translate-x-1 hover:text-[#0A3C2A]">{k.name}</Link></li>
                          ))}
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
  );
}
