import ProductGrid from "@/components/ProductGrid";
import { listProducts } from "@/lib/data";

export default async function RelatedProducts({ categoryId, excludeId }: { categoryId?: string | null; excludeId: string }) {
  if (!categoryId) return null;
  const { products } = await listProducts({ categoryIds: [categoryId], excludeId, limit: 5 });
  if (!products.length) return null;
  return (
    <div className="mt-14 sm:mt-20">
      <div className="mb-6 sm:mb-7">
        <h2 className="section-title text-xl sm:text-2xl md:text-3xl">You may also like</h2>
        <span className="mt-2 block h-0.5 w-14 bg-gold" />
      </div>
      <ProductGrid products={products} />
    </div>
  );
}
