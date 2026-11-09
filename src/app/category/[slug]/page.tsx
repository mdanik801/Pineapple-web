import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Listing, { type SP } from "@/components/Listing";
import { getCategories, descendantIds } from "@/lib/data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = (await getCategories()).find((x) => x.slug === slug);
  return { title: c?.name ?? "Category", description: c?.description ?? undefined };
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<SP> }) {
  const [{ slug }, sp, cats] = await Promise.all([params, searchParams, getCategories()]);
  const cat = cats.find((c) => c.slug === slug);
  if (!cat) notFound();
  const parent = cat.parent_id ? cats.find((c) => c.id === cat.parent_id) : null;
  return (
    <div className="container-x py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <Link href="/" className="hover:text-brand">Home</Link> / {parent && <><Link href={`/category/${parent.slug}`} className="hover:text-brand">{parent.name}</Link> / </>}
        <span className="text-brand">{cat.name}</span>
      </nav>
      <h1 className="section-title">{cat.name}</h1>
      {cat.description && <p className="mt-2 max-w-2xl text-muted">{cat.description}</p>}
      <div className="mt-6">
        <Listing basePath={`/category/${slug}`} sp={sp} categoryIds={descendantIds(cats, cat.id)} types={cats.filter((c) => c.parent_id === cat.id).map((c) => ({ name: c.name, href: `/category/${c.slug}` }))} />
      </div>
    </div>
  );
}
