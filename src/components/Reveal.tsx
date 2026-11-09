"use client";
import { useEffect, useRef, useState } from "react";

/** Fades/slides children in once when scrolled into view. */
export default function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }, { rootMargin: "0px 0px -8% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none ${shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0 motion-reduce:opacity-100 motion-reduce:translate-y-0"} ${className}`}>
      {children}
    </div>
  );
}
