import Image from "next/image";

type Props = {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
};

export default function CompanySettingsLogo({ src, alt, className = "", priority }: Props) {
  const logo = src?.trim();
  if (!logo) return null;
  return (
    <span className={`relative inline-flex shrink-0 items-center ${className}`} aria-hidden={alt ? undefined : true}>
      <Image
        src={logo}
        alt={alt}
        width={160}
        height={64}
        priority={priority}
        unoptimized={logo.toLowerCase().endsWith(".svg")}
        className="h-full w-auto max-w-full object-contain"
      />
    </span>
  );
}
