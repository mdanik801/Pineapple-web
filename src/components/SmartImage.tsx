"use client";
import Image from "next/image";
import { useState } from "react";

export default function SmartImage({
  src,
  alt,
  className,
  sizes = "(max-width:768px) 50vw, 25vw",
  priority,
  fill = true,
  width,
  height,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
}) {
  const [error, setError] = useState(false);
  const url = !error && src ? src : "/placeholder.svg";
  const unopt = typeof url === "string" && url.endsWith(".svg");

  return fill ? (
    <Image
      src={url}
      alt={alt || "Product image"}
      fill
      sizes={sizes}
      className={className}
      priority={priority}
      unoptimized={unopt}
      onError={() => {
        if (!error) setError(true);
      }}
    />
  ) : (
    <Image
      src={url}
      alt={alt || "Product image"}
      width={width ?? 400}
      height={height ?? 500}
      className={className}
      priority={priority}
      unoptimized={unopt}
      onError={() => {
        if (!error) setError(true);
      }}
    />
  );
}
