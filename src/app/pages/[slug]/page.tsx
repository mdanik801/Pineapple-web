import { notFound } from "next/navigation";
import { getPolicies } from "@/lib/data";

const MAP: Record<string, [string, string]> = {
  about: ["About Us", "about_us"], shipping: ["Shipping Policy", "shipping_policy"], returns: ["Return Policy", "return_policy"],
  privacy: ["Privacy Policy", "privacy_policy"], terms: ["Terms & Conditions", "terms_conditions"],
};

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = MAP[slug];
  if (!m) notFound();
  const content = (await getPolicies())[m[1]];
  if (!content) notFound();
  return (
    <div className="container-x max-w-3xl py-12">
      <h1 className="section-title mb-6">{m[0]}</h1>
      <p className="whitespace-pre-line leading-8 text-ink/80">{content}</p>
    </div>
  );
}
