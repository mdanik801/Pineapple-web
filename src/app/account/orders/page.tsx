import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, ChevronRight, Calendar, ShoppingBag } from "lucide-react";
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
          <h1 className="font-serif text-2xl sm:text-3xl text-brand">My Orders</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted">{orders?.length ?? 0} order{orders?.length === 1 ? "" : "s"}</p>
        </div>
      </div>

      {!orders?.length ? (
        <div className="rounded-xl border border-line bg-white px-6 py-16 text-center shadow-xs">
          <Package size={44} className="mx-auto text-brand/30" />
          <p className="mt-4 text-muted">You haven&apos;t placed any orders yet.</p>
          <Link href="/shop" className="btn btn-primary mt-6">Start shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile Stacked Orders List */}
          <div className="space-y-3 md:hidden">
            {orders.map((o) => {
              const itemCount = o.order_items?.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0) ?? 0;
              return (
                <div key={o.id} className="rounded-xl border border-line bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-muted">Order</span>
                      <p className="font-semibold text-brand text-sm">{o.order_number}</p>
                    </div>
                    <StatusBadge status={o.order_status} />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-muted">
                      <Calendar size={13} className="shrink-0 text-gold-dark" />
                      <span>{formatDate(o.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted justify-end">
                      <ShoppingBag size={13} className="shrink-0 text-gold-dark" />
                      <span>{itemCount} item{itemCount === 1 ? "" : "s"}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                    <div>
                      <span className="text-[10px] uppercase text-muted">Total</span>
                      <p className="text-sm font-bold text-ink">{money(o.net_order_total)}</p>
                    </div>
                    <Link
                      href={`/account/orders/${o.order_number}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-gold-dark hover:underline"
                    >
                      View details <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-line bg-white shadow-xs">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-brand text-xs uppercase tracking-wider text-white">
                  <th className="px-4 py-3.5 font-semibold">Order</th>
                  <th className="px-4 py-3.5 font-semibold">Date</th>
                  <th className="px-4 py-3.5 font-semibold">Items</th>
                  <th className="px-4 py-3.5 font-semibold">Total</th>
                  <th className="px-4 py-3.5 font-semibold">Status</th>
                  <th className="px-4 py-3.5 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((o) => (
                  <tr key={o.id} className="group transition-colors hover:bg-brand-50/60">
                    <td className="px-4 py-4 font-semibold text-brand">{o.order_number}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-ink/80">{formatDate(o.created_at)}</td>
                    <td className="px-4 py-4">{o.order_items?.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0)}</td>
                    <td className="whitespace-nowrap px-4 py-4 font-semibold">{money(o.net_order_total)}</td>
                    <td className="px-4 py-4"><StatusBadge status={o.order_status} /></td>
                    <td className="px-4 py-4 text-right">
                      <Link href={`/account/orders/${o.order_number}`} className="inline-flex items-center gap-1 whitespace-nowrap font-semibold text-gold-dark transition-all group-hover:gap-2">
                        View <ChevronRight size={15} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
