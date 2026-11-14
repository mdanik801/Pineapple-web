import type { Metadata } from "next";
import { Inter, Playfair_Display, Cinzel } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import ChromeGate from "@/components/ChromeGate";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import { getSettings, getShippingZones } from "@/lib/data";
import { money } from "@/lib/format";

const sans = Inter({ variable: "--font-sans-var", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const serif = Playfair_Display({ variable: "--font-serif-var", subsets: ["latin"] });
const cinzel = Cinzel({ variable: "--font-cinzel-var", subsets: ["latin"], weight: ["600", "700"] });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const brandName = settings?.brand_name?.trim() || settings?.company_name?.trim();
  const description = settings?.description?.trim();
  return {
    title: brandName
      ? { default: brandName, template: `%s | ${brandName}` }
      : { default: "Pineapple", template: "%s | Pineapple" },
    ...(description ? { description } : {}),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const free = (await getShippingZones()).find((z) => z.free_shipping_threshold != null);
  const note = free ? `Delivery is FREE inside ${free.name} on orders over ${money(free.free_shipping_threshold)}. Shipping calculated at checkout.` : undefined;
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${cinzel.variable}`}>
      <body suppressHydrationWarning className="flex min-h-screen flex-col">
        <ChromeGate><Header /></ChromeGate>
        <main className="flex-1 w-full min-w-0">{children}</main>
        <ChromeGate><Footer /></ChromeGate>
        <CartDrawer note={note} />
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
      </body>
    </html>
  );
}
