import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Listing, { type SP } from "@/components/Listing";
import { getCategories } from "@/lib/data";
import { categoryHref } from "@/lib/slug";

export const metadata: Metadata = { title: "Shop All" };

export default async function Shop({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  if (sp.q) redirect(`/search?${new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]).toString()}`);
  const cats = await getCategories();
  return (
    <div className="container-x w-full min-w-0 py-4 sm:py-6">
      <h1 className="section-title mb-2.5 sm:mb-3 text-xl sm:text-2xl lg:text-3xl">{sp.q ? "Search results" : "All Products"}</h1>
      <Listing basePath="/shop" sp={sp} types={cats.filter((c) => !c.parent_id).map((c) => ({ name: c.name, href: categoryHref(c.slug) }))} />
    </div>
  );
}
