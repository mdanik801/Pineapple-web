import StatusBadge from "./StatusBadge";
import { money, formatDate } from "@/lib/format";

export type OrderData = {
  order_number: string; created_at: string; order_status: string | null; payment_method: string; payment_status: string | null;
  tracking_code: string | null; tracking_url: string | null;
  customer_name: string; customer_phone: string; shipping_address: string; shipping_city: string | null;
  gross_sales: number; total_discount: number | null; shipping_charge: number; net_order_total: number;
  order_items: { id: string; product_name: string; variant_title: string | null; quantity: number; unit_price: number; line_subtotal: number }[];
  order_status_history: { new_status: string; comment: string | null; created_at: string }[] | null;
};

export const ORDER_COLS =
  "order_number,created_at,order_status,payment_method,payment_status,tracking_code,tracking_url,customer_name,customer_phone,shipping_address,shipping_city,gross_sales,total_discount,shipping_charge,net_order_total,order_items(id,product_name,variant_title,quantity,unit_price,line_subtotal),order_status_history(new_status,comment,created_at)";

export default function OrderView({ o, maskPhone }: { o: OrderData; maskPhone?: boolean }) {
  const history = [...(o.order_status_history ?? [])].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
  const phone = maskPhone ? o.customer_phone.slice(0, 3) + "••••" + o.customer_phone.slice(-3) : o.customer_phone;

  return (
    <div className="w-full">
      {/* Header with order number and status */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="break-all font-serif text-xl sm:text-2xl text-brand">Order {o.order_number}</h2>
        <StatusBadge status={o.order_status} />
      </div>

      <p className="mt-1 text-xs sm:text-sm text-muted">
        Placed {formatDate(o.created_at)} · {o.payment_method.toUpperCase()} · Payment: {o.payment_status}
      </p>

      {o.tracking_code && (
        <p className="mt-2 text-xs sm:text-sm">
          Courier tracking: <b>{o.tracking_code}</b>{" "}
          {o.tracking_url && (
            <a href={o.tracking_url} target="_blank" rel="noopener noreferrer" className="text-gold-dark underline">
              Track parcel
            </a>
          )}
        </p>
      )}

      {/* Product Items: Desktop Table View */}
      <div className="mt-6 hidden sm:block overflow-hidden rounded-xl border border-line bg-white shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-50 text-brand">
            <tr>
              <th className="px-4 py-3 font-semibold">Item</th>
              <th className="px-4 py-3 font-semibold">Qty</th>
              <th className="px-4 py-3 text-right font-semibold">Price</th>
              <th className="px-4 py-3 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {o.order_items.map((i) => (
              <tr key={i.id} className="transition-colors hover:bg-neutral-50/70">
                <td className="px-4 py-3">
                  <span className="font-medium text-ink">{i.product_name}</span>
                  {i.variant_title && <span className="block text-xs text-muted">{i.variant_title}</span>}
                </td>
                <td className="px-4 py-3">{i.quantity}</td>
                <td className="px-4 py-3 text-right">{money(i.unit_price)}</td>
                <td className="px-4 py-3 text-right font-medium">{money(i.line_subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Product Items: Mobile Stacked Card View (No Horizontal Scrolling) */}
      <div className="mt-5 space-y-3 sm:hidden">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand">Order Items ({o.order_items.length})</h3>
        <ul className="divide-y divide-line rounded-xl border border-line bg-white shadow-xs">
          {o.order_items.map((i) => (
            <li key={i.id} className="p-4">
              <p className="text-sm font-semibold leading-snug text-ink">{i.product_name}</p>
              {i.variant_title && (
                <span className="mt-1 inline-block rounded bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand">
                  {i.variant_title}
                </span>
              )}
              <div className="mt-2.5 flex items-center justify-between text-xs sm:text-sm">
                <span className="text-muted">
                  Qty: <span className="font-medium text-ink">{i.quantity}</span> × {money(i.unit_price)}
                </span>
                <span className="font-semibold text-brand text-sm">{money(i.line_subtotal)}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Address & Order Summary */}
      <div className="mt-6 grid gap-4 sm:gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-white p-4 sm:p-5 shadow-xs">
          <h3 className="mb-2 font-serif text-base sm:text-lg text-brand">Delivery address</h3>
          <p className="text-xs sm:text-sm leading-relaxed text-ink/85">
            <span className="font-semibold">{o.customer_name}</span>
            <br />
            {phone}
            <br />
            {o.shipping_address}
            {o.shipping_city ? `, ${o.shipping_city}` : ""}
          </p>
        </div>

        <dl className="space-y-2 rounded-xl border border-line bg-white p-4 sm:p-5 text-xs sm:text-sm shadow-xs">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="font-medium">{money(o.gross_sales)}</dd>
          </div>
          {Number(o.total_discount) > 0 && (
            <div className="flex justify-between text-green-700">
              <dt>Discount</dt>
              <dd>-{money(o.total_discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted">Shipping</dt>
            <dd className="font-medium">{o.shipping_charge === 0 ? "FREE" : money(o.shipping_charge)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-sm sm:text-base font-bold text-brand">
            <dt>Total</dt>
            <dd>{money(o.net_order_total)}</dd>
          </div>
        </dl>
      </div>

      {/* Timeline */}
      {history.length > 0 && (
        <div className="mt-7 sm:mt-8">
          <h3 className="mb-3 font-serif text-base sm:text-lg text-brand">Order timeline</h3>
          <ol className="space-y-3.5 border-l-2 border-gold pl-4 sm:pl-5">
            {history.map((h, k) => (
              <li key={k} className="relative">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={h.new_status} />
                  <span className="text-[11px] sm:text-xs text-muted">{formatDate(h.created_at)}</span>
                </div>
                {h.comment && <p className="mt-1 text-xs sm:text-sm text-ink/80 leading-normal">{h.comment}</p>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
