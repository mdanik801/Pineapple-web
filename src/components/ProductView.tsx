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
    <div className="grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12 xl:gap-14">
      {/* Gallery Section */}
      <div className="flex flex-col-reverse gap-2.5 sm:gap-3 md:flex-row">
        {n > 1 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto touch-pan-x overscroll-x-contain pb-1 md:max-h-[720px] md:flex-col md:overflow-y-auto md:pb-0">
            {p.images.map((u, i) => (
              <button
                key={u}
                type="button"
                aria-label={`Image ${i + 1}`}
                onClick={() => { setIdx(i); setOverride(null); }}
                className={`relative aspect-[4/5] w-14 shrink-0 overflow-hidden rounded-xs border-2 transition-colors touch-manipulation sm:w-16 md:w-20 ${!override && i === idx ? "border-brand ring-1 ring-brand" : "border-line hover:border-brand"}`}
              >
                <SmartImage src={u} alt="" sizes="(max-width: 768px) 64px, 80px" className="object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="group relative aspect-[4/5] w-full overflow-hidden rounded-xs bg-brand-50 shadow-xs">
          <div key={main ?? "none"} className="absolute inset-0 [animation:fadeIn_.4s_ease]">
            <SmartImage src={main} alt={p.name} priority sizes="(max-width: 640px) 100vw, (max-width: 1024px) 55vw, 50vw" className="object-cover" />
          </div>
          {n > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={() => step(-1)}
                className="absolute left-2 sm:left-3 top-1/2 grid h-8 w-8 sm:h-10 sm:w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-brand shadow transition hover:scale-105 hover:bg-white touch-manipulation"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={() => step(1)}
                className="absolute right-2 sm:right-3 top-1/2 grid h-8 w-8 sm:h-10 sm:w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-brand shadow transition hover:scale-105 hover:bg-white touch-manipulation"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Information & Actions */}
      <div className="min-w-0">
        {header}
        <AddToCart p={{ ...p, image: p.images[0] ?? null }} onVariantImage={setOverride} />
        {details}
      </div>
    </div>
  );
}
