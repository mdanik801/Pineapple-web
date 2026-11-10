"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import SmartImage from "./SmartImage";

type B = { id: string; title: string; subtitle: string | null; description?: string | null; image_url: string | null; mobile_image_url: string | null; cta_text: string | null; cta_link: string | null };

const DUR = 1200; // ms, must match shutter animation length

export default function HeroSlider({ banners, ariaLabel = "Featured", priority = true }: { banners: B[]; ariaLabel?: string; priority?: boolean }) {
  const n = banners.length;
  const [i, setI] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const touch = useRef<number | null>(null);

  const cur = useRef(0);
  const go = useCallback((to: number) => {
    if (to === cur.current) return;
    setPrev(cur.current);
    cur.current = to;
    setI(to);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPrev(null), DUR + 50);
  }, []);

  useEffect(() => {
    if (n < 2) return;
    const t = setTimeout(() => go((i + 1) % n), 6500);
    return () => clearTimeout(t);
  }, [i, n, go]);

  if (!n) return null;
  const hasMobile = banners.some((b) => b.mobile_image_url);

  return (
    <section aria-roledescription="carousel" aria-label={ariaLabel}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { if (touch.current == null) return; const d = e.changedTouches[0].clientX - touch.current; touch.current = null; if (Math.abs(d) > 50) go((i + (d < 0 ? 1 : -1) + n) % n); }}
      className={`relative w-full overflow-hidden bg-brand ${hasMobile ? "aspect-[4/5]" : "aspect-[16/10]"} sm:aspect-[16/8] lg:aspect-[16/7]`}>
      {banners.map((b, k) => {
        const active = k === i, leaving = k === prev;
        const title = b.title.trim();
        const motion = prev === null && active ? "" : active ? "[animation:shutterOpen_1.2s_cubic-bezier(.77,0,.18,1)_both]" : leaving ? "[animation:shutterClose_1.2s_cubic-bezier(.77,0,.18,1)_forwards]" : "";
        return (
          <div key={b.id} aria-hidden={!active} className={`absolute inset-0 will-change-[clip-path] ${active ? "z-[1]" : leaving ? "z-[2]" : "invisible z-0"} ${motion}`}>
            <div className={`absolute inset-0 ${active && prev !== null ? "[animation:kenburns_6s_ease-out_both]" : ""}`}>
              <SmartImage src={b.image_url} alt={title || "Pineapple banner"} priority={priority && k === 0} sizes="100vw" className="hidden object-cover sm:block" />
              <SmartImage src={b.mobile_image_url || b.image_url} alt="" priority={priority && k === 0} sizes="100vw" className="object-cover sm:hidden" />
            </div>
            {(title || b.subtitle || b.description) && <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />}
            {(title || b.subtitle || b.description || (b.cta_text && b.cta_link)) && (
              <div className={`container-x absolute inset-0 flex flex-col justify-center text-white ${active && prev !== null ? "[animation:textIn_.9s_.55s_cubic-bezier(.22,1,.36,1)_both]" : ""}`}>
                {title && <h2 className="max-w-xl font-serif text-2xl leading-tight sm:text-4xl lg:text-6xl">{title}</h2>}
                {b.subtitle && <p className="mt-3 max-w-md text-sm sm:text-base">{b.subtitle}</p>}
                {b.description && <p className="mt-2 max-w-lg text-sm leading-6 text-white/90 sm:text-base">{b.description}</p>}
                {b.cta_link && b.cta_text && <Link href={b.cta_link} tabIndex={active ? 0 : -1} className="btn btn-gold mt-6 w-fit">{b.cta_text}</Link>}
              </div>
            )}
          </div>
        );
      })}
      {n > 1 && (
        <div className="absolute bottom-4 left-1/2 z-[3] flex -translate-x-1/2 gap-2">
          {banners.map((b, k) => <button key={b.id} aria-label={`Slide ${k + 1}`} onClick={() => go(k)} className={`h-2 rounded-full transition-all duration-500 ${k === i ? "w-7 bg-gold" : "w-2 bg-white/70 hover:bg-white"}`} />)}
        </div>
      )}
    </section>
  );
}
