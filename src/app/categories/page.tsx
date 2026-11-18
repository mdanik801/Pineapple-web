import type { Metadata } from "next";
import Link from "next/link";
import CategoryImage from "@/components/CategoryImage";
import { getCategories } from "@/lib/data";
import { categoryHref } from "@/lib/slug";

export const metadata: Metadata = {
  title: "All Categories | Pineapple",
  description: "Browse all product categories and subcategories in our collection.",
};

export const revalidate = 60;

export default async function AllCategoriesPage() {
  const cats = await getCategories();
  const topCategories = cats.filter((c) => !c.parent_id);
  const getSubcategories = (parentId: string) => cats.filter((c) => c.parent_id === parentId);

  return (
    <div className="content-full w-full min-w-0 py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 text-xs sm:text-sm text-neutral-500">
        <Link href="/" className="hover:text-neutral-900 transition-colors">Home</Link> /{" "}
        <span className="text-neutral-900 font-medium">Categories</span>
      </nav>

      {/* Header */}
      <div className="border-b border-neutral-200 pb-6 mb-8 sm:mb-10">
        <h1 className="section-title text-2xl sm:text-3xl lg:text-4xl text-neutral-900">All Categories</h1>
        <p className="mt-2 text-xs sm:text-sm text-neutral-500 max-w-2xl leading-relaxed">
          Explore our complete selection of clothing, trousers, jackets, and accessories across all categories.
        </p>
      </div>

      {/* Categories Grid */}
      <div className="space-y-12 sm:space-y-16">
        {topCategories.map((top) => {
          const subs = getSubcategories(top.id);
          return (
            <div key={top.id} className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-neutral-100 pb-3">
                <div>
                  <Link
                    href={categoryHref(top.slug)}
                    className="group inline-flex items-center gap-2 font-serif text-2xl sm:text-3xl text-neutral-900 hover:text-[#0A3C2A] transition-colors"
                  >
                    <span>{top.name}</span>
                    <span className="text-xs font-sans text-neutral-400 group-hover:text-[#0A3C2A] group-hover:translate-x-0.5 transition-all">
                      →
                    </span>
                  </Link>
                  {top.description && (
                    <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-xl">{top.description}</p>
                  )}
                </div>
                <Link
                  href={categoryHref(top.slug)}
                  className="text-xs font-medium uppercase tracking-wider text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  View all {top.name}
                </Link>
              </div>

              {/* Grid of Subcategories & Main */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5">
                {/* Parent Feature Card */}
                <Link
                  href={categoryHref(top.slug)}
                  className="group relative flex flex-col overflow-hidden rounded-xl bg-neutral-100 border border-neutral-200/80 hover:border-[#0A3C2A]/30 transition-all shadow-xs hover:shadow-md"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100">
                    <CategoryImage
                      src={top.image_url}
                      alt={top.name}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80 block">All</span>
                      <span className="font-semibold text-sm sm:text-base leading-tight block">{top.name}</span>
                    </div>
                  </div>
                </Link>

                {/* Subcategories Cards */}
                {subs.map((sub) => (
                  <Link
                    key={sub.id}
                    href={categoryHref(sub.slug)}
                    className="group relative flex flex-col overflow-hidden rounded-xl bg-white border border-neutral-200/80 hover:border-[#0A3C2A]/40 transition-all shadow-xs hover:shadow-md"
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100">
                      <CategoryImage
                        src={sub.image_url}
                        alt={sub.name}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70 group-hover:opacity-85 transition-opacity" />
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <span className="font-semibold text-sm sm:text-base leading-tight block">{sub.name}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
