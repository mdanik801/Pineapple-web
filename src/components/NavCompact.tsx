"use client";

/** Optional compact actions overlay (disabled to keep only the green navigation menu visible while sticky). */
export default function NavCompact({
  name,
  popular,
  brandName,
  logoUrl,
}: {
  name: string | null;
  popular: string[];
  brandName: string;
  logoUrl?: string;
}) {
  void name;
  void popular;
  void brandName;
  void logoUrl;
  return null;
}
