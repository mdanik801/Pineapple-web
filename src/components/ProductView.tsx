"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SmartImage from "./SmartImage";
import AddToCart from "./AddToCart";
import type { Variant } from "@/lib/data";

type P = {
  id: string; name: string; slug: string; images: string[];
  regular_price: number; sale_price: number | null; price: number;
  variants: Variant[]; baseStock: number;
};

export default function ProductView({ p, header, details }: { p: P; header: React.ReactNode; details: React.ReactNode }) {
  const [override, setOverride] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const n = p.images.length;
  const main = override ?? p.images[idx] ?? null;
  const step = (d: number) => { setOverride(null); setIdx((idx + d + n) % n); };
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
      <div className="flex flex-col-reverse gap-3 md:flex-row">
        {n > 1 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto md:max-h-[720px] md:flex-col md:overflow-y-auto">
            {p.images.map((u, i) => (
              <button key={u} type="button" aria-label={`Image ${i + 1}`} onClick={() => { setIdx(i); setOverride(null); }}
                className={`relative aspect-[4/5] w-16 shrink-0 overflow-hidden border-2 transition-colors md:w-20 ${!override && i === idx ? "border-brand" : "border-transparent hover:border-line"}`}>
                <SmartImage src={u} alt="" sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
        <div className="group relative aspect-[4/5] w-full overflow-hidden bg-brand-50">
          <div key={main ?? "none"} className="absolute inset-0 [animation:fadeIn_.5s_ease]">
            <SmartImage src={main} alt={p.name} priority sizes="(max-width:1024px) 100vw, 55vw" className="object-cover" />
          </div>
          {n > 1 && (
            <>
              <button type="button" aria-label="Previous image" onClick={() => step(-1)} className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-brand shadow transition hover:scale-110 hover:bg-white"><ChevronLeft /></button>
              <button type="button" aria-label="Next image" onClick={() => step(1)} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-brand shadow transition hover:scale-110 hover:bg-white"><ChevronRight /></button>
            </>
          )}
        </div>
      </div>
      <div>
        {header}
        <AddToCart p={{ ...p, image: p.images[0] ?? null }} onVariantImage={setOverride} />
        {details}
      </div>
    </div>
  );
}
