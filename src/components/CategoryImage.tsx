"use client";
import Image from "next/image";
import { useState } from "react";

export default function CategoryImage({ src, alt, sizes }: { src: string | null; alt: string; sizes: string }) {
  const [unavailable, setUnavailable] = useState(false);
  const imageSrc = !unavailable && src ? src : "/placeholder.svg";
  const isSvg = typeof imageSrc === "string" && imageSrc.toLowerCase().endsWith(".svg");

  return (
    <Image
      src={imageSrc}
      alt={alt || "Category image"}
      fill
      sizes={sizes}
      unoptimized={isSvg}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      onError={() => setUnavailable(true)}
      className="pointer-events-none object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
    />
  );
}
