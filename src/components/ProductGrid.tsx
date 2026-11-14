import ProductCard from "./ProductCard";
import type { ProductCardData } from "@/lib/data";

export default function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
 <div className="grid w-full min-w-0 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-7 sm:gap-x-5 lg:gap-x-6">
    {products.map((p, i) => (
        <div key={p.id} className="w-full min-w-0">
          <ProductCard p={p} priority={i < 4} />
        </div>
      ))}
    </div>
  );
}
