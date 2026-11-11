import ProductCard from "./ProductCard";
import type { ProductCardData } from "@/lib/data";

export default function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <div className="grid w-full min-w-0 grid-cols-[repeat(auto-fill,minmax(min(100%,220px),1fr))] gap-x-4 gap-y-7 sm:gap-x-5 lg:gap-x-6">
      {products.map((p, i) => (
        <div key={p.id} className="w-full min-w-0">
          <ProductCard p={p} priority={i < 4} />
        </div>
      ))}
    </div>
  );
}
