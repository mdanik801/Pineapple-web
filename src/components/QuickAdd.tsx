"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getQuickView } from "@/actions/catalog";
import AddToCart from "./AddToCart";
import SmartImage from "./SmartImage";

type Q = NonNullable<Awaited<ReturnType<typeof getQuickView>>>;

export default function QuickAdd({ slug, onClose }: { slug: string; onClose: () => void }) {
  const [q, setQ] = useState<Q | null | undefined>(undefined);
  const [img, setImg] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    getQuickView(slug).then((r) => live && setQ(r));
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => { live = false; window.removeEventListener("keydown", esc); };
  }, [slug, onClose]);

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/55 p-4 [animation:fadeIn_.25s_ease]" onClick={onClose} onMouseDown={(e) => e.stopPropagation()}>
      <div role="dialog" aria-modal="true" aria-label="Quick add" onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto bg-white p-5 shadow-2xl [animation:popIn_.35s_cubic-bezier(.22,1,.36,1)] md:p-7">
        <button aria-label="Close" onClick={onClose} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full hover:bg-brand-50"><X size={20} /></button>
        {q === undefined ? <p className="py-16 text-center text-muted">Loading…</p> : q === null ? <p className="py-16 text-center text-muted">Product unavailable.</p> : (
          <div className="grid gap-6 md:grid-cols-[260px_1fr]">
            <div className="relative aspect-[4/5] overflow-hidden bg-brand-50"><SmartImage src={img ?? q.images[0]} alt={q.name} sizes="260px" className="object-cover" /></div>
            <div>
              <h2 className="pr-8 font-serif text-2xl text-brand">{q.name}</h2>
              <div className="mt-3"><AddToCart p={{ ...q, image: q.images[0] ?? null }} onVariantImage={setImg} hideBuyNow /></div>
              <Link href={`/product/${q.slug}`} onClick={onClose} className="mt-5 inline-block text-sm font-semibold text-brand underline-offset-4 hover:text-gold hover:underline">View full details →</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
