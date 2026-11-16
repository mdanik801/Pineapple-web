import Link from "next/link";
import { categoryHref } from "@/lib/slug";
import type { Category } from "@/lib/data";

type Props = {
  categories: Category[];
};

export default function BottomCategorySection({ categories }: Props) {
  const items = (categories || []).filter((c) => c && typeof c.slug === "string" && c.slug.trim().length > 0).slice(0, 2);
  if (items.length === 0) return null;

  return (
    <section className="w-full bg-[#f7f7f5] px-2 md:px-4 pt-2 md:pt-3 pb-4 md:pb-8" aria-label="Bottom categories">
      {/* Mobile-only See All tile above banners */}
      <Link
        href="/shop"
        className="md:hidden mb-2 flex w-full items-center justify-center border border-black/10 bg-[#f7f7f5] px-4 py-2.5 text-xs font-medium uppercase tracking-[.14em] text-neutral-800 transition-colors hover:bg-[#efefec] hover:text-black"
        aria-label="See all products"
      >
        See All
      </Link>

      {/* 2 equal-sized cards side-by-side at all sizes; images fill cards edge-to-edge (cover) */}
      <div className="grid w-full min-w-0 grid-cols-2 gap-2 md:gap-3">
        {items.map((cat) => {
          const image = (cat.image_url || "").trim();
          const href = categoryHref(cat.slug);
          return (
            <Link
              key={cat.id}
              href={href}
              className="group relative block w-full min-w-0 overflow-hidden rounded-[8px] bg-neutral-100 aspect-[2/3] md:aspect-[4/5]"
              aria-label={cat.name || "Category"}
            >
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 block h-full w-full object-cover object-center"
                  loading="lazy"
                  decoding="async"
                />
              ) : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
