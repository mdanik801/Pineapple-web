import Link from "next/link";
import { db } from "@/lib/supabase";
import { phoneKey } from "@/lib/customers";
import OrderView, { ORDER_COLS, type OrderData } from "@/components/OrderView";

export const metadata = { title: "Track Order" };

export default async function TrackOrder({ searchParams }: { searchParams: Promise<{ n?: string; p?: string }> }) {
  const { n = "", p = "" } = await searchParams;
  const number = n.trim().toUpperCase();
  let order: OrderData | null = null;
  let error = "";
  if (number && p) {
    const { data } = await db.from("orders").select(ORDER_COLS).eq("order_number", number).maybeSingle();
    // Order is revealed only if the phone number matches the one used on the order.
    if (data && phoneKey(data.customer_phone) === phoneKey(p) && phoneKey(p).length === 11) order = data as unknown as OrderData;
    else error = "No order found with that order number and phone number. Please check and try again.";
  }
  return (
    <div className="container-x max-w-3xl py-12">
      <h1 className="section-title">Track your order</h1>
      <p className="mt-2 text-sm text-muted">No account needed. Enter your order number and the mobile number you used when ordering.</p>
      <form method="get" className="mt-6 grid gap-4 border border-line bg-brand-50/50 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div><label className="label" htmlFor="n">Order number</label><input id="n" name="n" required defaultValue={n} placeholder="PA-123456" className="input" /></div>
        <div><label className="label" htmlFor="p">Mobile number</label><input id="p" name="p" required inputMode="tel" defaultValue={p} placeholder="01XXXXXXXXX" className="input" /></div>
        <button className="btn btn-primary">Track</button>
      </form>
      {error && <p role="alert" className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {order && <div className="mt-8"><OrderView o={order} /></div>}
      {!order && <p className="mt-6 text-sm text-muted">Have an account? <Link href="/login?next=/account/orders" className="font-semibold text-brand underline">Sign in</Link> to see all your orders.</p>}
    </div>
  );
}
