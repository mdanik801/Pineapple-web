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
    <div className="container-x max-w-3xl py-8 sm:py-12">
      <h1 className="section-title text-2xl sm:text-3xl">Track your order</h1>
      <p className="mt-2 text-xs sm:text-sm text-muted">No account needed. Enter your order number and the mobile number you used when ordering.</p>
      <form method="get" className="mt-6 grid gap-3.5 rounded-xl border border-line bg-brand-50/50 p-4 sm:p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label className="label text-xs font-semibold uppercase tracking-wider text-brand mb-1.5" htmlFor="n">Order number</label>
          <input id="n" name="n" required defaultValue={n} placeholder="PA-123456" className="input text-sm" />
        </div>
        <div>
          <label className="label text-xs font-semibold uppercase tracking-wider text-brand mb-1.5" htmlFor="p">Mobile number</label>
          <input id="p" name="p" required inputMode="tel" defaultValue={p} placeholder="01XXXXXXXXX" className="input text-sm" />
        </div>
        <button className="btn btn-primary w-full sm:w-auto !py-3 text-xs sm:text-sm touch-manipulation">Track</button>
      </form>
      {error && <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs sm:text-sm text-red-700">{error}</p>}
      {order && <div className="mt-8"><OrderView o={order} /></div>}
      {!order && (
        <p className="mt-6 text-xs sm:text-sm text-muted">
          Have an account?{" "}
          <Link href="/login?next=/account/orders" className="font-semibold text-brand underline">
            Sign in
          </Link>{" "}
          to see all your orders.
        </p>
      )}
    </div>
  );
}
