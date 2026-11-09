"use client";
import { usePathname } from "next/navigation";

/** Hides site header/footer on the checkout screen (which has its own minimal header). */
export default function ChromeGate({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return path.startsWith("/checkout") ? null : <>{children}</>;
}
