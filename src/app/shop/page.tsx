import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Listing, { type SP } from "@/components/Listing";
import { getCategories } from "@/lib/data";

export const metadata: Metadata = { title: "Shop All" };

export default async function Shop({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  if (sp.q) redirect(`/search?${new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]).toString()}`);
  const cats = await getCategories();
  return (
    <div className="container-x w-full min-w-0 py-6 sm:py-10">
      <h1 className="section-title mb-6 sm:mb-8 text-2xl sm:text-3xl lg:text-4xl">{sp.q ? "Search results" : "All Products"}</h1>
      <Listing basePath="/shop" sp={sp} types={cats.filter((c) => !c.parent_id).map((c) => ({ name: c.name, href: `/category/${c.slug}` }))} />
    </div>
  );
}
