"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useStore, useMounted } from "@/lib/store";
import { getWishlistProducts } from "@/actions/catalog";
import ProductGrid from "@/components/ProductGrid";
import type { ProductCardData } from "@/lib/data";

export default function WishlistPage() {
  const mounted = useMounted();
  const wishlist = useStore((s) => s.wishlist);
  const [products, setProducts] = useState<ProductCardData[] | null>(null);
  const key = wishlist.join(",");

  useEffect(() => {
    if (!mounted || !wishlist.length) return;
    let live = true;
    getWishlistProducts(wishlist).then((p) => live && setProducts(p));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, key]);

  const shown = (wishlist.length ? products ?? [] : []).filter((p) => wishlist.includes(p.id));
  return (
    <div className="container-x min-h-[50vh] py-10">
      <h1 className="section-title mb-8">My Wishlist</h1>
      {!mounted || (wishlist.length > 0 && products === null) ? <p className="text-muted">Loading…</p> : shown.length === 0 ? (
        <div className="py-16 text-center">
          <Heart className="mx-auto text-brand/30" size={64} />
          <p className="mt-4 text-muted">Your wishlist is empty. Tap the heart on any product to save it.</p>
          <Link href="/shop" className="btn btn-primary mt-6">Explore products</Link>
        </div>
      ) : <ProductGrid products={shown} />}
    </div>
  );
}
