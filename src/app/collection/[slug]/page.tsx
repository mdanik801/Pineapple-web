import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductGrid from "@/components/ProductGrid";
import { getCollection, listProducts } from "@/lib/data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await getCollection((await params).slug);
  return { title: c?.name ?? "Collection" };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const c = await getCollection((await params).slug);
  if (!c) notFound();
  const { products } = await listProducts({ collectionId: c.id, limit: 40 });
  return (
    <div className="container-x py-10">
      <h1 className="section-title">{c.name}</h1>
      {c.description && <p className="mt-2 max-w-2xl text-muted">{c.description}</p>}
      <div className="mt-8">
        {products.length ? <ProductGrid products={products} /> : <div className="py-16 text-center text-muted"><p>No products in this collection yet.</p><Link href="/shop" className="btn btn-primary mt-5">Browse all products</Link></div>}
      </div>
    </div>
  );
}
