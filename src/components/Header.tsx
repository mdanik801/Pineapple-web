import Link from "next/link";
import Image from "next/image";
import { getCategories, getPopularTerms } from "@/lib/data";
import { getCustomer } from "@/lib/session";
import HeaderActions from "./HeaderActions";
import MobileMenu from "./MobileMenu";
import NavCompact from "./NavCompact";

export default async function Header() {
  const [cats, me, popular] = await Promise.all([getCategories(), getCustomer(), getPopularTerms()]);
  const top = cats.filter((c) => !c.parent_id);
  const kids = (id: string) => cats.filter((c) => c.parent_id === id);

  return (
    <>
      {/* Top row: logo + search + account links (sticky on mobile only) */}
      <div className="sticky top-0 z-40 bg-white shadow-sm md:static md:shadow-none">
        <div className="container-x relative flex h-16 items-center justify-between md:h-[104px] md:items-start md:pt-3">
          <div className="md:hidden"><MobileMenu cats={top.map((c) => ({ ...c, children: kids(c.id).map((k) => ({ name: k.name, slug: k.slug })) }))} /></div>
          <Link href="/" aria-label="Pineapple home" className="absolute left-1/2 shrink-0 -translate-x-1/2 md:static md:translate-x-0">
            <Image src="/logo-full.jpg" alt="Pineapple" width={180} height={124} priority className="h-12 w-auto md:h-[88px]" />
          </Link>
          <HeaderActions name={me?.first_name ?? null} popular={popular} />
        </div>
      </div>

      {/* Nav bar (sticky, desktop) with full-width mega menu */}
      <nav aria-label="Main" className="sticky top-0 z-40 hidden bg-brand shadow-[0_1px_0_rgba(255,255,255,.06)] md:block">
        <NavCompact name={me?.first_name ?? null} popular={popular} />
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
