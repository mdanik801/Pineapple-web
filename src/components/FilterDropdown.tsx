"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FilterDropdown({ label, active, children }: { label: string; active?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const click = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", click); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", click); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 border px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors sm:px-5 sm:text-sm ${active ? "border-brand bg-brand text-white" : "border-line text-ink hover:border-brand"}`}>
        {label}<ChevronDown size={15} className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`absolute left-0 top-full z-30 mt-2 min-w-56 max-w-[88vw] border border-line bg-white p-4 shadow-xl transition-all duration-300 ease-out ${open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"}`}>
        {children}
      </div>
    </div>
  );
}
