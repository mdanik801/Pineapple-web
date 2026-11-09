"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useSyncExternalStore } from "react";

export type CartItem = {
  key: string; productId: string; variantId: string | null;
  name: string; slug: string; image: string | null; price: number;
  variantTitle: string | null; qty: number; max: number;
};

type State = {
  items: CartItem[]; wishlist: string[]; drawerOpen: boolean; buyNow: CartItem | null;
  add: (i: Omit<CartItem, "key" | "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  toggleWish: (id: string) => void;
  setDrawer: (v: boolean) => void;
  setBuyNow: (i: CartItem | null) => void;
};

export const useStore = create<State>()(
  persist(
    (set) => ({
      items: [], wishlist: [], drawerOpen: false, buyNow: null,
      add: (i, qty = 1) =>
        set((s) => {
          const key = `${i.productId}:${i.variantId ?? "-"}`;
          const ex = s.items.find((x) => x.key === key);
          const max = Math.max(1, i.max);
          if (ex) return { items: s.items.map((x) => (x.key === key ? { ...x, ...i, qty: Math.min(max, x.qty + qty) } : x)), drawerOpen: true };
          return { items: [...s.items, { ...i, key, qty: Math.min(max, qty) }], drawerOpen: true };
        }),
      setQty: (key, qty) =>
        set((s) => ({ items: s.items.map((x) => (x.key === key ? { ...x, qty: Math.max(1, Math.min(x.max, qty)) } : x)) })),
      remove: (key) => set((s) => ({ items: s.items.filter((x) => x.key !== key) })),
      clear: () => set({ items: [] }),
      toggleWish: (id) => set((s) => ({ wishlist: s.wishlist.includes(id) ? s.wishlist.filter((x) => x !== id) : [...s.wishlist, id] })),
      setDrawer: (v) => set({ drawerOpen: v }),
      setBuyNow: (i) => set({ buyNow: i }),
    }),
    { name: "pineapple-store", partialize: (s) => ({ items: s.items, wishlist: s.wishlist, buyNow: s.buyNow }) },
  ),
);

const noop = () => () => {};
/** true only after client mount – avoids hydration mismatches for persisted state */
export function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false);
}
