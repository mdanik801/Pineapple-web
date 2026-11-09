import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, ChevronRight } from "lucide-react";
import { getCustomer } from "@/lib/session";
import { db } from "@/lib/supabase";
import { money, formatDate } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

export const metadata = { title: "My Orders" };

export default async function Orders() {
  const me = await getCustomer();
  if (!me) redirect("/login?next=/account/orders");
  const { data: orders } = await db.from("orders")
    .select("id,order_number,created_at,order_status,payment_status,net_order_total,order_items(quantity)")
    .eq("customer_id", me.id).order("created_at", { ascending: false });
  return (
    <div className="min-w-0">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-brand">My Orders</h1>
          <p className="mt-1 text-sm text-muted">{orders?.length ?? 0} order{orders?.length === 1 ? "" : "s"}</p>
        </div>
      </div>

      {!orders?.length ? (
        <div className="rounded-xl border border-line bg-white px-6 py-16 text-center shadow-sm">
          <Package size={44} className="mx-auto text-brand/30" />
          <p className="mt-4 text-muted">You haven&apos;t placed any orders yet.</p>
          <Link href="/shop" className="btn btn-primary mt-6">Start shopping</Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
          {/* only the table scrolls sideways on small screens */}
          <div className="overflow-x-auto overscroll-x-contain [scrollbar-width:thin]">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="bg-brand text-xs uppercase tracking-wider text-white">
                  <th className="sticky left-0 z-10 bg-brand px-4 py-3.5 font-semibold">Order</th>
                  <th className="px-4 py-3.5 font-semibold">Date</th>
                  <th className="px-4 py-3.5 font-semibold">Items</th>
                  <th className="px-4 py-3.5 font-semibold">Total</th>
                  <th className="px-4 py-3.5 font-semibold">Status</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((o) => (
                  <tr key={o.id} className="group transition-colors hover:bg-brand-50/60">
                    <td className="sticky left-0 z-10 bg-white px-4 py-4 font-semibold text-brand transition-colors group-hover:bg-[#f3f7f5]">{o.order_number}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-ink/80">{formatDate(o.created_at)}</td>
                    <td className="px-4 py-4">{o.order_items?.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0)}</td>
                    <td className="whitespace-nowrap px-4 py-4 font-semibold">{money(o.net_order_total)}</td>
                    <td className="px-4 py-4"><StatusBadge status={o.order_status} /></td>
                    <td className="px-4 py-4 text-right">
                      <Link href={`/account/orders/${o.order_number}`} className="inline-flex items-center gap-1 whitespace-nowrap font-semibold text-gold-dark transition-all group-hover:gap-2">View <ChevronRight size={15} /></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line bg-[#fafbfa] px-4 py-2 text-center text-[11px] text-muted md:hidden">← Swipe the table to see more →</p>
        </div>
      )}
    </div>
  );
}
