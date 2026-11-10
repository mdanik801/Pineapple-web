import Link from "next/link";
import { getCategories, getPopularTerms, getSettings } from "@/lib/data";
import { getCustomer } from "@/lib/session";
import HeaderActions from "./HeaderActions";
import MobileMenu from "./MobileMenu";
import AnimatedLogo from "./AnimatedLogo";
import NavCompact from "./NavCompact";

export default async function Header() {
  const [cats, me, popular, settings] = await Promise.all([getCategories(), getCustomer(), getPopularTerms(), getSettings()]);
  const top = cats.filter((c) => !c.parent_id);
  const kids = (id: string) => cats.filter((c) => c.parent_id === id);
  const brandName = settings?.brand_name?.trim() || settings?.company_name?.trim() || "Pineapple";
  const supportPhone = settings?.support_phone?.trim() || settings?.phone?.trim() || "01777702000";

  return (
    <header className="w-full">
      {/* 1. Top Announcement Bar (matching reference dark navy bar - slim compact height) */}
      <div className="bg-[#1c2237] py-1 sm:py-1.5 px-3 text-center text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.16em] text-white/95 leading-normal">
        Step Into The Festive Season With {brandName}
      </div>

      {/* 2. Main Header Row (Logo, Search Pill with Categories, Phone & Action Icons) */}
      <div className="sticky top-0 z-40 border-b border-black/5 bg-white md:static md:border-b-0">
        <div className="container-x relative flex h-[58px] sm:h-[62px] items-center justify-between gap-2 sm:gap-4 md:h-[72px] lg:h-[76px]">
          {/* Mobile hamburger menu: Left side */}
          <div className="flex items-center shrink-0 z-10 md:hidden">
            <MobileMenu cats={top.map((c) => ({ ...c, children: kids(c.id).map((k) => ({ name: k.name, slug: k.slug })) }))} />
          </div>

          {/* Mobile Animated Logo: Exactly centered horizontally relative to full mobile viewport */}
          <Link
            href="/"
            aria-label={brandName ? `${brandName} home` : "Home"}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center shrink-0 z-10 md:hidden"
          >
            <AnimatedLogo variant="mobile" />
          </Link>

          {/* Desktop & Tablet Animated Logo (Left side) */}
          <Link
            href="/"
            aria-label={brandName ? `${brandName} home` : "Home"}
            className="hidden md:flex items-center shrink-0 py-1"
          >
            <AnimatedLogo variant="desktop" />
          </Link>

          {/* Center Search Pill & Right Actions (Phone + User, Wishlist, Cart) */}
          <HeaderActions
            name={me?.first_name ?? null}
            popular={popular}
            categories={top.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
            supportPhone={supportPhone}
          />
        </div>
      </div>

      {/* 3. Category Nav bar (sticky on desktop) with mega menu - slim compact height */}
      <nav aria-label="Main" className="sticky top-0 z-40 hidden bg-[#0A3C2A] text-white shadow-xs md:block">
        <NavCompact name={me?.first_name ?? null} popular={popular} brandName={brandName} />
        <ul className="container-x flex items-center justify-center gap-1.5 lg:gap-5 xl:gap-7">
          <li className="group">
            <Link
              href="/shop?sort=new"
              className="nav-link block px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[.05em] text-[#C49A3E] transition-colors hover:text-[#deb250] lg:px-3.5 lg:py-2 lg:text-[12px]"
            >
              New Arrivals
            </Link>
          </li>
          {top.map((c) => {
            const children = kids(c.id);
            const groups = children.map((k) => ({ k, items: kids(k.id) }));
            const nested = groups.some((g) => g.items.length);
            const columns = nested
              ? groups.map((g) => ({ title: g.k.name, href: g.k.slug, items: g.items.length ? g.items : [] }))
              : Array.from({ length: Math.ceil(children.length / 8) }, (_, i) => ({ title: i === 0 ? "Shop by type" : "", href: null as string | null, items: children.slice(i * 8, i * 8 + 8) }));
            return (
              <li key={c.id} className="group">
                <Link
                  href={`/category/${c.slug}`}
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
                            ? <Link href={`/category/${col.href}`} className="mb-3 block text-xs font-bold uppercase tracking-widest text-[#0A3C2A] hover:text-[#C49A3E]">{col.title}</Link>
                            : <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#0A3C2A]">{col.title}</p>)}
                          <ul className="space-y-2.5">
                            {i === 0 && !nested && <li><Link href={`/category/${c.slug}`} className="text-sm font-semibold text-[#a37d2b] hover:underline">Shop all {c.name}</Link></li>}
                            {col.items.map((k) => (
                              <li key={k.id}><Link href={`/category/${k.slug}`} className="text-sm text-ink/80 transition-all duration-200 hover:translate-x-1 hover:text-[#0A3C2A]">{k.name}</Link></li>
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
    </header>
  );
}
