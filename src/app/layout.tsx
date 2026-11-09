import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import ChromeGate from "@/components/ChromeGate";
import { getShippingZones } from "@/lib/data";
import { money } from "@/lib/format";

const sans = Inter({ variable: "--font-sans-var", subsets: ["latin"] });
const serif = Playfair_Display({ variable: "--font-serif-var", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Pineapple — Premium Fashion & Lifestyle", template: "%s | Pineapple" },
  description: "Shop premium fashion for men, women and kids at Pineapple. Cash on delivery across Bangladesh.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const free = (await getShippingZones()).find((z) => z.free_shipping_threshold != null);
  const note = free ? `Delivery is FREE inside ${free.name} on orders over ${money(free.free_shipping_threshold)}. Shipping calculated at checkout.` : undefined;
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body suppressHydrationWarning className="flex min-h-screen flex-col">
        <ChromeGate><Header /></ChromeGate>
        <main className="flex-1">{children}</main>
        <ChromeGate><Footer /></ChromeGate>
        <CartDrawer note={note} />
      </body>
    </html>
  );
}
