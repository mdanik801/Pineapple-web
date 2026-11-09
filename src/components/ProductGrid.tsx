import ProductCard from "./ProductCard";
import type { ProductCardData } from "@/lib/data";

export default function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
      {products.map((p, i) => <ProductCard key={p.id} p={p} priority={i < 4} />)}
    </div>
  );
}
