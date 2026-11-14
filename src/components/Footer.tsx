import Link from "next/link";
import Image from "next/image";
import { getSettings } from "@/lib/data";
import { Phone, Mail, MapPin } from "lucide-react";

export default async function Footer() {
  const settings = await getSettings();

  const brandName = settings?.brand_name?.trim() || settings?.company_name?.trim() || "Pineapple";
  const logo = settings?.company_logo?.trim() || "/logo-full.jpg";
  const description =
    settings?.description?.trim() ||
    "Leading export-quality modest fashion and garments manufacturer in Bangladesh since 1992.";

  const address =
    settings?.office_address?.trim() ||
    settings?.address?.trim() ||
    "Plot 14, Sector 3, Uttara Commercial Area, Dhaka-1230, Bangladesh";
  const phone = settings?.support_phone?.trim() || settings?.phone?.trim() || "+880 1700-000000";
  const email = settings?.support_email?.trim() || settings?.email?.trim() || "support@pineapple.com";

  // Display existing Admin-managed contact values; support comma/newline separated multiple entries.
  const phones = phone.split(/[\n,;]+/).map((v: string) => v.trim()).filter(Boolean);
  const emails = email.split(/[\n,;]+/).map((v: string) => v.trim()).filter(Boolean);

  return (
    <footer className="mt-12 bg-[#0A3C2A] text-white sm:mt-16">
      <div className="container-x grid grid-cols-1 gap-6 py-7 sm:py-8 md:grid-cols-2 md:items-start md:gap-10 lg:gap-14">
        {/* Left: Brand */}
        <div className="min-w-0">
          <Link href="/" aria-label={brandName ? `${brandName} home` : "Home"} className="inline-block">
            <div className="inline-flex items-center justify-start rounded bg-white px-3 py-2 shadow-xs transition-opacity hover:opacity-95">
              <span className="flex h-10 w-auto max-w-[150px] items-center justify-center sm:h-12 sm:max-w-[180px]">
                <Image
                  src={logo}
                  alt={brandName}
                  width={220}
                  height={80}
                  priority
                  unoptimized={logo.toLowerCase().endsWith(".svg")}
                  className="h-full w-auto max-w-full object-contain"
                />
              </span>
            </div>
          </Link>
          <p className="mt-3 max-w-md text-[13px] leading-relaxed text-white/80">{description}</p>
        </div>

        {/* Right: Contact Information (existing Admin-managed data) */}
        <div className="min-w-0 md:justify-self-end md:w-full md:max-w-xl">
          <h3 className="mb-3 font-serif text-lg font-medium text-[#C49A3E]">Contact</h3>
          <ul className="space-y-2.5 text-[13px] text-white/85">
            <li className="flex items-start gap-3">
              <Phone size={15} className="mt-0.5 shrink-0 text-[#C49A3E]" aria-hidden="true" />
              <div className="flex flex-col gap-1">
                {phones.map((p: string, i: number) => (
                  <a key={`${p}-${i}`} href={`tel:${p.replace(/\s+/g, "")}`} className="transition-colors hover:text-white">
                    {p}
                  </a>
                ))}
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Mail size={15} className="mt-0.5 shrink-0 text-[#C49A3E]" aria-hidden="true" />
              <div className="flex flex-col gap-1">
                {emails.map((e: string, i: number) => (
                  <a key={`${e}-${i}`} href={`mailto:${e}`} className="break-all transition-colors hover:text-white">
                    {e}
                  </a>
                ))}
              </div>
            </li>
            <li className="flex items-start gap-3 leading-relaxed">
              <MapPin size={16} className="mt-0.5 shrink-0 text-[#C49A3E]" aria-hidden="true" />
              <span className="whitespace-pre-line">{address}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Copyright Row */}
      <div className="border-t border-[#2C5747]">
        <div className="container-x py-3 text-center text-xs text-white/70 sm:py-3.5">
          <p>© {new Date().getFullYear()} {brandName || "Pineapple"}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
