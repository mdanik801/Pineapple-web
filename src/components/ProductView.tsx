"use client";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const n = p.images.length;
  const safeIdx = n ? Math.min(idx, n - 1) : 0;
  const main = override ?? p.images[safeIdx] ?? null;
  const gallery = useMemo(() => (p.images || []).filter(Boolean), [p.images]);

  const step = (d: number) => {
    if (!n) return;
    setOverride(null);
    setIdx((safeIdx + d + n) % n);
  };
  const stepLightbox = (d: number) => {
    if (!gallery.length) return;
    setLightboxIdx((i) => (i + d + gallery.length) % gallery.length);
  };
  const openLightbox = (i?: number) => {
    const start = typeof i === "number" ? i : safeIdx;
    setLightboxIdx(Math.max(0, Math.min(start, Math.max(0, gallery.length - 1))));
    setLightboxOpen(true);
  };

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") stepLightbox(1);
      if (e.key === "ArrowLeft") stepLightbox(-1);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [lightboxOpen, gallery.length]);

  const lightboxSrc = gallery.length ? (gallery[lightboxIdx] ?? gallery[0]) : main;

  return (
    <div className="grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12 xl:gap-14">
      <div className="flex flex-col-reverse gap-2.5 sm:gap-3 md:flex-row min-w-0">
        {n > 1 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto touch-pan-x overscroll-x-contain pb-1 md:max-h-[720px] md:flex-col md:overflow-y-auto md:pb-0">
            {p.images.map((u, i) => (
              <button
                key={`${u}-${i}`}
                type="button"
                aria-label={`View image ${i + 1}`}
                onClick={() => { setIdx(i); setOverride(null); openLightbox(i); }}
                className={`relative aspect-[4/5] w-14 shrink-0 overflow-hidden rounded-xs border-2 transition-colors touch-manipulation sm:w-16 md:w-20 bg-white ${!override && i === safeIdx ? "border-brand ring-1 ring-brand" : "border-line hover:border-brand"}`}
              >
                <SmartImage src={u} alt={`${p.name} thumbnail ${i + 1}`} sizes="(max-width: 768px) 64px, 80px" className="object-contain p-0.5" />
              </button>
            ))}
          </div>
        )}

        <div className="group relative w-full min-w-0">
          <button
            type="button"
            onClick={() => openLightbox(override ? undefined : safeIdx)}
            className="relative block aspect-[4/5] w-full overflow-hidden rounded-xs bg-[#F7F8F5] shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="Open image preview"
            title="Click to view larger image"
          >
            <div key={main ?? "none"} className="absolute inset-0 [animation:fadeIn_.25s_ease]">
              <SmartImage src={main} alt={p.name} priority sizes="(max-width: 640px) 100vw, (max-width: 1024px) 55vw, 50vw" className="object-contain p-2 sm:p-3" />
            </div>
            <span className="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-medium text-brand shadow opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn size={12} /> Preview
            </span>
          </button>
          {n > 1 && (
            <>
              <button type="button" aria-label="Previous image" onClick={() => step(-1)} className="absolute left-2 sm:left-3 top-1/2 grid h-8 w-8 sm:h-10 sm:w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-brand shadow transition hover:scale-105 hover:bg-white touch-manipulation">
                <ChevronLeft size={18} />
              </button>
              <button type="button" aria-label="Next image" onClick={() => step(1)} className="absolute right-2 sm:right-3 top-1/2 grid h-8 w-8 sm:h-10 sm:w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-brand shadow transition hover:scale-105 hover:bg-white touch-manipulation">
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="min-w-0">
        {header}
        <AddToCart p={{ ...p, image: p.images[0] ?? null }} onVariantImage={setOverride} />
        {details}
      </div>

      {lightboxOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Product image preview">
          <button type="button" className="absolute inset-0 bg-black/80 backdrop-blur-[1px]" aria-label="Close preview" onClick={() => setLightboxOpen(false)} />
          <div className="relative z-10 w-full max-w-6xl max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="relative flex-1 min-h-0 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={override && !gallery.includes(override) ? override : (lightboxSrc || "/placeholder.svg")}
                alt={`${p.name} preview`}
                className="max-h-[82vh] w-auto max-w-full object-contain select-none"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }}
              />
              {gallery.length > 1 && !override && (
                <>
                  <button type="button" aria-label="Previous image" onClick={() => stepLightbox(-1)} className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-full bg-white/90 text-brand shadow hover:bg-white">
                    <ChevronLeft size={20} />
                  </button>
                  <button type="button" aria-label="Next image" onClick={() => stepLightbox(1)} className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-full bg-white/90 text-brand shadow hover:bg-white">
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
              <button type="button" aria-label="Close preview" onClick={() => setLightboxOpen(false)} className="absolute top-2 right-2 sm:top-3 sm:right-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-brand shadow hover:bg-white">
                <X size={18} />
              </button>
            </div>
            {gallery.length > 1 && !override && (
              <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-white/90">
                <span>{lightboxIdx + 1} / {gallery.length}</span>
              </div>
            )}
            {gallery.length > 1 && !override && (
              <div className="mt-2 no-scrollbar flex gap-2 overflow-x-auto justify-center pb-1">
                {gallery.map((u, i) => (
                  <button key={`${u}-lb-${i}`} type="button" onClick={() => setLightboxIdx(i)} className={`relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded border bg-white ${i === lightboxIdx ? "border-brand ring-1 ring-brand" : "border-white/30"}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" className="h-full w-full object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
