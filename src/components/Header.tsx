import Link from "next/link";
import Image from "next/image";
import { getCategories, getPopularTerms, getSettings } from "@/lib/data";
import { getCustomer } from "@/lib/session";
import HeaderActions from "./HeaderActions";
import MobileMenu from "./MobileMenu";
import NavCompact from "./NavCompact";

export default async function Header() {
  const [cats, me, popular, settings] = await Promise.all([getCategories(), getCustomer(), getPopularTerms(), getSettings()]);
  const top = cats.filter((c) => !c.parent_id);
  const kids = (id: string) => cats.filter((c) => c.parent_id === id);
  const brandName = settings?.brand_name?.trim() || settings?.company_name?.trim() || "";
  const logo = settings?.company_logo?.trim() || "";

  return (
    <>
      {/* Top row: logo + search + account links (sticky on mobile only) */}
      <div className="sticky top-0 z-40 border-b border-black/10 bg-white md:static">
        <div className="container-x relative flex h-[68px] items-center justify-between gap-3 md:h-[82px]">
          <div className="md:hidden"><MobileMenu cats={top.map((c) => ({ ...c, children: kids(c.id).map((k) => ({ name: k.name, slug: k.slug })) }))} /></div>
          <Link href="/" aria-label={brandName ? `${brandName} home` : "Home"} className="absolute left-1/2 flex max-w-[42vw] -translate-x-1/2 items-center md:static md:max-w-[220px] md:translate-x-0">
            {logo
              ? <Image src={logo} alt={brandName} width={190} height={76} priority unoptimized={logo.toLowerCase().endsWith(".svg")} className="h-10 w-auto max-w-full object-contain md:h-12" />
              : brandName && <span className="truncate font-serif text-lg font-medium tracking-wide text-neutral-950 md:text-xl">{brandName}</span>}
          </Link>
          <HeaderActions name={me?.first_name ?? null} popular={popular} />
        </div>
      </div>

      {/* Nav bar (sticky, desktop) with full-width mega menu */}
      <nav aria-label="Main" className="sticky top-0 z-40 hidden bg-[#111111] text-white md:block">
        <NavCompact name={me?.first_name ?? null} popular={popular} brandName={brandName} logoUrl={logo} />
        <ul className="container-x flex items-center justify-center gap-1 lg:gap-4">
          <li className="group">
            <Link href="/shop?sort=new" className="nav-link block px-4 py-4 text-[13px] font-medium uppercase tracking-[.08em] text-gold">New Arrivals</Link>
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
                <Link href={`/category/${c.slug}`} className="nav-link block px-4 py-4 text-[13px] font-medium uppercase tracking-[.08em] text-white group-hover:text-gold">{c.name}</Link>
                {children.length > 0 && (
                  <div className="invisible absolute inset-x-0 top-full -translate-y-2 border-t border-white/10 bg-white opacity-0 shadow-2xl transition-all duration-300 ease-out group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                    <div className="container-x grid gap-x-10 gap-y-8 py-9" style={{ gridTemplateColumns: `repeat(${Math.min(Math.max(columns.length, 1), 4) + 0}, minmax(0, 1fr))`, paddingInline: "clamp(1rem, 8vw, 8rem)" }}>
                      {columns.map((col, i) => (
                        <div key={i}>
                          {col.title && (col.href
                            ? <Link href={`/category/${col.href}`} className="mb-3 block text-xs font-bold uppercase tracking-widest text-brand hover:text-gold">{col.title}</Link>
                            : <p className="mb-3 text-xs font-bold uppercase tracking-widest text-brand">{col.title}</p>)}
                          <ul className="space-y-2.5">
                            {i === 0 && !nested && <li><Link href={`/category/${c.slug}`} className="text-sm font-semibold text-gold-dark hover:underline">Shop all {c.name}</Link></li>}
                            {col.items.map((k) => (
                              <li key={k.id}><Link href={`/category/${k.slug}`} className="text-sm text-ink/80 transition-all duration-200 hover:translate-x-1 hover:text-brand">{k.name}</Link></li>
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
    </>
  );
}
