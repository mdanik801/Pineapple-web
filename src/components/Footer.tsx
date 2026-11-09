import Link from "next/link";
import Image from "next/image";
import { getCategories, getSettings, getSocial } from "@/lib/data";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

export default async function Footer() {
  const [cats, s, social] = await Promise.all([getCategories(), getSettings(), getSocial()]);
  const top = cats.filter((c) => !c.parent_id);
  const links: [string, string | undefined][] = [["Facebook", social.facebook], ["Instagram", social.instagram], ["YouTube", social.youtube]];
  return (
    <footer className="mt-20 bg-brand text-white/85">
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="inline-block bg-white p-2"><Image src="/logo-full.jpg" alt="Pineapple" width={140} height={96} className="h-14 w-auto" /></div>
          <p className="mt-4 text-sm leading-relaxed">{s?.description ?? "Premium fashion & lifestyle."}</p>
          <div className="mt-4 flex gap-4 text-sm">
            {links.filter(([, u]) => u).map(([n, u]) => <a key={n} href={u} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">{n}</a>)}
          </div>
        </div>
        <div>
          <h3 className="mb-4 font-serif text-lg text-gold">Shop</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/shop" className="hover:text-gold">All Products</Link></li>
            {top.map((c) => <li key={c.id}><Link href={`/category/${c.slug}`} className="hover:text-gold">{c.name}</Link></li>)}
          </ul>
        </div>
        <div>
          <h3 className="mb-4 font-serif text-lg text-gold">My Account</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/account" className="hover:text-gold">Profile</Link></li>
            <li><Link href="/account/orders" className="hover:text-gold">Orders</Link></li>
            <li><Link href="/account/addresses" className="hover:text-gold">Addresses</Link></li>
            <li><Link href="/wishlist" className="hover:text-gold">Wishlist</Link></li>
            <li><Link href="/cart" className="hover:text-gold">Cart</Link></li>
            <li><Link href="/track-order" className="hover:text-gold">Track Order</Link></li>
            <li><Link href="/pages/shipping" className="hover:text-gold">Shipping Policy</Link></li>
            <li><Link href="/pages/returns" className="hover:text-gold">Return Policy</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 font-serif text-lg text-gold">Contact</h3>
          <ul className="space-y-3 text-sm">
            {(s?.office_address ?? s?.address) && <li className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-gold" />{s?.office_address ?? s?.address}</li>}
            {(s?.support_phone ?? s?.phone) && <li className="flex gap-2"><Phone size={16} className="mt-0.5 shrink-0 text-gold" />{s?.support_phone ?? s?.phone}</li>}
            {(s?.support_email ?? s?.email) && <li className="flex gap-2"><Mail size={16} className="mt-0.5 shrink-0 text-gold" />{s?.support_email ?? s?.email}</li>}
            {s?.business_hours && <li className="flex gap-2"><Clock size={16} className="mt-0.5 shrink-0 text-gold" />{s.business_hours}</li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15 py-5 text-center text-xs">© {new Date().getFullYear()} Pineapple. All rights reserved.</div>
    </footer>
  );
}
