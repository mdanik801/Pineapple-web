"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PriceFilter({ basePath, params, bound, min, max }: { basePath: string; params: Record<string, string>; bound: number; min?: number; max?: number }) {
  const router = useRouter();
  const top = Math.max(0, Math.ceil(bound || 0));
  const sliderTop = Math.max(top, 1);
  const [lo, setLo] = useState(min != null ? Math.max(0, Math.min(min, sliderTop)) : 0);
  const [hi, setHi] = useState(max != null ? Math.min(Math.max(max, 0), sliderTop) : sliderTop);
  const pct = (v: number) => (sliderTop ? (v / sliderTop) * 100 : 0);

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams(params);
    const minVal = Math.max(0, Math.floor(Number.isFinite(lo) ? lo : 0));
    const rawMax = Number.isFinite(hi) ? hi : sliderTop;
    const maxVal = Math.min(sliderTop, Math.floor(rawMax));
    const safeMin = Math.min(minVal, maxVal);
    const safeMax = Math.max(minVal, maxVal);
    if (safeMin > 0) p.set("min", String(safeMin)); else p.delete("min");
    if (top > 0 && safeMax < top) p.set("max", String(safeMax)); else p.delete("max");
    p.delete("page");
    router.push(`${basePath}?${p.toString()}`, { scroll: false });
  }
  const step = Math.max(1, Math.round(sliderTop / 200));
  const loClamped = Math.max(0, Math.min(lo, hi));
  const hiClamped = Math.min(sliderTop, Math.max(hi, loClamped));
  return (
    <form onSubmit={apply}>
      <div className="dual-range mx-1">
        <div className="track" />
        <div className="fill" style={{ left: `${pct(loClamped)}%`, right: `${100 - pct(hiClamped)}%` }} />
        <input type="range" aria-label="Minimum price" min={0} max={sliderTop} step={step} value={loClamped} onChange={(e) => setLo(Math.min(Number(e.target.value), hiClamped))} />
        <input type="range" aria-label="Maximum price" min={0} max={sliderTop} step={step} value={hiClamped} onChange={(e) => setHi(Math.max(Number(e.target.value), loClamped))} />
      </div>
      <div className="mt-5 flex items-center gap-2 text-sm">
        <label className="flex w-full items-center gap-1 border border-line px-2 py-2"><span className="text-muted">৳</span>
          <input type="number" min={0} max={hiClamped} value={Number.isFinite(lo) ? lo : 0} onChange={(e) => { const v = e.target.value === "" ? 0 : Number(e.target.value); setLo(Number.isFinite(v) ? Math.max(0, Math.min(v, hiClamped)) : 0); }} className="w-full bg-transparent text-right outline-none" aria-label="Min price" /></label>
        <span>to</span>
        <label className="flex w-full items-center gap-1 border border-line px-2 py-2"><span className="text-muted">৳</span>
          <input type="number" min={loClamped} max={sliderTop} value={Number.isFinite(hi) ? hi : sliderTop} onChange={(e) => { const v = e.target.value === "" ? sliderTop : Number(e.target.value); setHi(Number.isFinite(v) ? Math.min(sliderTop, Math.max(v, loClamped)) : sliderTop); }} className="w-full bg-transparent text-right outline-none" aria-label="Max price" /></label>
      </div>
      <button className="btn btn-primary mt-4 w-full">Apply</button>
    </form>
  );
}
