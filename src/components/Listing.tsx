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
      <div className="border-b border-line pb-4">
        {/* Responsive meta row: product count and sort dropdown */}
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2.5">
          <p className="text-xs sm:text-sm font-medium text-neutral-600">
            Showing <span className="font-semibold text-neutral-900">{total}</span> {total === 1 ? "product" : "products"}
            {(sp.size || hasPrice) && <span className="ml-1 text-[11px] font-normal text-gold-dark">(filtered)</span>}
          </p>
          <div className="flex items-center gap-2">
            <SortSelect value={sp.sort ?? "new"} options={SORTS.map(([value, label]) => ({ value, label, href: qs({ sort: value === "new" ? undefined : value }) }))} />
          </div>
        </div>

        {/* Filter controls row */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {types.length > 0 && (
            <FilterDropdown label="Product type">
              <ul className="max-h-60 space-y-1 overflow-y-auto">
                {types.map((t) => (
                  <li key={t.href}>
                    <Link href={t.href} className="block rounded-xs px-2.5 py-1.5 text-xs sm:text-sm hover:bg-brand-50 hover:text-brand">
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </FilterDropdown>
          )}

          {sizes.length > 0 && (
            <FilterDropdown label={sp.size ? `Size: ${sp.size}` : "Size"} active={!!sp.size}>
              <div className="flex max-w-[260px] flex-wrap gap-1.5 sm:max-w-xs sm:gap-2">
                {sizes.map((s) => (
                  <Link
                    key={s}
                    href={qs({ size: sp.size === s ? undefined : s })}
                    className={`min-w-10 border px-2.5 py-1.5 text-center text-xs sm:text-sm transition-colors rounded-xs ${sp.size === s ? "border-brand bg-brand text-white" : "border-line text-ink hover:border-brand"}`}
                  >
                    {s}
                  </Link>
                ))}
              </div>
            </FilterDropdown>
          )}

          <FilterDropdown label="Price" active={hasPrice}>
            <form method="get" action={basePath} className="flex flex-wrap sm:flex-nowrap items-end gap-2">
              {hidden.map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
              <div className="flex-1 min-w-[70px]">
                <label className="label text-[11px]" htmlFor="min">From ৳</label>
                <input id="min" name="min" type="number" min={0} defaultValue={sp.min} className="input !w-full !py-2 text-xs" />
              </div>
              <div className="flex-1 min-w-[70px]">
                <label className="label text-[11px]" htmlFor="max">To ৳</label>
                <input id="max" name="max" type="number" min={0} defaultValue={sp.max} className="input !w-full !py-2 text-xs" />
              </div>
              <button className="btn btn-primary !px-3.5 !py-2 text-xs shrink-0">Go</button>
            </form>
            {hasPrice && (
              <Link href={qs({ min: undefined, max: undefined })} className="mt-2.5 inline-block text-[11px] sm:text-xs text-gold-dark underline">
                Clear price
              </Link>
            )}
          </FilterDropdown>

          {(sp.size || hasPrice) && (
            <Link
              href={qs({ size: undefined, min: undefined, max: undefined })}
              className="inline-flex items-center gap-1 rounded-xs border border-gold-dark/30 bg-gold/10 px-2.5 py-1.5 text-[11px] font-semibold text-gold-dark hover:bg-gold/20 transition-colors"
            >
              Clear all
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 sm:mt-8">
        {products.length === 0 ? (
          <div className="py-16 sm:py-20 text-center text-muted px-4">
            <p className="text-base sm:text-lg">No products found.</p>
            <Link href="/shop" className="btn btn-primary mt-6 !px-6 !py-3 text-xs sm:text-sm">Browse all products</Link>
          </div>
        ) : <ProductGrid products={products} />}
      </div>

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-10 sm:mt-14 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          {page > 1 && (
            <Link
              href={qs({ page: page - 1 === 1 ? undefined : String(page - 1) })}
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
                href={qs({ page: p === 1 ? undefined : String(p) })}
                aria-current={p === page ? "page" : undefined}
                className={`grid h-9 min-w-9 place-items-center border px-2 text-xs font-medium transition-colors sm:h-10 sm:min-w-10 sm:px-3 sm:text-sm ${p === page ? "border-brand bg-brand text-white" : "border-line text-ink hover:border-brand"}`}
              >
                {p}
              </Link>
            )
          )}

          {page < pages && (
            <Link
              href={qs({ page: String(page + 1) })}
              className="flex h-9 items-center justify-center border border-line px-2.5 text-xs font-medium text-ink transition-colors hover:border-brand sm:h-10 sm:px-3.5 sm:text-sm"
              aria-label="Next page"
            >
              Next →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
