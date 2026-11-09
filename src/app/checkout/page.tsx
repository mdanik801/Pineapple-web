import type { Metadata } from "next";
import { getCustomer } from "@/lib/session";
import { db } from "@/lib/supabase";
import { getShippingZones } from "@/lib/data";
import CheckoutForm from "@/components/CheckoutForm";

export const metadata: Metadata = { title: "Checkout" };

export default async function Checkout({ searchParams }: { searchParams: Promise<{ buy?: string }> }) {
  const [me, zones, sp] = await Promise.all([getCustomer(), getShippingZones(), searchParams]);
  const { data: addresses } = me
    ? await db.from("customer_addresses").select("id,recipient_name,phone,address_line,city,zone,is_default").eq("customer_id", me.id).order("is_default", { ascending: false })
    : { data: [] };
  return (
    <CheckoutForm
      zones={zones}
      addresses={addresses ?? []}
      buyNowMode={sp.buy === "1"}
      me={me ? { first: me.first_name, last: me.last_name ?? "", phone: me.phone, email: me.email ?? "" } : null}
    />
  );
}
