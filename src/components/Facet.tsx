"use client";
import { useState } from "react";
import { ChevronUp } from "lucide-react";

export default function Facet({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="mb-8">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-center justify-between border-b border-ink/70 pb-2 text-left text-sm font-bold uppercase tracking-wide text-ink">
        {title}<ChevronUp size={16} className={`transition-transform duration-300 ${open ? "" : "rotate-180"}`} />
      </button>
      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden"><div className="pt-4">{children}</div></div>
      </div>
    </section>
  );
}
