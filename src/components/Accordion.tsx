"use client";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";

export default function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-4 text-left text-base text-ink/90 hover:text-brand">
        {title}{open ? <Minus size={16} /> : <Plus size={16} />}
      </button>
      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden"><div className="pb-5 text-sm leading-7 text-ink/75">{children}</div></div>
      </div>
    </div>
  );
}
