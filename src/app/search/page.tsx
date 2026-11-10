import type { Metadata } from "next";
import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";
import FilterDropdown from "@/components/FilterDropdown";
import SortSelect from "@/components/SortSelect";
import Facet from "@/components/Facet";
import SidebarShell from "@/components/SidebarShell";
import PriceFilter from "@/components/PriceFilter";
import SmartImage from "@/components/SmartImage";
import { listProducts, getSizes, getCategories, descendantIds, searchFacets, searchCollections } from "@/lib/data";

export const metadata: Metadata = { title: "Search" };

type SP = { q?: string; cat?: string; avail?: string; min?: string; max?: string; size?: string; sort?: string; page?: string; tab?: string };

const SORTS = [["rel", "Relevance"], ["new", "Date, new to old"], ["price-asc", "Price, low to high"], ["price-desc", "Price, high to low"], ["name", "Name, A–Z"]] as const;

function paginationRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const delta = 1;
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);
  const range: (number | "...")[] = [1];
  if (left > 2) range.push("...");
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push("...");
  range.push(total);
  return range;
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const tab = sp.tab === "collections" ? "collections" : "products";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const num = (v?: string) => (v && !isNaN(Number(v)) ? Number(v) : undefined);

  const [cats, sizes, facets, collections] = await Promise.all([getCategories(), getSizes(), searchFacets(q), searchCollections(q)]);
  const cat = cats.find((c) => c.slug === sp.cat);
  const avail = sp.avail === "in" || sp.avail === "out" ? sp.avail : undefined;
  const sort = sp.sort === "price-asc" || sp.sort === "price-desc" || sp.sort === "name" ? sp.sort : undefined;

  const { products, total, pages } = await listProducts({
    q, categoryIds: cat ? descendantIds(cats, cat.id) : undefined, avail, size: sp.size,
    min: num(sp.min), max: num(sp.max), sort, page, limit: 20,
  });

  const base: Record<string, string | undefined> = { q, cat: sp.cat, avail, min: sp.min, max: sp.max, size: sp.size, sort: sp.sort };
  const href = (over: Record<string, string | undefined> = {}) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...base, ...over })) if (v) p.set(k, v);
    return `/search?${p.toString()}`;
  };
  const clean = Object.fromEntries(Object.entries({ q, cat: sp.cat, avail, size: sp.size, sort: sp.sort }).filter(([, v]) => v)) as Record<string, string>;

  const top = cats.filter((c) => !c.parent_id);
  const countFor = (id: string) => descendantIds(cats, id).reduce((s, i) => s + (facets.byCategory.get(i) ?? 0), 0);
  const filtered = !!(cat || avail || sp.size || sp.min || sp.max);
  const link = (active: boolean) => `block py-1.5 text-sm transition-all duration-200 hover:translate-x-1 hover:text-brand ${active ? "font-semibold text-brand" : "text-ink/80"}`;

  return (
    <div className="container-x py-10">
      <h1 className="mb-10 text-center text-xl uppercase tracking-[.14em] md:text-2xl">
        {q ? <>{total} result{total === 1 ? "" : "s"} found for “{q}”</> : "Search our store"}
      </h1>

      <div className="grid gap-8 lg:grid-cols-[250px_1fr] lg:gap-12">
        <SidebarShell>
          <Facet title="Categories">
            <ul>
              <li><Link href={href({ cat: undefined, page: undefined })} className={link(!cat)}>All categories <span className="text-muted">({facets.total})</span></Link></li>
              {top.map((c) => (
                <li key={c.id}>
                  <Link href={href({ cat: c.slug })} className={link(cat?.id === c.id)}>{c.name} <span className="text-muted">({countFor(c.id)})</span></Link>
                  {cats.filter((k) => k.parent_id === c.id).length > 0 && (cat?.id === c.id || cats.find((x) => x.id === cat?.parent_id)?.id === c.id) && (
                    <ul className="ml-3 border-l border-line pl-3">
                      {cats.filter((k) => k.parent_id === c.id).map((k) => <li key={k.id}><Link href={href({ cat: k.slug })} className={link(cat?.id === k.id)}>{k.name} <span className="text-muted">({countFor(k.id)})</span></Link></li>)}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </Facet>
          <Facet title="Availability">
            {([["in", "In Stock", facets.inStock], ["out", "Out Of Stock", facets.outStock]] as const).map(([v, label, n]) => (
              <Link key={v} href={href({ avail: avail === v ? undefined : v, page: undefined })} className="flex items-center gap-3 py-1.5 text-sm hover:text-brand">
                <span className={`grid h-4 w-4 place-items-center border transition-colors ${avail === v ? "border-brand bg-brand text-white" : "border-line"}`}>{avail === v && <svg viewBox="0 0 12 12" className="h-3 w-3"><path d="M2 6.5l2.5 2.5L10 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>}</span>
                {label}({n})
              </Link>
            ))}
          </Facet>
          <Facet title="Price">
            <PriceFilter basePath="/search" params={clean} bound={facets.maxPrice} min={num(sp.min)} max={num(sp.max)} key={`${sp.min}-${sp.max}`} />
          </Facet>
        </SidebarShell>

        <div className="min-w-0">
          <div className="flex gap-8 border-b border-line">
            {([["products", "Products", facets.total], ["collections", "Collections", collections.length]] as const).map(([k, label, n]) => (
              <Link key={k} href={href({ tab: k === "products" ? undefined : k, page: undefined })} className={`-mb-px border-b-2 pb-3 text-lg transition-colors ${tab === k ? "border-brand font-semibold text-ink" : "border-transparent text-muted hover:text-brand"}`}>
                {label} <span className="text-xs text-muted">{n}</span>
              </Link>
            ))}
          </div>

          {tab === "collections" ? (
            collections.length === 0 ? <p className="py-16 text-center text-muted">No collections found for “{q}”.</p> : (
              <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
                {collections.map((c) => (
                  <li key={c.id}>
                    <Link href={`/collection/${c.slug}`} className="group block">
                      <div className="relative aspect-[4/5] overflow-hidden bg-brand-50"><SmartImage src={c.image_url} alt={c.name} className="object-cover transition-[scale] duration-[1100ms] ease-[cubic-bezier(.19,1,.22,1)] group-hover:scale-110" /></div>
                      <p className="mt-3 text-center text-sm font-medium tracking-wider group-hover:text-brand">{c.name}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <>
              <div className="mt-6 flex flex-wrap items-center gap-3 border-b border-line pb-5">
                <FilterDropdown label={cat ? cat.name : "Product type"} active={!!cat}>
                  <ul className="max-h-72 space-y-1 overflow-y-auto">
                    {cats.map((c) => <li key={c.id}><Link href={href({ cat: c.slug, page: undefined })} className={`block px-2 py-1.5 text-sm hover:bg-brand-50 hover:text-brand ${c.parent_id ? "pl-5" : "font-semibold"}`}>{c.name} <span className="text-muted">({countFor(c.id)})</span></Link></li>)}
                  </ul>
                </FilterDropdown>
                {sizes.length > 0 && (
                  <FilterDropdown label={sp.size ? `Size: ${sp.size}` : "Size"} active={!!sp.size}>
                    <div className="flex max-w-xs flex-wrap gap-2">
                      {sizes.map((s) => <Link key={s} href={href({ size: sp.size === s ? undefined : s, page: undefined })} className={`min-w-11 border px-3 py-1.5 text-center text-sm transition-colors ${sp.size === s ? "border-brand bg-brand text-white" : "border-line hover:border-brand"}`}>{s}</Link>)}
                    </div>
                  </FilterDropdown>
                )}
                {filtered && <Link href={href({ cat: undefined, avail: undefined, size: undefined, min: undefined, max: undefined, page: undefined })} className="text-xs font-semibold text-gold-dark underline">Clear all</Link>}
                <div className="ml-auto"><SortSelect value={sp.sort && sort ? sp.sort : "rel"} options={SORTS.map(([value, label]) => ({ value, label, href: href({ sort: value === "rel" ? undefined : value, page: undefined }) }))} /></div>
              </div>

              <div className="mt-8">
                {products.length === 0 ? (
                  <div className="py-20 text-center text-muted">
                    <p className="text-lg">{q ? `No products found for “${q}”.` : "Type something to search."}</p>
                    {filtered && <Link href={href({ cat: undefined, avail: undefined, size: undefined, min: undefined, max: undefined })} className="btn btn-outline mt-5">Clear filters</Link>}
                    <Link href="/shop" className="btn btn-primary ml-2 mt-5">Browse all products</Link>
                  </div>
                ) : <ProductGrid products={products} />}
              </div>

              {pages > 1 && (
                <nav aria-label="Pagination" className="mt-10 sm:mt-14 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                  {page > 1 && (
                    <Link
                      href={href({ page: page - 1 === 1 ? undefined : String(page - 1) })}
                      className="flex h-9 items-center justify-center border border-line px-2.5 text-xs font-medium text-ink transition-colors hover:border-brand sm:h-10 sm:px-3.5 sm:text-sm"
                      aria-label="Previous page"
                    >
                      ← Prev
                    </Link>
                  )}
                  {paginationRange(page, pages).map((p, idx) =>
                    p === "..." ? (
                      <span key={`dots-${idx}`} className="grid h-9 w-7 place-items-center text-xs text-muted sm:h-10 sm:w-8 sm:text-sm">
                        …
                      </span>
                    ) : (
                      <Link
                        key={p}
                        href={href({ page: p === 1 ? undefined : String(p) })}
                        aria-current={p === page ? "page" : undefined}
                        className={`grid h-9 min-w-9 place-items-center border px-2 text-xs font-medium transition-colors sm:h-10 sm:min-w-10 sm:px-3 sm:text-sm ${p === page ? "border-brand bg-brand text-white" : "border-line text-ink hover:border-brand"}`}
                      >
                        {p}
                      </Link>
                    )
                  )}
                  {page < pages && (
                    <Link
                      href={href({ page: String(page + 1) })}
                      className="flex h-9 items-center justify-center border border-line px-2.5 text-xs font-medium text-ink transition-colors hover:border-brand sm:h-10 sm:px-3.5 sm:text-sm"
                      aria-label="Next page"
                    >
                      Next →
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
