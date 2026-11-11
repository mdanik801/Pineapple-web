import Link from "next/link";
import Image from "next/image";
import { getCategories, getPaymentMethods, getSettings, getSocial } from "@/lib/data";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { categoryHref } from "@/lib/slug";
import AnimatedLogo from "./AnimatedLogo";

export default async function Footer() {
  const [settings, social, paymentMethods, cats] = await Promise.all([
    getSettings(),
    getSocial(),
    getPaymentMethods(),
    getCategories(),
  ]);

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
  const email = settings?.support_email?.trim() || settings?.email?.trim() || "support@almuslim.com";
  const businessHours =
    settings?.business_hours?.trim() || "Sat - Thu: 9:00 AM - 8:00 PM (Friday Closed)";

  const topCats = cats.filter((c) => !c.parent_id);
  const shopLinks =
    topCats.length > 0
      ? topCats.slice(0, 5).map((c) => ({ label: c.name, href: categoryHref(c.slug) }))
      : [
          { label: "Men Fashion", href: "/category/men" },
          { label: "Women Fashion", href: "/category/women" },
          { label: "Kids & Baby", href: "/category/kids-baby" },
          { label: "Fabrics & Textiles", href: "/category/fabrics-textiles" },
        ];

  const parsedSocial: [string, string][] = Object.entries(social).flatMap(([key, value]) => {
    const url = value?.trim();
    if (!url) return [];
    if (/^https?:\/\//i.test(url)) return [[key, url] as [string, string]];
    if (key.toLowerCase() === "whatsapp") {
      const number = url.replace(/\D/g, "");
      return number ? [["WhatsApp", `https://wa.me/${number}`] as [string, string]] : [];
    }
    return [];
  });

  const socialLinks: [string, string][] =
    parsedSocial.length > 0
      ? parsedSocial
      : [
          ["Facebook", "#"],
          ["Instagram", "#"],
          ["YouTube", "#"],
        ];

  const accountLinks = [
    { label: "Profile", href: "/account" },
    { label: "Orders", href: "/account/orders" },
    { label: "Addresses", href: "/account/addresses" },
    { label: "Wishlist", href: "/wishlist" },
    { label: "Cart", href: "/cart" },
    { label: "Track Order", href: "/track-order" },
    { label: "Shipping Policy", href: "/pages/shipping" },
    { label: "Return Policy", href: "/pages/returns" },
  ];

  return (
    <footer className="mt-16 bg-[#0A3C2A] text-white sm:mt-24">
      <div className="container-x grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 md:grid-cols-4 md:gap-8 lg:gap-12 lg:py-14">
        {/* Column 1: Brand & Description & Social */}
        <div>
          <Link href="/" aria-label={brandName ? `${brandName} home` : "Home"} className="inline-block">
            <div className="flex flex-wrap items-center justify-start gap-4 sm:gap-5 rounded bg-white px-3 py-2.5 shadow-xs transition-opacity hover:opacity-95">
              <span className="flex h-12 w-auto max-w-[160px] items-center justify-center sm:h-14 sm:max-w-[200px] lg:h-16 lg:max-w-[220px]">
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
          <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-white/80">{description}</p>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-[13px] font-medium text-[#C49A3E]">
            {socialLinks.map(([label, url]) => (
              <a
                key={label}
                href={url}
                target={url === "#" ? undefined : "_blank"}
                rel={url === "#" ? undefined : "noopener noreferrer"}
                className="capitalize transition-colors hover:text-white"
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Column 2: Shop */}
        <div>
          <h3 className="mb-4 font-serif text-lg font-medium text-[#C49A3E]">Shop</h3>
          <ul className="space-y-2.5 text-[13px] text-white/80">
            <li>
              <Link href="/shop" className="transition-colors hover:text-white">
                All Products
              </Link>
            </li>
            {shopLinks.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="transition-colors hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: My Account */}
        <div>
          <h3 className="mb-4 font-serif text-lg font-medium text-[#C49A3E]">My Account</h3>
          <ul className="space-y-2.5 text-[13px] text-white/80">
            {accountLinks.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="transition-colors hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Contact */}
        <div>
          <h3 className="mb-4 font-serif text-lg font-medium text-[#C49A3E]">Contact</h3>
          <ul className="space-y-3.5 text-[13px] text-white/80">
            <li className="flex items-start gap-3 leading-relaxed">
              <MapPin size={16} className="mt-0.5 shrink-0 text-[#C49A3E]" />
              <span>{address}</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={15} className="shrink-0 text-[#C49A3E]" />
              <a href={`tel:${phone.replace(/\s+/g, "")}`} className="transition-colors hover:text-white">
                {phone}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={15} className="shrink-0 text-[#C49A3E]" />
              <a href={`mailto:${email}`} className="break-all transition-colors hover:text-white">
                {email}
              </a>
            </li>
            <li className="flex items-start gap-3 leading-relaxed">
              <Clock size={15} className="mt-0.5 shrink-0 text-[#C49A3E]" />
              <span>{businessHours}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar: Copyright */}
      <div className="border-t border-[#2C5747]">
        <div className="container-x flex flex-col items-center justify-center gap-2 py-4 text-center text-xs text-white/70 sm:py-5">
          <p>© {new Date().getFullYear()} {brandName}. All rights reserved.</p>
          {paymentMethods.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1" aria-label="Enabled payment methods">
              {paymentMethods.map((method) => (
                <span key={method.gateway_id} className="rounded border border-white/15 px-2 py-0.5 text-[10px] text-white/60">
                  {method.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
