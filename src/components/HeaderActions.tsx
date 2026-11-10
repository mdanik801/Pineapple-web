"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Heart, ShoppingBag } from "lucide-react";
import { useStore, useMounted } from "@/lib/store";
import SearchModal from "./SearchModal";

export default function HeaderActions({ name, popular }: { name: string | null; popular: string[] }) {
  const router = useRouter();
  const mounted = useMounted();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const cartCount = useStore((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const wishCount = useStore((s) => s.wishlist.length);
  const setDrawer = useStore((s) => s.setDrawer);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchQuery.trim();
    if (term) {
      router.push(`/search?q=${encodeURIComponent(term)}`);
    } else {
      setOpen(true);
    }
  };


  return (
    <>
      {/* Desktop Layout: 2 stacked rows (Search on top, Actions on bottom) */}
      <div className="hidden flex-col items-end gap-2 md:flex">
        {/* Row 1: Search bar */}
        <form
          onSubmit={handleSearch}
          role="search"
          className="relative flex h-[38px] w-56 md:w-64 lg:w-[290px] items-center rounded-full border border-[#d2dad6] bg-white pl-3.5 pr-1 shadow-2xs transition-all focus-within:border-[#0A3C2A] focus-within:ring-1 focus-within:ring-[#0A3C2A]/20"
        >
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            aria-label="Search products"
            className="w-full bg-transparent pr-2 text-xs md:text-[13px] text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Search"
            className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full bg-[#0A3C2A] text-white transition-all hover:bg-[#072b1e] active:scale-95"
          >
            <Search size={13} strokeWidth={2.2} />
          </button>
        </form>

        {/* Row 2: Action links */}
        <div className="flex items-center gap-4 lg:gap-6">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label={`Shopping cart, ${mounted ? cartCount : 0} items`}
            title="Shopping cart"
            className="group flex items-center gap-1.5 text-xs lg:text-[13px] font-normal text-[#212925] transition-colors hover:text-[#0A3C2A]"
          >
            <ShoppingBag size={17} strokeWidth={1.75} className="shrink-0 text-[#212925] transition-transform group-hover:scale-105" />
            <span className="whitespace-nowrap">Shopping Cart</span>
            <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#C49A3E] px-1 text-[10px] font-bold leading-none text-white shadow-2xs">
              {mounted ? cartCount : 0}
            </span>
          </button>

          <Link
            href="/wishlist"
            aria-label="My Wish List"
            title="My Wish List"
            className="group flex items-center gap-1.5 text-xs lg:text-[13px] font-normal text-[#212925] transition-colors hover:text-[#0A3C2A]"
          >
            <Heart size={17} strokeWidth={1.75} className="shrink-0 text-[#212925] transition-transform group-hover:scale-105" />
            <span className="whitespace-nowrap">My Wish List</span>
            {mounted && wishCount > 0 && (
              <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#C49A3E] px-1 text-[10px] font-bold leading-none text-white shadow-2xs">
                {wishCount}
              </span>
            )}
          </Link>

          <Link
            href={name ? "/account" : "/login"}
            aria-label={name ? "My account" : "Sign in"}
            title={name ? "My account" : "Sign in"}
            className="whitespace-nowrap text-xs lg:text-[13px] font-normal text-[#212925] transition-colors hover:text-[#0A3C2A]"
          >
            {name ? `Hi, ${name}` : "Sign In"}
          </Link>
        </div>
      </div>

      {/* Mobile Layout: Search button on the right side in the same navbar row */}
      <div className="flex items-center justify-end shrink-0 z-10 md:hidden">
        <button
          type="button"
          aria-label="Search"
          onClick={() => setOpen(true)}
          className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center text-neutral-800 hover:text-black touch-manipulation transition-colors"
        >
          <Search size={20} />
        </button>
      </div>

      {open && <SearchModal popular={popular} onClose={() => setOpen(false)} />}
    </>
  );
}
