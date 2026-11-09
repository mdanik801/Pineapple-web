import Link from "next/link";
import SmartImage from "@/components/SmartImage";
import HeroSlider from "@/components/HeroSlider";
import Section from "@/components/Section";
import ProductGrid from "@/components/ProductGrid";
import { getBanners, getCategories, listProducts, descendantIds } from "@/lib/data";
import { Truck, ShieldCheck, RotateCcw, Headphones } from "lucide-react";

export const revalidate = 60;

export default async function Home() {
  const [banners, cats] = await Promise.all([getBanners(), getCategories()]);
  const top = cats.filter((c) => !c.parent_id);

  const [newArr, featured, ...perCat] = await Promise.all([
    listProducts({ flag: "new", limit: 8 }).then(async (r) => (r.products.length >= 4 ? r : listProducts({ limit: 8 }))),
    listProducts({ flag: "featured", limit: 8 }),
    ...top.map((c) => listProducts({ categoryIds: descendantIds(cats, c.id), limit: 4 })),
  ]);

  return (
    <>
      <HeroSlider banners={banners} />

      <section className="container-x mt-8 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        {[[Truck, "Fast Delivery", "Nationwide shipping"], [ShieldCheck, "Cash on Delivery", "Pay when you receive"], [RotateCcw, "Easy Returns", "7-day return policy"], [Headphones, "Support", "Sat–Thu, 9AM–8PM"]].map(([Icon, t, s]) => {
          const I = Icon as typeof Truck;
          return (
            <div key={t as string} className="flex items-center gap-3 border border-line p-4">
              <I className="shrink-0 text-gold" size={28} />
              <div><p className="font-semibold text-brand">{t as string}</p><p className="text-xs text-muted">{s as string}</p></div>
            </div>
          );
        })}
      </section>

      <Section title="Shop by Category" subtitle="Explore our curated collections">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {top.map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`} className="group relative block aspect-[4/5] overflow-hidden bg-brand">
              <SmartImage src={c.image_url} alt={c.name} className="object-cover opacity-90 transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-center text-white">
                <h3 className="font-serif text-lg md:text-xl">{c.name}</h3>
                <span className="mt-1 inline-block border-b border-gold text-xs tracking-widest text-gold">SHOP NOW</span>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {newArr.products.length > 0 && <Section title="New Arrivals" subtitle="Fresh styles, just landed" href="/shop?sort=new"><ProductGrid products={newArr.products} /></Section>}
      {featured.products.length > 0 && <Section title="Featured" subtitle="Handpicked favorites" href="/shop"><ProductGrid products={featured.products} /></Section>}

      {top.map((c, i) => perCat[i].products.length > 0 && (
        <Section key={c.id} title={c.name} href={`/category/${c.slug}`}><ProductGrid products={perCat[i].products} /></Section>
      ))}
    </>
  );
}
