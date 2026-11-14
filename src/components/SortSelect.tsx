"use client";
import { useRouter } from "next/navigation";

export default function SortSelect({ value, options }: { value: string; options: { value: string; label: string; href: string }[] }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-1.5 rounded-xs border border-line bg-brand-50/70 px-2.5 py-1.5 text-[11px] text-ink transition-colors hover:border-brand sm:px-3 sm:py-1.5 sm:text-xs">
      <span className="hidden text-[10px] font-bold uppercase tracking-wider text-muted sm:inline">Sort:</span>
      <select
        value={value}
        aria-label="Sort products"
        onChange={(e) => router.push(options.find((o) => o.value === e.target.value)!.href, { scroll: false })}
        className="cursor-pointer bg-transparent text-[11px] font-medium text-ink outline-none sm:text-xs"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
