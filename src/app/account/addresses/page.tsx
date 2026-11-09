import { redirect } from "next/navigation";
import { getCustomer } from "@/lib/session";
import { db } from "@/lib/supabase";
import { getShippingZones } from "@/lib/data";
import AddressList from "@/components/AddressList";

export const metadata = { title: "My Addresses" };

export default async function Addresses() {
  const me = await getCustomer();
  if (!me) redirect("/login?next=/account");
  const [{ data }, zones] = await Promise.all([
    db.from("customer_addresses").select("*").eq("customer_id", me.id).order("is_default", { ascending: false }).order("created_at"),
    getShippingZones(),
  ]);
  return (
    <div>
      <AddressList addresses={data ?? []} zones={zones.map((z) => z.name)} />
    </div>
  );
}
