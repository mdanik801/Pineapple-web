"use client";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { getQuickView } from "@/actions/catalog";
import AddToCart from "./AddToCart";
import SmartImage from "./SmartImage";

type Q = NonNullable<Awaited<ReturnType<typeof getQuickView>>>;
const subscribe = () => () => {};

export default function QuickAdd({ slug, onClose }: { slug: string; onClose: () => void }) {
  const [q, setQ] = useState<Q | null | undefined>(undefined);
  const [img, setImg] = useState<string | null>(null);
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  useEffect(() => {
    let live = true;
    getQuickView(slug).then((r) => live && setQ(r));
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", esc);
    return () => {
      live = false;
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", esc);
    };
  }, [slug, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4 backdrop-blur-xs [animation:fadeIn_.25s_ease]"
      onClick={onClose}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Quick add"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className="relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-t-2xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl [animation:popIn_.35s_cubic-bezier(.22,1,.36,1)] sm:max-h-[90dvh] sm:rounded-xl sm:p-6 sm:pb-6 md:p-7"
      >
        <div className="mx-auto mb-2 mt-0.5 h-1.5 w-12 rounded-full bg-neutral-300 sm:hidden" />

        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-neutral-800 shadow-xs hover:bg-brand-50 touch-manipulation sm:h-10 sm:w-10"
        >
          <X size={19} />
        </button>

        {q === undefined ? (
          <p className="py-16 text-center text-muted">Loading…</p>
        ) : q === null ? (
          <p className="py-16 text-center text-muted">Product unavailable.</p>
        ) : (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-[220px_1fr] lg:grid-cols-[250px_1fr]">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[180px] overflow-hidden rounded bg-brand-50 sm:max-w-none">
              <SmartImage src={img ?? q.images[0]} alt={q.name} sizes="(max-width: 640px) 180px, 250px" className="object-cover" />
            </div>
            <div className="min-w-0">
              <h2 className="pr-8 font-serif text-lg font-semibold text-brand sm:text-xl md:text-2xl leading-snug">
                {q.name}
              </h2>
              <div className="mt-2.5 sm:mt-3">
                <AddToCart p={{ ...q, image: q.images[0] ?? null }} onVariantImage={setImg} hideBuyNow />
              </div>
              <Link
                href={`/product/${q.slug}`}
                onClick={onClose}
                className="mt-4 inline-block text-xs sm:text-sm font-semibold text-brand underline-offset-4 hover:text-gold hover:underline"
              >
                View full details →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
