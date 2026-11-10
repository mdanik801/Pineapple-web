"use client";
import Image from "next/image";
import { useState } from "react";

export default function CategoryImage({ src, alt, sizes }: { src: string | null; alt: string; sizes: string }) {
  const [unavailable, setUnavailable] = useState(false);
  if (!src || unavailable) return <div aria-hidden="true" className="absolute inset-0 bg-neutral-100" />;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      unoptimized={src.toLowerCase().endsWith(".svg")}
      onError={() => setUnavailable(true)}
      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
    />
  );
}