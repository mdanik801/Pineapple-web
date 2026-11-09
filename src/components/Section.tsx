import Link from "next/link";
import Reveal from "./Reveal";

export default function Section({ title, subtitle, href, children }: { title: string; subtitle?: string; href?: string; children: React.ReactNode }) {
  return (
    <section className="container-x mt-14 md:mt-20">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <h2 className="section-title">{title}</h2>
          <span className="mt-2 block h-0.5 w-14 bg-gold" />
          {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
        </div>
        {href && <Link href={href} className="shrink-0 text-sm font-semibold text-brand underline-offset-4 hover:text-gold hover:underline">View all →</Link>}
      </div>
      <Reveal>{children}</Reveal>
    </section>
  );
}
