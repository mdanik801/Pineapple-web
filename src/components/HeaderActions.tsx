"use client";
import Link from "next/link";
import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Heart, ShoppingBag, User, Phone, ChevronDown } from "lucide-react";
import { categoryHref } from "@/lib/slug";
import { useStore, useMounted } from "@/lib/store";
import SearchModal from "./SearchModal";

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
};

type HeaderActionsProps = {
  name: string | null;
  popular: string[];
  categories?: CategoryItem[];
  supportPhone?: string;
  variant?: "default" | "desktop" | "mobileCart";
};

/** Dynamic typing effect hook for search placeholder */
function useTypingPlaceholder(
  phrases: string[],
  typeSpeed = 80,
  deleteSpeed = 40,
  pauseTime = 1800
) {
  const [placeholder, setPlaceholder] = useState(phrases[0] || "Search product...");

  useEffect(() => {
    if (!phrases || phrases.length === 0) return;

    let phraseIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let timeoutId: NodeJS.Timeout;

    const tick = () => {
      const currentPhrase = phrases[phraseIdx];
      if (!currentPhrase) return;

      if (!isDeleting) {
        charIdx++;
        setPlaceholder(currentPhrase.slice(0, charIdx));

        if (charIdx === currentPhrase.length) {
          isDeleting = true;
          timeoutId = setTimeout(tick, pauseTime);
          return;
        }
        timeoutId = setTimeout(tick, typeSpeed);
      } else {
        charIdx--;
        setPlaceholder(currentPhrase.slice(0, charIdx));

        if (charIdx === 0) {
          isDeleting = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
          timeoutId = setTimeout(tick, 350);
          return;
        }
        timeoutId = setTimeout(tick, deleteSpeed);
      }
    };

    timeoutId = setTimeout(tick, typeSpeed);

    return () => clearTimeout(timeoutId);
  }, [phrases, typeSpeed, deleteSpeed, pauseTime]);

  return placeholder;
}

