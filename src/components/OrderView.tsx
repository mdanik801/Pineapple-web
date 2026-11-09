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
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="break-all font-serif text-2xl text-brand">Order {o.order_number}</h2><StatusBadge status={o.order_status} />
      </div>
      <p className="mt-1 text-sm text-muted">Placed {formatDate(o.created_at)} · {o.payment_method.toUpperCase()} · Payment: {o.payment_status}</p>
      {o.tracking_code && <p className="mt-2 text-sm">Courier tracking: <b>{o.tracking_code}</b> {o.tracking_url && <a href={o.tracking_url} target="_blank" rel="noopener noreferrer" className="text-gold-dark underline">Track parcel</a>}</p>}

      <div className="mt-6 overflow-x-auto overscroll-x-contain rounded-xl border border-line bg-white shadow-sm">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-brand-50 text-left"><tr><th className="px-4 py-3">Item</th><th className="px-4 py-3">Qty</th><th className="px-4 py-3 text-right">Price</th><th className="px-4 py-3 text-right">Total</th></tr></thead>
          <tbody className="divide-y divide-line">
            {o.order_items.map((i) => (
              <tr key={i.id}><td className="px-4 py-3">{i.product_name}{i.variant_title && <span className="block text-xs text-muted">{i.variant_title}</span>}</td><td className="px-4 py-3">{i.quantity}</td><td className="px-4 py-3 text-right">{money(i.unit_price)}</td><td className="px-4 py-3 text-right">{money(i.line_subtotal)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
          <h3 className="mb-2 font-serif text-lg text-brand">Delivery address</h3>
          <p className="text-sm leading-6">{o.customer_name}<br />{phone}<br />{o.shipping_address}{o.shipping_city ? `, ${o.shipping_city}` : ""}</p>
        </div>
        <dl className="space-y-2 rounded-xl border border-line bg-white p-5 text-sm shadow-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(o.gross_sales)}</dd></div>
          {Number(o.total_discount) > 0 && <div className="flex justify-between"><dt>Discount</dt><dd>-{money(o.total_discount)}</dd></div>}
          <div className="flex justify-between"><dt>Shipping</dt><dd>{money(o.shipping_charge)}</dd></div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-bold text-brand"><dt>Total</dt><dd>{money(o.net_order_total)}</dd></div>
        </dl>
      </div>

      {history.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 font-serif text-lg text-brand">Order timeline</h3>
          <ol className="space-y-3 border-l-2 border-gold pl-5">
            {history.map((h, k) => (
              <li key={k}><StatusBadge status={h.new_status} /> <span className="ml-2 text-xs text-muted">{formatDate(h.created_at)}</span>{h.comment && <p className="mt-1 text-sm text-muted">{h.comment}</p>}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
