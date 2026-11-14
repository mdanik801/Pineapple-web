"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FilterDropdown({
  label,
  active,
  align = "left",
  children,
}: {
  label: string;
  active?: boolean;
  align?: "left" | "right";
  children: React.ReactNode;
}) {
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
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 border px-2.5 py-1.5 text-[10px] sm:px-3 sm:py-1.5 sm:text-[11px] font-bold uppercase tracking-wider transition-colors touch-manipulation rounded-xs ${active ? "border-brand bg-brand text-white" : "border-line text-ink hover:border-brand"}`}
      >
        <span>{label}</span>
        <ChevronDown size={13} className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <div
        className={`absolute top-full z-30 mt-1.5 min-w-48 max-w-[calc(100vw-2rem)] rounded-md border border-line bg-white p-3.5 shadow-xl transition-all duration-200 ease-out sm:min-w-56 sm:p-4 ${
          align === "right" ? "right-0 sm:right-auto sm:left-0" : "left-0"
        } ${open ? "block visible translate-y-0 opacity-100" : "hidden invisible -translate-y-1 opacity-0 pointer-events-none"}`}
      >
        {children}
      </div>
    </div>
  );
}
