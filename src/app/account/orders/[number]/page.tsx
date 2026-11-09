import { redirect } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomer } from "@/lib/session";
import { db } from "@/lib/supabase";
import OrderView, { ORDER_COLS, type OrderData } from "@/components/OrderView";

export default async function OrderDetail({ params }: { params: Promise<{ number: string }> }) {
  const [{ number }, me] = await Promise.all([params, getCustomer()]);
  if (!me) redirect("/login?next=/account/orders");
  const { data } = await db.from("orders").select(ORDER_COLS).eq("order_number", number).eq("customer_id", me.id).maybeSingle();
  if (!data) notFound();
  return (
    <div className="min-w-0">
      <Link href="/account/orders" className="text-sm text-muted hover:text-brand">← All orders</Link>
      <div className="mt-3"><OrderView o={data as unknown as OrderData} /></div>
    </div>
  );
}
