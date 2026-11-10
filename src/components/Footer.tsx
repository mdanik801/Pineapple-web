import Link from "next/link";
import Image from "next/image";
import { getPolicies, getPaymentMethods, getSettings, getSocial } from "@/lib/data";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

export default async function Footer() {
  const [settings, social, policies, paymentMethods] = await Promise.all([
    getSettings(), getSocial(), getPolicies(), getPaymentMethods(),
  ]);
  const brandName = settings?.brand_name?.trim() || settings?.company_name?.trim() || "";
  const logo = settings?.company_logo?.trim() || "";
  const policyLinks: [string, string, string][] = [
    ["About us", "about_us", "/pages/about"],
    ["Delivery policy", "shipping_policy", "/pages/shipping"],
    ["Exchange policy", "return_policy", "/pages/returns"],
    ["Privacy policy", "privacy_policy", "/pages/privacy"],
    ["Terms & conditions", "terms_conditions", "/pages/terms"],
  ];
  const socialLinks = Object.entries(social).flatMap(([key, value]) => {
    const url = value?.trim();
    if (!url) return [];
    if (/^https?:\/\//i.test(url)) return [[key, url]];
    if (key.toLowerCase() === "whatsapp") {
      const number = url.replace(/\D/g, "");
      return number ? [["WhatsApp", `https://wa.me/${number}`]] : [];
    }
    return [];
  });
  return (
    <footer className="mt-16 bg-[#111111] text-white/75 sm:mt-24">
      <div className="container-x grid gap-x-10 gap-y-12 py-12 sm:py-16 md:grid-cols-2 lg:grid-cols-4">
        <div>
          {(logo || brandName) && <Link href="/" aria-label={brandName ? `${brandName} home` : "Home"} className="inline-flex min-h-10 items-center">
            {logo
              ? <Image src={logo} alt={brandName} width={176} height={64} unoptimized={logo.toLowerCase().endsWith(".svg")} className="h-10 w-auto max-w-44 object-contain brightness-0 invert" />
              : <span className="font-serif text-lg text-white">{brandName}</span>}
          </Link>}
          {settings?.description && <p className="mt-5 max-w-xs text-sm leading-7">{settings.description}</p>}
        </div>
        <div>
          <h3 className="mb-5 text-[10px] font-medium uppercase tracking-[.2em] text-white">Information</h3>
          <ul className="space-y-3 text-sm">
            {policies.about_us && <li><Link href="/pages/about" className="hover:text-white">About us</Link></li>}
            {settings?.website && /^https?:\/\//i.test(settings.website) && <li><a href={settings.website} target="_blank" rel="noopener noreferrer" className="hover:text-white">Website</a></li>}
            {settings?.office_address || settings?.address ? <li className="flex gap-2 leading-6"><MapPin size={15} className="mt-1 shrink-0" />{settings.office_address || settings.address}</li> : null}
          </ul>
        </div>
        <div>
          <h3 className="mb-5 text-[10px] font-medium uppercase tracking-[.2em] text-white">Policies</h3>
          <ul className="space-y-3 text-sm">
            {policyLinks.filter(([, key]) => policies[key]).map(([label, key, href]) => (
              <li key={key}><Link href={href} className="hover:text-white">{label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-5 text-[10px] font-medium uppercase tracking-[.2em] text-white">Customer service</h3>
          <ul className="space-y-3 text-sm">
            {(settings?.support_phone || settings?.phone) && <li className="flex gap-2"><Phone size={15} className="mt-0.5 shrink-0" /><a href={`tel:${settings.support_phone || settings.phone}`} className="hover:text-white">{settings.support_phone || settings.phone}</a></li>}
            {(settings?.support_email || settings?.email) && <li className="flex gap-2"><Mail size={15} className="mt-0.5 shrink-0" /><a href={`mailto:${settings.support_email || settings.email}`} className="break-all hover:text-white">{settings.support_email || settings.email}</a></li>}
            {settings?.business_hours && <li className="flex gap-2 leading-6"><Clock size={15} className="mt-1 shrink-0" />{settings.business_hours}</li>}
          </ul>
        </div>
        <div>
          <h3 className="mb-5 text-[10px] font-medium uppercase tracking-[.2em] text-white">Social media</h3>
          <ul className="space-y-3 text-sm">
            {socialLinks.map(([label, url]) => <li key={label}><a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-white">{label}</a></li>)}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="container-x flex flex-col gap-4 py-5 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()}{brandName ? ` ${brandName}` : ""}</p>
          {paymentMethods.length > 0 && <div className="flex flex-wrap items-center gap-2" aria-label="Enabled payment methods">
            <span className="mr-1 uppercase tracking-[.14em]">Payment</span>
            {paymentMethods.map((method) => <span key={method.gateway_id} className="border border-white/20 px-2.5 py-1">{method.name}</span>)}
          </div>}
        </div>
      </div>
    </footer>
  );
}