export default function HeaderActions({
  name,
  popular,
  categories = [],
  supportPhone = "01777702000",
  variant = "default",
}: HeaderActionsProps) {
  const router = useRouter();
  const mounted = useMounted();
  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const catRef = useRef<HTMLDivElement>(null);

  const phrases = useMemo(() => {
    if (popular && popular.length > 0) {
      const formatted = popular.slice(0, 5).map((p) => `Search "${p}"...`);
      return [...formatted, "Search products...", "Search new arrivals..."];
    }
    return [
      "Search products...",
      "Search panjabi...",
      "Search premium shirts...",
      "Search denim pants...",
      "Search polo t-shirts...",
      "Search new arrivals...",
    ];
  }, [popular]);

  const typingPlaceholder = useTypingPlaceholder(phrases);

  const cartCount = useStore((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const wishCount = useStore((s) => s.wishlist.length);
  const setDrawer = useStore((s) => s.setDrawer);

  // Close categories dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatOpen(false);
      }
    }
    if (catOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [catOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchQuery.replace(/\s+/g, " ").trim().slice(0, 120);
    if (term) {
      if (selectedCategory) {
        router.push(`/shop?category=${selectedCategory.slug}&q=${encodeURIComponent(term)}`);
      } else {
        router.push(`/search?q=${encodeURIComponent(term)}`);
      }
    } else if (selectedCategory) {
      router.push(categoryHref(selectedCategory.slug));
    } else {
      setOpen(true);
    }
  };

  const phoneClean = supportPhone.replace(/[^0-9+]/g, "");

  return (
    <>
      {/* Desktop & Tablet Center: Pill Search Bar */}
      <div className="hidden min-w-0 flex-1 items-center justify-center px-3 md:flex md:px-4 lg:px-6 xl:px-8">
        <form
          onSubmit={handleSearch}
          role="search"
          className="relative flex h-[42px] w-full min-w-[220px] max-w-full items-center rounded-full border border-neutral-200/90 bg-[#f4f5f7] pl-1 pr-2 shadow-2xs transition-all focus-within:border-neutral-400 focus-within:bg-white focus-within:shadow-xs md:max-w-[clamp(26rem,46vw,40rem)] lg:max-w-[clamp(30rem,48vw,48rem)] xl:max-w-[clamp(34rem,50vw,56rem)] 2xl:max-w-[clamp(38rem,52vw,64rem)]"
        >
          {/* Text Input with Dynamic Typing Placeholder */}
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={typingPlaceholder}
            aria-label="Search product"
            className="w-full bg-transparent pl-4 pr-2 text-xs md:text-[13px] text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
          />

          {/* Categories Selector Dropdown */}
          <div ref={catRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setCatOpen((prev) => !prev)}
              className="flex items-center gap-1 border-l border-neutral-300/80 px-2.5 py-1 text-xs text-neutral-600 transition-colors hover:text-neutral-900"
              aria-expanded={catOpen}
              aria-label="Filter by category"
            >
              <span className="max-w-[90px] truncate lg:max-w-[120px]">
                {selectedCategory ? selectedCategory.name : "Categories"}
              </span>
              <ChevronDown
                size={13}
                className={`transition-transform duration-200 ${catOpen ? "rotate-180" : ""}`}
              />
            </button>

            {catOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 max-h-64 overflow-y-auto rounded-xl border border-neutral-200 bg-white py-1.5 shadow-xl z-50">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(null);
                    setCatOpen(false);
                  }}
                  className={`w-full px-3.5 py-1.5 text-left text-xs transition-colors hover:bg-neutral-100 ${
                    !selectedCategory ? "font-bold text-[#0A3C2A]" : "text-neutral-700"
                  }`}
                >
                  All Categories
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(c);
                      setCatOpen(false);
                    }}
                    className={`w-full px-3.5 py-1.5 text-left text-xs transition-colors hover:bg-neutral-100 ${
                      selectedCategory?.id === c.id ? "font-bold text-[#0A3C2A]" : "text-neutral-700"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Magnifying Glass Icon Button */}
          <button
            type="submit"
            aria-label="Search"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:text-neutral-900"
          >
            <Search size={16} strokeWidth={2} />
          </button>
        </form>
      </div>

      {/* Desktop & Tablet Right: Phone Callout + User, Wishlist, Cart Icons */}
      <div className="hidden shrink-0 items-center gap-5 lg:gap-7 md:flex">
        {/* Call Us Now */}
        <a
          href={`tel:${phoneClean}`}
          className="hidden items-center gap-2.5 transition-opacity hover:opacity-80 lg:flex"
          aria-label={`Call us now at ${supportPhone}`}
        >
          <Phone size={19} strokeWidth={1.8} className="shrink-0 text-neutral-800" />
          <div className="flex flex-col text-left leading-tight">
            <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
              Call Us Now
            </span>
            <span className="text-[13px] font-bold text-neutral-900">
              {supportPhone}
            </span>
          </div>
        </a>

        {/* Action Icons */}
        <div className="flex items-center gap-4 lg:gap-5">
          {/* User Profile */}
          <Link
            href={name ? "/account" : "/login"}
            aria-label={name ? `My account, logged in as ${name}` : "Sign in"}
            title={name ? `Hi, ${name}` : "Sign In"}
            className="text-neutral-800 transition-colors hover:text-[#0A3C2A]"
          >
            <User size={22} strokeWidth={1.6} />
          </Link>

          {/* Wishlist */}
          <Link
            href="/wishlist"
            aria-label="My Wish List"
            title="My Wish List"
            className="relative text-neutral-800 transition-colors hover:text-[#0A3C2A]"
          >
            <Heart size={22} strokeWidth={1.6} />
            {mounted && wishCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C49A3E] px-1 text-[10px] font-bold text-white shadow-2xs">
                {wishCount}
              </span>
            )}
          </Link>

          {/* Cart */}
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label={`Shopping cart, ${mounted ? cartCount : 0} items`}
            title="Shopping cart"
            className="relative cursor-pointer text-neutral-800 transition-colors hover:text-[#0A3C2A]"
          >
            <ShoppingBag size={22} strokeWidth={1.6} />
            {mounted && cartCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0A3C2A] px-1 text-[10px] font-bold text-white shadow-2xs">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Layout: Cart button (right side of compact header) */}
      {variant !== "desktop" && (
        <div className={`flex items-center justify-end gap-1 shrink-0 z-10 ${variant === "default" ? "md:hidden" : ""}`}>
          {variant === "default" && (
            <button
              type="button"
              aria-label="Search"
              onClick={() => setOpen(true)}
              className="grid h-9 w-9 place-items-center text-neutral-800 hover:text-black touch-manipulation transition-colors"
            >
              <Search size={20} />
            </button>
          )}
          <button
            type="button"
            aria-label={`Shopping cart, ${mounted ? cartCount : 0} items`}
            onClick={() => setDrawer(true)}
            className="relative grid h-9 w-9 place-items-center text-neutral-800 hover:text-black touch-manipulation transition-colors"
          >
            <ShoppingBag size={20} />
            {mounted && cartCount > 0 && (
              <span className="absolute top-1 right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#0A3C2A] px-0.5 text-[9px] font-bold leading-none text-white shadow-2xs">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      )}

      {open && <SearchModal popular={popular} onClose={() => setOpen(false)} />}
    </>
  );
}
