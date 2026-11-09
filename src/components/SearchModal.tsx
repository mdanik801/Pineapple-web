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
  const [recent, setRecent] = useState<string[]>(read); // mounted only after a click, so safe to read storage
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
  const chip = "group flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand hover:bg-brand hover:text-white hover:shadow-md";

  return (
    <div role="dialog" aria-modal="true" aria-label="Search" className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-sm [animation:fadeIn_.3s_ease]" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[94vh] overflow-y-auto rounded-b-[28px] bg-white shadow-2xl [animation:panelDown_.5s_cubic-bezier(.22,1,.36,1)]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6 md:pt-9">
          {/* search bar */}
          <form onSubmit={(e) => { e.preventDefault(); submit(q); }} className="flex items-center gap-3">
            <div className="group flex flex-1 items-center gap-3 rounded-full border border-line bg-[#f6f8f7] pl-5 pr-2 shadow-inner transition-all duration-300 focus-within:border-brand focus-within:bg-white focus-within:shadow-[0_8px_30px_-12px_rgba(10,60,42,.45)] focus-within:ring-4 focus-within:ring-brand/10">
              <Search size={22} className="shrink-0 text-brand transition-transform duration-300 group-focus-within:scale-110" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for products, e.g. denim, cargo, trousers…" aria-label="Search products" className="w-full bg-transparent py-4 text-base outline-none placeholder:text-muted/80 md:text-lg" />
              {q ? (
                <button type="button" aria-label="Clear search" onClick={() => setQ("")} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-brand-50 hover:text-brand"><X size={18} /></button>
              ) : <kbd className="mr-3 hidden shrink-0 rounded-md border border-line bg-white px-2 py-1 text-[11px] font-semibold text-muted sm:block">ESC</kbd>}
              <button className="btn btn-primary hidden !rounded-full !px-6 !py-3 sm:inline-flex" disabled={!term}>Search</button>
            </div>
            <button type="button" aria-label="Close search" onClick={onClose} className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-line bg-white transition-all duration-300 hover:rotate-90 hover:border-brand hover:bg-brand hover:text-white"><X size={22} /></button>
          </form>

          {!searching ? (
            <div className="mt-9 grid gap-10 lg:grid-cols-[250px_1fr] lg:gap-12">
              <div className="space-y-9">
                {recent.length > 0 && (
                  <section>
                    <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold uppercase tracking-wider text-brand">Recent</h2><button onClick={clearRecent} className="text-xs font-semibold text-gold-dark hover:underline">Clear all</button></div>
                    <ul className="flex flex-wrap gap-2">
                      {recent.map((r) => (
                        <li key={r} className="group/c flex items-center rounded-full border border-line bg-white pl-4 pr-1 text-sm shadow-sm transition-all duration-300 hover:border-brand">
                          <button onClick={() => submit(r)} className="flex items-center gap-2 py-2"><Clock size={14} className="text-gold-dark" />{r}</button>
                          <button aria-label={`Remove ${r}`} onClick={() => removeRecent(r)} className="ml-1 grid h-7 w-7 place-items-center rounded-full text-muted transition hover:bg-red-50 hover:text-red-600"><X size={13} /></button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {popular.length > 0 && (
                  <section>
                    <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-brand">Popular searches</h2>
                    <ul className="flex flex-wrap gap-2">{popular.map((s) => <li key={s}><button onClick={() => submit(s)} className={chip}><TrendingUp size={14} className="text-gold transition-colors group-hover:text-white" />{s}</button></li>)}</ul>
                  </section>
                )}
              </div>
              <section>
                <div className="mb-5 flex items-end justify-between"><h2 className="font-serif text-2xl text-brand">Featured products</h2><Link href="/shop" onClick={onClose} className="group flex items-center gap-1 text-sm font-semibold text-gold-dark">Shop all <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></Link></div>
                {featured.length ? <Grid items={featured} onPick={pick} cols="grid-cols-2 md:grid-cols-4" /> : <Skeletons cols="grid-cols-2 md:grid-cols-4" n={4} />}
              </section>
            </div>
          ) : (
            <section className="mt-9">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <h2 className="font-serif text-2xl text-brand">{!ready ? <>Searching for “{term}”…</> : res.items.length ? <>Results for “{term}”</> : <>No results for “{term}”</>}</h2>
                {ready && res.items.length > 0 && <button onClick={() => submit(term)} className="group flex items-center gap-1 text-sm font-semibold text-gold-dark">View all results <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></button>}
              </div>
              {!ready ? <Skeletons cols="grid-cols-2 md:grid-cols-4 lg:grid-cols-4" n={4} /> : res.items.length > 0 ? <Grid items={res.items} onPick={pick} cols="grid-cols-2 md:grid-cols-4" /> : (
                <div className="rounded-2xl bg-[#f6f8f7] py-14 text-center">
                  <Search size={40} className="mx-auto text-brand/30" />
                  <p className="mt-4 text-muted">We couldn&apos;t find anything. Try a different keyword.</p>
                  <Link href="/shop" onClick={onClose} className="btn btn-primary mt-6">Browse all products</Link>
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
    <div className={`grid gap-4 ${cols}`}>
      {Array.from({ length: n }, (_, i) => <div key={i}><div className="skeleton aspect-[5/6] rounded-xl" /><div className="skeleton mx-auto mt-3 h-3 w-3/4 rounded" /><div className="skeleton mx-auto mt-2 h-3 w-1/3 rounded" /></div>)}
    </div>
  );
}

function Grid({ items, onPick, cols }: { items: ProductCardData[]; onPick: () => void; cols: string }) {
  return (
    <ul className={`grid gap-x-4 gap-y-7 ${cols}`}>
      {items.map((p, i) => {
        const off = discountPct(p.regular_price, p.sale_price);
        return (
          <li key={p.id} style={{ animationDelay: `${i * 60}ms` }} className="group [animation:popIn_.5s_cubic-bezier(.22,1,.36,1)_both]">
            <Link href={`/product/${p.slug}`} onClick={onPick} className="block">
              <div className="relative aspect-[5/6] overflow-hidden rounded-xl bg-brand-50 ring-1 ring-line transition-shadow duration-500 group-hover:shadow-xl">
                <SmartImage src={p.image} alt={p.name} sizes="(max-width:768px) 50vw, 22vw" className="object-cover transition-[scale] duration-[1100ms] ease-[cubic-bezier(.19,1,.22,1)] group-hover:scale-110" />
                {off > 0 && <span className="absolute left-2 top-2 rounded-sm bg-gold px-2 py-0.5 text-[11px] font-bold text-white">-{off}%</span>}
                {!p.in_stock && <span className="absolute inset-x-0 bottom-0 bg-ink/75 py-1 text-center text-[11px] font-semibold tracking-wider text-white">SOLD OUT</span>}
              </div>
              <p className="mt-3 line-clamp-2 min-h-[2.4rem] text-center text-[13px] font-medium leading-[1.2rem] text-ink transition-colors group-hover:text-brand">{p.name}</p>
              <p className="mt-1 text-center text-sm"><span className="font-semibold text-brand">{money(p.price)}</span>{p.price < p.regular_price && <span className="ml-2 text-muted line-through">{money(p.regular_price)}</span>}</p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
