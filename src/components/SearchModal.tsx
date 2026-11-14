"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Clock, TrendingUp, ArrowRight, AlertTriangle, RotateCcw } from "lucide-react";
import { searchProducts, getSuggestedProducts, type SearchActionResult } from "@/actions/catalog";
import SmartImage from "./SmartImage";
import { money } from "@/lib/format";
import type { ProductCardData } from "@/lib/data";
import { normalizeSearchQuery } from "@/lib/search-utils";

const KEY = "pineapple-recent-searches";
const read = (): string[] => {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]").slice(0, 8); } catch { return []; }
};
const write = (v: string[]) => {
  try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {}
};

export default function SearchModal({ popular, onClose }: { popular: string[]; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<string[]>(read);
  const [featured, setFeatured] = useState<ProductCardData[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [res, setRes] = useState<(SearchActionResult & { for: string }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const reqId = useRef(0);
  const term = normalizeSearchQuery(q);

  useEffect(() => {
    let live = true;
    setFeaturedLoading(true);
    getSuggestedProducts(8)
      .then((p) => { if (live) setFeatured(Array.isArray(p) ? p.slice(0, 8) : []); })
      .catch(() => { if (live) setFeatured([]); })
      .finally(() => { if (live) setFeaturedLoading(false); });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = prevOverflow; window.removeEventListener("keydown", esc); };
  }, [onClose]);

  useEffect(() => {
    if (!term) {
      setLoading(false);
      setRes(null);
      return;
    }
    const currentId = ++reqId.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const out = await searchProducts(term, 8);
        if (currentId !== reqId.current) return;
        setRes({ ...out, for: term });
      } catch {
        if (currentId !== reqId.current) return;
        setRes({ items: [], query: term, error: "Search is temporarily unavailable. Please try again.", unavailable: true, for: term });
      } finally {
        if (currentId === reqId.current) setLoading(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [term, retryTick]);

  function remember(s: string) {
    const v = normalizeSearchQuery(s);
    if (!v) return;
    const next = [v, ...recent.filter((r) => r.toLowerCase() !== v.toLowerCase())].slice(0, 8);
    setRecent(next);
    write(next);
  }
  function submit(s: string) {
    const v = normalizeSearchQuery(s);
    if (!v) return;
    remember(v);
    onClose();
    router.push(`/search?q=${encodeURIComponent(v)}`);
  }
  const removeRecent = (s: string) => { const n = recent.filter((r) => r !== s); setRecent(n); write(n); };
  const clearRecent = () => { setRecent([]); write([]); };

  const searching = term.length >= 1;
  const ready = searching && !loading && res?.for === term;
  const hasError = ready && !!res?.error;
  const items = ready && !hasError ? (res?.items ?? []) : [];
  const pick = () => { remember(term || q); onClose(); };
  const chip = "group flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs sm:text-sm shadow-2xs transition-all duration-300 hover:border-brand hover:bg-brand hover:text-white";

  return (
    <div role="dialog" aria-modal="true" aria-label="Search" className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs [animation:fadeIn_.3s_ease]" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[92vh] overflow-y-auto overflow-x-hidden rounded-b-2xl bg-white shadow-2xl [animation:panelDown_.4s_cubic-bezier(.22,1,.36,1)]">
        <div className="mx-auto w-full max-w-3xl px-4 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-6">
          <form onSubmit={(e) => { e.preventDefault(); submit(term); }} className="flex items-center gap-2 sm:gap-3">
            <div className="group flex flex-1 items-center gap-2.5 rounded-full border border-line bg-[#f6f8f7] pl-4 pr-1.5 shadow-inner transition-all duration-300 focus-within:border-brand focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/10 sm:pl-5 sm:pr-2">
              <Search size={18} className="shrink-0 text-brand sm:size-[20px]" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products, brand, SKU, category…"
                aria-label="Search products"
                className="w-full min-w-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted/80 sm:py-3.5 sm:text-base"
              />
              {q ? (
                <button type="button" aria-label="Clear search" onClick={() => { setQ(""); setRes(null); }} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted hover:bg-brand-50 hover:text-brand touch-manipulation sm:h-9 sm:w-9"><X size={16} /></button>
              ) : <kbd className="mr-2 hidden shrink-0 rounded border border-line bg-white px-2 py-0.5 text-[10px] font-semibold text-muted sm:block">ESC</kbd>}
              <button className="btn btn-primary hidden !rounded-full !px-5 !py-2.5 text-xs sm:inline-flex" disabled={!term}>Search</button>
            </div>
            <button type="button" aria-label="Close search" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-white text-neutral-800 transition-all hover:border-brand hover:bg-brand hover:text-white touch-manipulation sm:h-11 sm:w-11"><X size={19} /></button>
          </form>

          <div className="mt-3 overflow-hidden rounded-xl border border-line bg-white shadow-sm">
            {!searching ? (
              <div className="max-h-[65vh] overflow-y-auto">
                {recent.length > 0 && (
                  <section className="border-b border-line p-3 sm:p-4">
                    <div className="mb-2 flex items-center justify-between"><h2 className="text-xs font-bold uppercase tracking-wider text-brand">Recent</h2><button onClick={clearRecent} className="text-[11px] font-semibold text-gold-dark hover:underline">Clear all</button></div>
                    <ul className="flex flex-wrap gap-1.5 sm:gap-2">
                      {recent.map((r) => (
                        <li key={r} className="group/c flex items-center rounded-full border border-line bg-white pl-3.5 pr-1 text-xs shadow-2xs hover:border-brand">
                          <button onClick={() => submit(r)} className="flex items-center gap-1.5 py-1.5"><Clock size={12} className="text-gold-dark" />{r}</button>
                          <button aria-label={`Remove ${r}`} onClick={() => removeRecent(r)} className="ml-1 grid h-6 w-6 place-items-center rounded-full text-muted hover:bg-red-50 hover:text-red-600"><X size={12} /></button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {popular.length > 0 && (
                  <section className="border-b border-line p-3 sm:p-4">
                    <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand">Popular searches</h2>
                    <ul className="flex flex-wrap gap-1.5 sm:gap-2">{popular.map((s) => <li key={s}><button onClick={() => submit(s)} className={chip}><TrendingUp size={13} className="text-gold group-hover:text-white" />{s}</button></li>)}</ul>
                  </section>
                )}
                <section className="p-2 sm:p-3">
                  <div className="mb-2 flex items-center justify-between px-1"><h2 className="text-xs font-bold uppercase tracking-wider text-brand">Popular products</h2><Link href="/shop" onClick={onClose} className="group flex items-center gap-1 text-xs font-semibold text-gold-dark">Shop all <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" /></Link></div>
                  {featuredLoading ? <SuggestionSkeleton n={4} /> : featured.length ? <SuggestionList items={featured} onPick={onClose} /> : <p className="px-2 py-4 text-sm text-muted">No popular products available.</p>}
                </section>
              </div>
            ) : (
              <div className="max-h-[65vh] overflow-y-auto">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2 sm:px-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-brand">
                    {loading ? <>Searching for “{term}”…</> : hasError ? "Search unavailable" : items.length ? <>Suggestions for “{term}”</> : <>No matches</>}
                  </h2>
                  {ready && items.length > 0 && !hasError && <button onClick={() => submit(term)} className="group flex items-center gap-1 text-xs font-semibold text-gold-dark">View all results <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" /></button>}
                </div>
                {loading ? <SuggestionSkeleton n={5} /> : hasError ? (
                  <div className="px-4 py-10 text-center">
                    <AlertTriangle size={34} className="mx-auto text-amber-500" />
                    <p className="mt-3 text-sm font-medium text-ink">Search is temporarily unavailable. Please try again.</p>
                    <button onClick={() => setRetryTick((t) => t + 1)} className="btn btn-primary mt-4 !px-4 !py-2 text-xs inline-flex items-center gap-2"><RotateCcw size={14} /> Retry</button>
                  </div>
                ) : items.length > 0 ? (
                  <SuggestionList items={items} onPick={() => { remember(term); onClose(); }} />
                ) : (
                  <div className="px-4 py-10 text-center">
                    <Search size={34} className="mx-auto text-brand/30" />
                    <p className="mt-3 text-base font-semibold text-ink">No products found</p>
                    <p className="mt-1.5 text-xs sm:text-sm text-muted max-w-xl mx-auto">Try a different product name, brand, SKU, or category.</p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      <button onClick={() => { setQ(""); setRes(null); }} className="btn btn-outline !px-4 !py-2 text-xs">Clear Search</button>
                      <button onClick={() => submit(term)} className="btn btn-primary !px-4 !py-2 text-xs" disabled={!term}>Search results</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SuggestionSkeleton({ n }: { n: number }) {
  return (
    <ul className="divide-y divide-line">
      {Array.from({ length: n }, (_, i) => (
        <li key={i} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
          <div className="skeleton h-12 w-12 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="skeleton h-3 w-3/4 rounded" />
            <div className="skeleton h-3 w-1/3 rounded" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function SuggestionList({ items, onPick }: { items: ProductCardData[]; onPick: () => void }) {
  return (
    <ul className="divide-y divide-line">
      {items.map((p) => (
        <li key={p.id}>
          <Link
            href={`/product/${p.slug}`}
            onClick={onPick}
            className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-brand-50/60 sm:px-4"
          >
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-brand-50 ring-1 ring-line sm:h-14 sm:w-14">
              <SmartImage src={p.image} alt={p.name || "Product"} sizes="56px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-medium text-ink">{p.name || "Unnamed product"}</p>
              <p className="mt-0.5 line-clamp-1 text-xs text-muted">{[p.brand, p.sku].filter(Boolean).join(" • ") || "View product"}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-brand">{money(p.price)}</p>
              {p.price < p.regular_price && <p className="text-[11px] text-muted line-through">{money(p.regular_price)}</p>}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
