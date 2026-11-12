"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { searchProducts, getSuggestedProducts } from "@/actions/catalog";
import SmartImage from "./SmartImage";
import { money, discountPct } from "@/lib/format";
import type { ProductCardData } from "@/lib/data";

const KEY = "pineapple-recent-searches";
const read = (): string[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? "[]").slice(0, 6); } catch { return []; } };
const write = (v: string[]) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} };

export default function SearchModal({ popular, onClose }: { popular: string[]; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<string[]>(read);
  const [featured, setFeatured] = useState<ProductCardData[]>([]);
  const [res, setRes] = useState<{ q: string; items: ProductCardData[] } | null>(null);
  const term = q.trim();

  useEffect(() => { let live = true; getSuggestedProducts().then((p) => live && setFeatured(p)); return () => { live = false; }; }, []);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = prevOverflow; window.removeEventListener("keydown", esc); };
  }, [onClose]);

  useEffect(() => {
    if (term.length < 2) return;
    let live = true;
    const t = setTimeout(() => searchProducts(term).then((items) => live && setRes({ q: term, items })), 250);
    return () => { live = false; clearTimeout(t); };
  }, [term]);

  function remember(s: string) {
    const v = s.trim(); if (!v) return;
    const next = [v, ...recent.filter((r) => r.toLowerCase() !== v.toLowerCase())].slice(0, 6);
    setRecent(next); write(next);
  }
  function submit(s: string) {
    const v = s.trim(); if (!v) return;
    remember(v); onClose(); router.push(`/search?q=${encodeURIComponent(v)}`);
  }
  const removeRecent = (s: string) => { const n = recent.filter((r) => r !== s); setRecent(n); write(n); };
  const clearRecent = () => { setRecent([]); write([]); };

  const searching = term.length >= 2;
  const ready = searching && res?.q === term;
  const pick = () => { remember(term); onClose(); };
  const chip = "group flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs sm:text-sm shadow-2xs transition-all duration-300 hover:border-brand hover:bg-brand hover:text-white";

  return (
    <div role="dialog" aria-modal="true" aria-label="Search" className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs [animation:fadeIn_.3s_ease]" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[92vh] overflow-y-auto rounded-b-2xl bg-white shadow-2xl [animation:panelDown_.4s_cubic-bezier(.22,1,.36,1)]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-8 pt-5 sm:px-6 sm:pb-10 sm:pt-8">
          {/* Search bar */}
          <form onSubmit={(e) => { e.preventDefault(); submit(q); }} className="flex items-center gap-2 sm:gap-3">
            <div className="group flex flex-1 items-center gap-2.5 rounded-full border border-line bg-[#f6f8f7] pl-4 pr-1.5 shadow-inner transition-all duration-300 focus-within:border-brand focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/10 sm:pl-5 sm:pr-2">
              <Search size={18} className="shrink-0 text-brand sm:size-[20px]" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products, e.g. denim, cargo…"
                aria-label="Search products"
                className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted/80 sm:py-3.5 sm:text-base"
              />
              {q ? (
                <button type="button" aria-label="Clear search" onClick={() => setQ("")} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted hover:bg-brand-50 hover:text-brand touch-manipulation sm:h-9 sm:w-9"><X size={16} /></button>
              ) : <kbd className="mr-2 hidden shrink-0 rounded border border-line bg-white px-2 py-0.5 text-[10px] font-semibold text-muted sm:block">ESC</kbd>}
              <button className="btn btn-primary hidden !rounded-full !px-5 !py-2.5 text-xs sm:inline-flex" disabled={!term}>Search</button>
            </div>
            <button type="button" aria-label="Close search" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-white text-neutral-800 transition-all hover:border-brand hover:bg-brand hover:text-white touch-manipulation sm:h-11 sm:w-11"><X size={19} /></button>
          </form>

          {!searching ? (
            <div className="mt-7 sm:mt-9 grid gap-8 lg:grid-cols-[240px_1fr] lg:gap-10">
              <div className="space-y-7">
                {recent.length > 0 && (
                  <section>
                    <div className="mb-2.5 flex items-center justify-between"><h2 className="text-xs font-bold uppercase tracking-wider text-brand">Recent</h2><button onClick={clearRecent} className="text-[11px] font-semibold text-gold-dark hover:underline">Clear all</button></div>
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
                  <section>
                    <h2 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-brand">Popular searches</h2>
                    <ul className="flex flex-wrap gap-1.5 sm:gap-2">{popular.map((s) => <li key={s}><button onClick={() => submit(s)} className={chip}><TrendingUp size={13} className="text-gold group-hover:text-white" />{s}</button></li>)}</ul>
                  </section>
                )}
              </div>
              <section>
                <div className="mb-4 flex items-end justify-between"><h2 className="font-serif text-lg sm:text-xl text-brand">Suggested products</h2><Link href="/shop" onClick={onClose} className="group flex items-center gap-1 text-xs sm:text-sm font-semibold text-gold-dark">Shop all <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></Link></div>
                {featured.length ? <Grid items={featured} onPick={pick} cols="grid-cols-1 md:grid-cols-4" /> : <Skeletons cols="grid-cols-1 md:grid-cols-4" n={4} />}
              </section>
            </div>
          ) : (
            <section className="mt-7 sm:mt-9">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <h2 className="font-serif text-lg sm:text-xl text-brand">{!ready ? <>Searching for “{term}”…</> : res.items.length ? <>Results for “{term}”</> : <>No results for “{term}”</>}</h2>
                {ready && res.items.length > 0 && <button onClick={() => submit(term)} className="group flex items-center gap-1 text-xs sm:text-sm font-semibold text-gold-dark">View all results <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></button>}
              </div>
              {!ready ? <Skeletons cols="grid-cols-1 md:grid-cols-4 lg:grid-cols-4" n={4} /> : res.items.length > 0 ? <Grid items={res.items} onPick={pick} cols="grid-cols-1 md:grid-cols-4" /> : (
                <div className="rounded-xl bg-[#f6f8f7] py-12 text-center">
                  <Search size={36} className="mx-auto text-brand/30" />
                  <p className="mt-3 text-xs sm:text-sm text-muted">We couldn&apos;t find anything. Try a different keyword.</p>
                  <Link href="/shop" onClick={onClose} className="btn btn-primary mt-5 !px-5 !py-2.5 text-xs">Browse all products</Link>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Skeletons({ cols, n }: { cols: string; n: number }) {
  return (
    <div className={`grid gap-3 sm:gap-4 ${cols}`}>
      {Array.from({ length: n }, (_, i) => <div key={i}><div className="skeleton aspect-[5/6] rounded-lg" /><div className="skeleton mx-auto mt-2.5 h-3 w-3/4 rounded" /><div className="skeleton mx-auto mt-1.5 h-3 w-1/3 rounded" /></div>)}
    </div>
  );
}

function Grid({ items, onPick, cols }: { items: ProductCardData[]; onPick: () => void; cols: string }) {
  return (
    <ul className={`grid gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6 ${cols}`}>
      {items.map((p, i) => {
        const off = discountPct(p.regular_price, p.sale_price);
        return (
          <li key={p.id} style={{ animationDelay: `${i * 60}ms` }} className="group [animation:popIn_.4s_cubic-bezier(.22,1,.36,1)_both]">
            <Link href={`/product/${p.slug}`} onClick={onPick} className="block">
              <div className="relative aspect-[5/6] overflow-hidden rounded-lg bg-brand-50 ring-1 ring-line">
                <SmartImage src={p.image} alt={p.name} sizes="(max-width: 768px) 100vw, 22vw" className="object-cover" />
                {off > 0 && <span className="absolute left-1.5 top-1.5 rounded-xs bg-gold px-1.5 py-0.5 text-[10px] font-bold text-white">-{off}%</span>}
                {!p.in_stock && <span className="absolute inset-x-0 bottom-0 bg-ink/75 py-1 text-center text-[10px] font-semibold text-white">SOLD OUT</span>}
              </div>
              <p className="mt-2 line-clamp-2 text-center text-xs font-medium text-ink group-hover:text-brand leading-snug">{p.name}</p>
              <p className="mt-0.5 text-center text-xs sm:text-sm"><span className="font-semibold text-brand">{money(p.price)}</span>{p.price < p.regular_price && <span className="ml-1.5 text-muted line-through text-[11px]">{money(p.regular_price)}</span>}</p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
