"use client";
import { Heart } from "lucide-react";
import { useStore, useMounted } from "@/lib/store";

export default function WishlistButton({ productId, className = "", label }: { productId: string; className?: string; label?: boolean }) {
  const mounted = useMounted();
  const wished = useStore((s) => s.wishlist.includes(productId));
  const toggle = useStore((s) => s.toggleWish);
  const on = mounted && wished;
  return (
    <button
      type="button"
      aria-label={on ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={on}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(productId); }}
      className={className || "grid h-9 w-9 place-items-center rounded-full bg-white/90 text-brand shadow hover:bg-white"}
    >
      <Heart size={18} className={on ? "fill-gold text-gold" : ""} />
      {label && <span className="ml-2 text-sm">{on ? "In wishlist" : "Add to wishlist"}</span>}
    </button>
  );
}
