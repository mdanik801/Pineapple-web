"use client";
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";

export default function SidebarShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <aside>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="btn btn-outline mb-4 w-full lg:hidden"><SlidersHorizontal size={16} /> {open ? "Hide filters" : "Show filters"}</button>
      <div className={`${open ? "block [animation:megaIn_.3s_ease]" : "hidden"} lg:block`}>{children}</div>
    </aside>
  );
}
