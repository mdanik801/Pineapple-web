"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Package, MapPin, Heart, LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth";

const NAV = [["/account", "Profile", User], ["/account/orders", "My Orders", Package], ["/account/addresses", "Addresses", MapPin], ["/wishlist", "Wishlist", Heart]] as const;

export default function AccountNav() {
  const path = usePathname();
  const active = (h: string) => (h === "/account" ? path === "/account" : path.startsWith(h));
  return (
    <nav aria-label="Account" className="no-scrollbar flex gap-2 overflow-x-auto lg:flex-col lg:gap-1 lg:overflow-visible">
      {NAV.map(([href, label, Icon]) => (
        <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}
          className={`group flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3.5 py-2.5 text-sm font-medium lg:gap-3 lg:px-4 lg:py-3 transition-all duration-300 ${active(href) ? "bg-brand text-white shadow-md" : "text-ink/80 hover:bg-brand-50 hover:text-brand lg:hover:translate-x-1"}`}>
          <Icon size={18} className={active(href) ? "text-gold" : "text-gold-dark"} />{label}
        </Link>
      ))}
      <form action={logoutAction} className="lg:mt-3 lg:border-t lg:border-line lg:pt-3">
        <button className="flex w-full shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3.5 py-2.5 text-sm lg:gap-3 lg:px-4 lg:py-3 font-medium text-ink/70 transition-all duration-300 hover:bg-red-50 hover:text-red-600"><LogOut size={18} />Sign out</button>
      </form>
    </nav>
  );
}
