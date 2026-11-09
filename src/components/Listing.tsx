import Link from "next/link";
import ProductGrid from "./ProductGrid";
import FilterDropdown from "./FilterDropdown";
import SortSelect from "./SortSelect";
import { listProducts, getSizes } from "@/lib/data";

export type SP = { q?: string; sort?: string; min?: string; max?: string; page?: string; size?: string };
export type TypeLink = { name: string; href: string };

const SORTS = [
  ["new", "Date, new to old"], ["price-asc", "Price, low to high"], ["price-desc", "Price, high to low"], ["name", "Name, A–Z"],
] as const;

export default async function Listing({ basePath, sp, categoryIds, types = [] }: { basePath: string; sp: SP; categoryIds?: string[]; types?: TypeLink[] }) {
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const num = (v?: string) => (v && !isNaN(Number(v)) ? Number(v) : undefined);
  const sort = !sp.sort || sp.sort === "new" ? undefined : sp.sort;
  const [{ products, total, pages }, sizes] = await Promise.all([
    listProducts({ categoryIds, q: sp.q, sort, size: sp.size, min: num(sp.min), max: num(sp.max), page, limit: 20 }),
    getSizes(),
  ]);

  const qs = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, page: undefined, ...over })) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const hasPrice = !!(sp.min || sp.max);
  const hidden = Object.entries({ q: sp.q, sort: sp.sort, size: sp.size }).filter(([, v]) => v);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-4 sm:gap-3">
        {types.length > 0 && (
          <FilterDropdown label="Product type">
            <ul className="space-y-1">{types.map((t) => <li key={t.href}><Link href={t.href} className="block px-2 py-1.5 text-sm hover:bg-brand-50 hover:text-brand">{t.name}</Link></li>)}</ul>
          </FilterDropdown>
        )}
        {sizes.length > 0 && (
          <FilterDropdown label={sp.size ? `Size: ${sp.size}` : "Size"} active={!!sp.size}>
            <div className="flex max-w-xs flex-wrap gap-2">
              {sizes.map((s) => (
                <Link key={s} href={qs({ size: sp.size === s ? undefined : s })} className={`min-w-11 border px-3 py-1.5 text-center text-sm transition-colors ${sp.size === s ? "border-brand bg-brand text-white" : "border-line hover:border-brand"}`}>{s}</Link>
              ))}
            </div>
          </FilterDropdown>
        )}
        <FilterDropdown label="Price" active={hasPrice}>
          <form method="get" action={basePath} className="flex items-end gap-2">
            {hidden.map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
            <div><label className="label" htmlFor="min">From ৳</label><input id="min" name="min" type="number" min={0} defaultValue={sp.min} className="input !w-24 !py-2" /></div>
            <div><label className="label" htmlFor="max">To ৳</label><input id="max" name="max" type="number" min={0} defaultValue={sp.max} className="input !w-24 !py-2" /></div>
            <button className="btn btn-primary !px-4 !py-3">Go</button>
          </form>
          {hasPrice && <Link href={qs({ min: undefined, max: undefined })} className="mt-3 inline-block text-xs text-gold-dark underline">Clear price</Link>}
        </FilterDropdown>
        {(sp.size || hasPrice) && <Link href={qs({ size: undefined, min: undefined, max: undefined })} className="text-xs font-semibold text-gold-dark underline">Clear all</Link>}
        <div className="ml-auto flex items-center gap-3">
          <p className="hidden text-sm text-muted sm:block">{total} product{total === 1 ? "" : "s"}</p>
          <SortSelect value={sp.sort ?? "new"} options={SORTS.map(([value, label]) => ({ value, label, href: qs({ sort: value === "new" ? undefined : value }) }))} />
        </div>
      </div>

      <div className="mt-8">
        {products.length === 0 ? (
          <div className="py-20 text-center text-muted">
            <p className="text-lg">No products found.</p>
            <Link href="/shop" className="btn btn-primary mt-6">Browse all products</Link>
          </div>
        ) : <ProductGrid products={products} />}
      </div>

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-12 flex flex-wrap justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link key={n} href={qs({ page: n === 1 ? undefined : String(n) })} aria-current={n === page ? "page" : undefined}
              className={`grid h-10 min-w-10 place-items-center border px-3 text-sm ${n === page ? "border-brand bg-brand text-white" : "border-line hover:border-brand"}`}>{n}</Link>
          ))}
        </nav>
      )}
    </div>
  );
}
