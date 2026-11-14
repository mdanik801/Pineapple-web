"use client";
import Link from "next/link";
import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Heart, ShoppingBag, User, Phone, ChevronDown, AlertTriangle, RotateCcw, TrendingUp } from "lucide-react";
import { categoryHref } from "@/lib/slug";
import { useStore, useMounted } from "@/lib/store";
import { searchProducts, getSuggestedProducts } from "@/actions/catalog";
import type { ProductCardData } from "@/lib/data";
import { normalizeSearchQuery } from "@/lib/search-utils";
import { money } from "@/lib/format";
import SmartImage from "./SmartImage";
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
  const [searchFocused, setSearchFocused] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState<ProductCardData[]>([]);
  const [suggestedLoading, setSuggestedLoading] = useState(false);
  const [suggestedLoaded, setSuggestedLoaded] = useState(false);
  const [acItems, setAcItems] = useState<ProductCardData[]>([]);
  const [acLoading, setAcLoading] = useState(false);
  const [acError, setAcError] = useState<string | null>(null);
  const [acRetryTick, setAcRetryTick] = useState(0);
  const catRef = useRef<HTMLDivElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const acReqId = useRef(0);
  const searchTerm = normalizeSearchQuery(searchQuery);

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

  // Close desktop autocomplete when clicking outside or pressing Escape
  useEffect(() => {
    function onDoc(e: MouseEvent | TouchEvent) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSuggestionsOpen(false);
        setSearchFocused(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") { setSuggestionsOpen(false); setSearchFocused(false); }
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc, { passive: true });
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const loadSuggested = async () => {
    if (suggestedLoading) return;
    setSuggestedLoading(true);
    try {
      const p = await getSuggestedProducts(6);
      setSuggestedProducts(Array.isArray(p) ? p.slice(0, 6) : []);
    } catch {
      setSuggestedProducts([]);
    } finally {
      setSuggestedLoading(false);
      setSuggestedLoaded(true);
    }
  };

  useEffect(() => {
    if (suggestionsOpen && !suggestedLoaded) loadSuggested();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestionsOpen]);

  // Debounced character-based autocomplete (reuses existing search action/DB logic)
  useEffect(() => {
    if (!searchTerm) {
      setAcLoading(false);
      setAcError(null);
      setAcItems([]);
      return;
    }
    const currentId = ++acReqId.current;
    setAcLoading(true);
    setAcError(null);
    const t = setTimeout(async () => {
      try {
        const out = await searchProducts(searchTerm, 6);
        if (currentId !== acReqId.current) return;
        setAcItems(out.items || []);
        setAcError(out.error || null);
      } catch {
        if (currentId !== acReqId.current) return;
        setAcItems([]);
        setAcError("Search is temporarily unavailable. Please try again.");
      } finally {
        if (currentId === acReqId.current) setAcLoading(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [searchTerm, acRetryTick]);

  const closeSuggestions = () => { setSuggestionsOpen(false); setSearchFocused(false); };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchQuery.replace(/\s+/g, " ").trim().slice(0, 120);
    if (term) {
      closeSuggestions();
      if (selectedCategory) {
        router.push(`/shop?category=${selectedCategory.slug}&q=${encodeURIComponent(term)}`);
      } else {
        router.push(`/search?q=${encodeURIComponent(term)}`);
      }
    } else if (selectedCategory) {
      closeSuggestions();
      router.push(categoryHref(selectedCategory.slug));
    } else {
      setSuggestionsOpen(true);
    }
  };

  const goToSearchTerm = (t: string) => {
    const term = normalizeSearchQuery(t);
    if (!term) return;
    setSearchQuery(term);
    closeSuggestions();
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const phoneClean = supportPhone.replace(/[^0-9+]/g, "");

  return (
    <>
      {/* Desktop & Tablet Center: Pill Search Bar + Autocomplete */}
      <div className="hidden min-w-0 flex-1 items-center justify-center px-3 md:flex md:px-4 lg:px-6 xl:px-8">
        <div
          ref={searchWrapRef}
          className="relative w-full min-w-[220px] max-w-full md:max-w-[clamp(26rem,46vw,40rem)] lg:max-w-[clamp(30rem,48vw,48rem)] xl:max-w-[clamp(34rem,50vw,56rem)] 2xl:max-w-[clamp(38rem,52vw,64rem)]"
        >
          <form
            onSubmit={handleSearch}
            role="search"
            className="relative flex h-[42px] w-full items-center rounded-full border border-neutral-200/90 bg-[#f4f5f7] pl-1 pr-2 shadow-2xs transition-all focus-within:border-neutral-400 focus-within:bg-white focus-within:shadow-xs"
          >
            {/* Text Input with Dynamic Typing Placeholder */}
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSuggestionsOpen(true); }}
              onFocus={() => { setSearchFocused(true); setSuggestionsOpen(true); }}
              onClick={() => setSuggestionsOpen(true)}
              placeholder={typingPlaceholder}
              aria-label="Search product"
              aria-expanded={suggestionsOpen}
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

          {suggestionsOpen && (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl">
              <div className="max-h-[min(70vh,26rem)] overflow-y-auto">
                {!searchTerm ? (
                  <>
                    {popular.length > 0 && (
                      <div className="border-b border-neutral-100 p-3">
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-brand">Popular searches</p>
                        <ul className="flex flex-wrap gap-1.5">
                          {popular.slice(0, 8).map((s) => (
                            <li key={s}>
                              <button type="button" onClick={() => goToSearchTerm(s)} className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs text-neutral-700 hover:border-brand hover:bg-brand hover:text-white">
                                <TrendingUp size={12} className="text-gold" />{s}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="p-2">
                      <p className="px-1 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-brand">Popular products</p>
                      {suggestedLoading ? (
                        <ul className="divide-y divide-neutral-100">
                          {Array.from({ length: 4 }, (_, i) => (
                            <li key={i} className="flex items-center gap-3 px-2 py-2">
                              <div className="skeleton h-11 w-11 shrink-0 rounded-md" />
                              <div className="min-w-0 flex-1 space-y-2"><div className="skeleton h-3 w-3/4 rounded" /><div className="skeleton h-3 w-1/3 rounded" /></div>
                            </li>
                          ))}
                        </ul>
                      ) : suggestedProducts.length ? (
                        <ul className="divide-y divide-neutral-100">
                          {suggestedProducts.map((p) => (
                            <li key={p.id}>
                              <Link href={`/product/${p.slug}`} onClick={closeSuggestions} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-brand-50/60">
                                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-brand-50 ring-1 ring-neutral-100">
                                  <SmartImage src={p.image} alt={p.name || "Product"} sizes="44px" className="object-cover" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="line-clamp-1 text-sm font-medium text-neutral-900">{p.name || "Unnamed product"}</p>
                                  <p className="line-clamp-1 text-xs text-neutral-500">{money(p.price)}</p>
                                </div>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="px-2 py-3 text-sm text-neutral-500">No popular products available.</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="p-2">
                    <div className="flex items-center justify-between px-1 pb-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-brand">
                        {acLoading ? "Searching…" : acError ? "Search unavailable" : acItems.length ? "Suggestions" : "No matches"}
                      </p>
                      {searchTerm && <button type="button" onClick={() => goToSearchTerm(searchTerm)} className="text-xs font-semibold text-gold-dark">View all</button>}
                    </div>
                    {acLoading ? (
                      <ul className="divide-y divide-neutral-100">
                        {Array.from({ length: 4 }, (_, i) => (
                          <li key={i} className="flex items-center gap-3 px-2 py-2">
                            <div className="skeleton h-11 w-11 shrink-0 rounded-md" />
                            <div className="min-w-0 flex-1 space-y-2"><div className="skeleton h-3 w-3/4 rounded" /><div className="skeleton h-3 w-1/3 rounded" /></div>
                          </li>
                        ))}
                      </ul>
                    ) : acError ? (
                      <div className="px-2 py-6 text-center">
                        <AlertTriangle size={28} className="mx-auto text-amber-500" />
                        <p className="mt-2 text-sm text-neutral-700">Search is temporarily unavailable. Please try again.</p>
                        <button type="button" onClick={() => setAcRetryTick((t) => t + 1)} className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white"><RotateCcw size={13} /> Retry</button>
                      </div>
                    ) : acItems.length ? (
                      <ul className="divide-y divide-neutral-100">
                        {acItems.map((p) => (
                          <li key={p.id}>
                            <Link href={`/product/${p.slug}`} onClick={closeSuggestions} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-brand-50/60">
                              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-brand-50 ring-1 ring-neutral-100">
                                <SmartImage src={p.image} alt={p.name || "Product"} sizes="44px" className="object-cover" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-1 text-sm font-medium text-neutral-900">{p.name || "Unnamed product"}</p>
                                <p className="line-clamp-1 text-xs text-neutral-500">{[p.brand, p.sku].filter(Boolean).join(" • ")}</p>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-sm font-semibold text-brand">{money(p.price)}</p>
                                {p.price < p.regular_price && <p className="text-[11px] text-neutral-500 line-through">{money(p.regular_price)}</p>}
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-2 py-6 text-center">
                        <p className="text-sm font-medium text-neutral-900">No products found</p>
                        <p className="mt-1 text-xs text-neutral-500">Try a different product name, brand, SKU, or category.</p>
                        <button type="button" onClick={() => goToSearchTerm(searchTerm)} className="mt-3 rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:border-brand hover:text-brand">View search results</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
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

      {/* Mobile Layout: Search + Cart (visible on mobile header/navbar contexts) */}
      {variant !== "desktop" && (
        <div className={`flex items-center justify-end gap-1 shrink-0 z-10 ${variant === "default" ? "md:hidden" : ""}`}>
          <button
            type="button"
            aria-label="Search"
            onClick={() => setOpen(true)}
            className="grid h-9 w-9 place-items-center text-neutral-800 hover:text-black touch-manipulation transition-colors"
          >
            <Search size={20} />
          </button>
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
