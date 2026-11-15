"use client";

import { resolveSwatchBackground } from "@/lib/color";

export default function ColorSwatch({
  name,
  value,
  selected,
  size = 28,
  className = "",
  title,
}: {
  name?: string | null;
  value?: string | null;
  selected?: boolean;
  size?: number;
  className?: string;
  title?: string;
}) {
  const { background, border } = resolveSwatchBackground(name, value);
  const label = title ?? (name || "Color");
  return (
    <span
      aria-hidden="true"
      title={label}
      className={`inline-block rounded-full shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background,
        border: `1.5px solid ${selected ? "transparent" : (border || "rgba(0,0,0,0.12)")}`,
        boxShadow: selected ? "0 0 0 2px #fff, 0 0 0 4px #0A3C2A" : "inset 0 0 0 1px rgba(255,255,255,0.15)",
      }}
    />
  );
}
