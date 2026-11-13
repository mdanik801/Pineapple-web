"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const n = p.images.length;
  const safeIdx = n ? Math.min(idx, n - 1) : 0;
  const main = override ?? p.images[safeIdx] ?? null;
  const gallery = useMemo(() => (p.images || []).filter(Boolean), [p.images]);

  useEffect(() => { setMounted(true); }, []);

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

    // Robust scroll lock for mobile (iOS/Android) while modal is open.
    const body = document.body;
    const html = document.documentElement;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const prev = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
      bodyTouchAction: body.style.touchAction,
      htmlOverflow: html.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
    };

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.touchAction = "none";
    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      body.style.overflow = prev.bodyOverflow;
      body.style.position = prev.bodyPosition;
      body.style.top = prev.bodyTop;
      body.style.left = prev.bodyLeft;
      body.style.right = prev.bodyRight;
      body.style.width = prev.bodyWidth;
      body.style.touchAction = prev.bodyTouchAction;
      html.style.overflow = prev.htmlOverflow;
      html.style.overscrollBehavior = prev.htmlOverscroll;
      window.scrollTo(0, scrollY);
    };
  }, [lightboxOpen, gallery.length]);

  const lightboxSrc = gallery.length ? (gallery[lightboxIdx] ?? gallery[0]) : main;

  const onLightboxTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0]?.clientX ?? null;
  };
  const onLightboxTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0]?.clientX ?? null;
  };
  const onLightboxTouchEnd = () => {
    if (override || gallery.length <= 1) return;
    const start = touchStartX.current;
    const end = touchEndX.current;
    if (start == null || end == null) return;
    const delta = start - end;
    if (Math.abs(delta) > 40) {
      if (delta > 0) stepLightbox(1);
      else stepLightbox(-1);
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const showVariantPreview = Boolean(override && !gallery.includes(override));
  const showThumbStrip = gallery.length > 1 && !showVariantPreview;
  const previewSrc = showVariantPreview ? (override as string) : (lightboxSrc || "/placeholder.svg");

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

      {lightboxOpen && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] m-0 flex items-center justify-center overscroll-contain touch-manipulation"
          style={{ height: "100dvh", minHeight: "100vh" }}
          role="dialog"
          aria-modal="true"
          aria-label="Product image preview"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/90"
            aria-label="Close preview"
            onClick={() => setLightboxOpen(false)}
          />

          <div
            className="relative z-10 flex h-full w-full max-w-[100vw] flex-col items-center justify-center"
            style={{
              paddingTop: "max(0.5rem, env(safe-area-inset-top))",
              paddingRight: "max(0.5rem, env(safe-area-inset-right))",
              paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
              paddingLeft: "max(0.5rem, env(safe-area-inset-left))",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close preview"
              onClick={() => setLightboxOpen(false)}
              className="absolute z-30 grid h-11 w-11 place-items-center rounded-full bg-white/95 text-brand shadow-lg hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              style={{ top: "max(0.5rem, env(safe-area-inset-top))", right: "max(0.5rem, env(safe-area-inset-right))" }}
            >
              <X size={20} />
            </button>

            <div
              className="relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden px-12 sm:px-16"
              onTouchStart={onLightboxTouchStart}
              onTouchMove={onLightboxTouchMove}
              onTouchEnd={onLightboxTouchEnd}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewSrc}
                alt={`${p.name} preview`}
                className="block max-h-full max-w-full w-auto h-auto object-contain select-none"
                style={{ touchAction: "pan-y pinch-zoom" }}
                draggable={false}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }}
              />

              {showThumbStrip && (
                <>
                  <button type="button" aria-label="Previous image" onClick={() => stepLightbox(-1)} className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-full bg-white/95 text-brand shadow hover:bg-white touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                    <ChevronLeft size={20} />
                  </button>
                  <button type="button" aria-label="Next image" onClick={() => stepLightbox(1)} className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-full bg-white/95 text-brand shadow hover:bg-white touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {showThumbStrip && (
              <div className="mt-2 flex w-full max-w-4xl shrink-0 flex-col items-center">
                <div className="flex items-center justify-center text-xs text-white/90">
                  <span>{lightboxIdx + 1} / {gallery.length}</span>
                </div>
                <div className="mt-2 no-scrollbar flex w-full gap-2 overflow-x-auto justify-start sm:justify-center pb-1 px-1">
                  {gallery.map((u, i) => (
                    <button
                      key={`${u}-lb-${i}`}
                      type="button"
                      onClick={() => setLightboxIdx(i)}
                      className={`relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded border bg-white touch-manipulation ${i === lightboxIdx ? "border-brand ring-1 ring-brand" : "border-white/30"}`}
                      aria-label={`Preview image ${i + 1}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u} alt="" className="h-full w-full object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
