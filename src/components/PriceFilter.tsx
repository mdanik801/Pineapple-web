"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PriceFilter({ basePath, params, bound, min, max }: { basePath: string; params: Record<string, string>; bound: number; min?: number; max?: number }) {
  const router = useRouter();
  const top = Math.max(bound, 100);
  const [lo, setLo] = useState(min ?? 0);
  const [hi, setHi] = useState(Math.min(max ?? top, top));
  const pct = (v: number) => (v / top) * 100;

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams(params);
    if (lo > 0) p.set("min", String(lo)); else p.delete("min");
    if (hi < top) p.set("max", String(hi)); else p.delete("max");
    p.delete("page");
    router.push(`${basePath}?${p.toString()}`, { scroll: false });
  }
  const step = Math.max(1, Math.round(top / 200));
  return (
    <form onSubmit={apply}>
      <div className="dual-range mx-1">
        <div className="track" />
        <div className="fill" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input type="range" aria-label="Minimum price" min={0} max={top} step={step} value={lo} onChange={(e) => setLo(Math.min(Number(e.target.value), hi - step))} />
        <input type="range" aria-label="Maximum price" min={0} max={top} step={step} value={hi} onChange={(e) => setHi(Math.max(Number(e.target.value), lo + step))} />
      </div>
      <div className="mt-5 flex items-center gap-2 text-sm">
        <label className="flex w-full items-center gap-1 border border-line px-2 py-2"><span className="text-muted">৳</span>
          <input type="number" min={0} max={hi} value={lo} onChange={(e) => setLo(Math.max(0, Math.min(Number(e.target.value) || 0, hi)))} className="w-full bg-transparent text-right outline-none" aria-label="Min price" /></label>
        <span>to</span>
        <label className="flex w-full items-center gap-1 border border-line px-2 py-2"><span className="text-muted">৳</span>
          <input type="number" min={lo} max={top} value={hi} onChange={(e) => setHi(Math.min(top, Math.max(Number(e.target.value) || 0, lo)))} className="w-full bg-transparent text-right outline-none" aria-label="Max price" /></label>
      </div>
      <button className="btn btn-primary mt-4 w-full">Apply</button>
    </form>
  );
}
