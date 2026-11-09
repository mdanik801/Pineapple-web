import Image from "next/image";

export default function SmartImage({
  src, alt, className, sizes = "(max-width:768px) 50vw, 25vw", priority, fill = true, width, height,
}: {
  src: string | null | undefined; alt: string; className?: string; sizes?: string;
  priority?: boolean; fill?: boolean; width?: number; height?: number;
}) {
  const url = src || "/placeholder.svg";
  const unopt = url.endsWith(".svg");
  return fill ? (
    <Image src={url} alt={alt} fill sizes={sizes} className={className} priority={priority} unoptimized={unopt} />
  ) : (
    <Image src={url} alt={alt} width={width!} height={height!} className={className} priority={priority} unoptimized={unopt} />
  );
}
