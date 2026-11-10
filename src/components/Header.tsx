import Link from "next/link";
import Image from "next/image";
import { getCategories, getPopularTerms, getSettings } from "@/lib/data";
import { getCustomer } from "@/lib/session";
import HeaderActions from "./HeaderActions";
import MobileMenu from "./MobileMenu";
import MobileAnimatedLogo from "./MobileAnimatedLogo";
import NavCompact from "./NavCompact";

export default async function Header() {
  const [cats, me, popular, settings] = await Promise.all([getCategories(), getCustomer(), getPopularTerms(), getSettings()]);
  const top = cats.filter((c) => !c.parent_id);
  const kids = (id: string) => cats.filter((c) => c.parent_id === id);
  const brandName = settings?.brand_name?.trim() || settings?.company_name?.trim() || "Pineapple";
  const logo = settings?.company_logo?.trim() || "/logo-full.jpg";

  return (
    <header className="w-full">
      {/* Top row: logo + search + account links */}
      <div className="sticky top-0 z-40 border-b border-black/5 bg-white md:static md:border-b-0">
        <div className="container-x relative flex h-[62px] sm:h-[68px] items-center justify-between gap-1.5 sm:gap-3 md:h-auto md:py-3.5 lg:py-4">
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
            <MobileAnimatedLogo />
          </Link>

          {/* Desktop & Tablet Logo (Kept unchanged) */}
          <Link
            href="/"
            aria-label={brandName ? `${brandName} home` : "Home"}
            className="hidden md:flex items-center shrink-0"
          >
            {logo ? (
              <Image
                src={logo}
                alt={brandName}
                width={200}
                height={85}
                priority
                unoptimized={logo.toLowerCase().endsWith(".svg")}
                className="h-16 w-auto max-w-[200px] object-contain lg:h-[72px]"
              />
            ) : (
              <span className="truncate font-serif text-lg sm:text-xl font-bold tracking-wide text-[#0A3C2A] md:text-2xl">{brandName}</span>
            )}
          </Link>

          {/* Right side: Desktop Search + Actions, Mobile Search Button */}
          <HeaderActions name={me?.first_name ?? null} popular={popular} />
        </div>
      </div>

      {/* Nav bar (sticky, desktop) with full-width mega menu */}
      <nav aria-label="Main" className="sticky top-0 z-40 hidden bg-[#0A3C2A] text-white shadow-sm md:block">
        <NavCompact name={me?.first_name ?? null} popular={popular} brandName={brandName} logoUrl={logo} />
        <ul className="container-x flex items-center justify-center gap-2 lg:gap-6 xl:gap-8">
          <li className="group">
            <Link
              href="/shop?sort=new"
              className="nav-link block px-3 py-3 text-[12px] font-bold uppercase tracking-[.06em] text-[#C49A3E] transition-colors hover:text-[#deb250] lg:px-4 lg:py-3.5 lg:text-[13px]"
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
                  className="nav-link block px-3 py-3 text-[12px] font-bold uppercase tracking-[.06em] text-white transition-colors hover:text-[#C49A3E] lg:px-4 lg:py-3.5 lg:text-[13px]"
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
