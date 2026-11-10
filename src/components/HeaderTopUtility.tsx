"use client";
import Link from "next/link";
import { useStore, useMounted } from "@/lib/store";

type HeaderTopUtilityProps = {
  name: string | null;
  brandName: string;
};

export default function HeaderTopUtility({ name, brandName }: HeaderTopUtilityProps) {
  const setDrawer = useStore((s) => s.setDrawer);
  const wishCount = useStore((s) => s.wishlist.length);
  const mounted = useMounted();

  return (
    <div className="hidden border-b border-neutral-100 bg-white md:block">
      <div className="container-x flex h-9 items-center justify-between text-[12px] text-neutral-600">
        {/* Left: Brand lifestyle link */}
        <Link
          href="/about"
          className="font-medium text-neutral-700 transition-colors hover:text-[#0A3C2A]"
        >
          {brandName} Life
        </Link>

        {/* Right: Utility Links matching reference design */}
        <div className="flex items-center gap-5 lg:gap-7">
          <Link
            href={name ? "/account" : "/login"}
            className="transition-colors hover:text-[#0A3C2A]"
          >
            {name ? `Hi, ${name}` : "Log In"}
          </Link>
          <Link href="/about" className="transition-colors hover:text-[#0A3C2A]">
            About Us
          </Link>
          <Link href="/wishlist" className="transition-colors hover:text-[#0A3C2A]">
            My Wishlist{mounted && wishCount > 0 ? ` (${wishCount})` : ""}
          </Link>
          <button
            type="button"
            onClick={() => setDrawer(true)}
            className="cursor-pointer transition-colors hover:text-[#0A3C2A]"
          >
            Cart
          </button>
          <Link href="/track-order" className="transition-colors hover:text-[#0A3C2A]">
            Track Order
          </Link>
        </div>
      </div>
    </div>
  );
}
