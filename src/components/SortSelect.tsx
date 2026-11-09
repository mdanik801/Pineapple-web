"use client";
import { useRouter } from "next/navigation";

export default function SortSelect({ value, options }: { value: string; options: { value: string; label: string; href: string }[] }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 bg-brand-50 px-3 py-2 text-sm">
      <span className="sr-only">Sort by</span>
      <select value={value} onChange={(e) => router.push(options.find((o) => o.value === e.target.value)!.href, { scroll: false })} className="cursor-pointer bg-transparent py-1 pr-1 outline-none">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
