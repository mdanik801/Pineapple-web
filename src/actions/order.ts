"use server";
import { randomInt } from "node:crypto";
import { db } from "@/lib/supabase";
import { getCustomer, createSession } from "@/lib/session";
import { createCustomer, BD_PHONE, linkGuestOrders } from "@/lib/customers";
import { effectivePrice } from "@/lib/format";
import { getShippingZones } from "@/lib/data";

export type OrderInput = {
  items: { productId: string; variantId: string | null; qty: number }[];
  name: string; phone: string; email: string;
  address: string; city: string; zone: string;
  notes: string; payment: "cod";
  saveAddress?: boolean;
  createAccount?: boolean; password?: string;
};

export type OrderResult = { error: string } | { orderNumber: string };

export async function placeOrderAction(input: OrderInput): Promise<OrderResult> {
  const name = input.name.trim(), phone = input.phone.replace(/[\s-]/g, ""), address = input.address.trim();
  if (!name || !address || !input.city.trim()) return { error: "Please fill in name, address and city." };
  if (!BD_PHONE.test(phone)) return { error: "Enter a valid Bangladeshi mobile number." };
  if (!input.items?.length) return { error: "Your cart is empty." };
  if (input.items.length > 50) return { error: "Too many items in one order." };

  const zones = await getShippingZones();
  const zone = zones.find((z) => z.name === input.zone);
  if (!zone) return { error: "Please select a delivery area." };

  const ids = [...new Set(input.items.map((i) => i.productId))];
  const [{ data: products }, { data: variants }, { data: inv }] = await Promise.all([
    db.from("products").select("id,name,sku,regular_price,sale_price,cost_price,status,deleted_at").in("id", ids),
    db.from("product_variants").select("id,product_id,sku,size,color,regular_price,sale_price,cost_price,status").in("product_id", ids),
    db.from("inventory").select("product_id,variant_id,current_stock,reserved_stock").in("product_id", ids),
  ]);

  const lines = [];
  for (const it of input.items) {
    const qty = Math.floor(Number(it.qty));
    if (!(qty >= 1 && qty <= 20)) return { error: "Invalid quantity." };
    const p = products?.find((x) => x.id === it.productId);
    if (!p || p.status !== "published" || p.deleted_at) return { error: "A product in your cart is no longer available." };
    const v = it.variantId ? variants?.find((x) => x.id === it.variantId && x.product_id === p.id && x.status === "active") : null;
    if (it.variantId && !v) return { error: `"${p.name}" variant is no longer available.` };
    const avail = (inv ?? []).filter((r) => r.product_id === p.id && (r.variant_id ?? null) === (v?.id ?? null))
      .reduce((s, r) => s + Math.max(0, r.current_stock - r.reserved_stock), 0);
    if (avail < qty) return { error: `Only ${avail} left of "${p.name}".` };
    const src = v ?? p;
    const unit = effectivePrice(src.regular_price, src.sale_price);
    lines.push({
      product_id: p.id, variant_id: v?.id ?? null, product_name: p.name,
      variant_title: v ? [v.size, v.color].filter(Boolean).join(" / ") || null : null,
      sku: v?.sku ?? p.sku, quantity: qty, unit_price: unit, unit_cost: Number(src.cost_price ?? 0),
      line_subtotal: unit * qty, line_cogs: Number(src.cost_price ?? 0) * qty,
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.line_subtotal, 0);
  const cogs = lines.reduce((s, l) => s + l.line_cogs, 0);
  const shipping = zone.free_shipping_threshold != null && subtotal >= zone.free_shipping_threshold ? 0 : zone.rate;
  const total = subtotal + shipping;

  let me = await getCustomer();
  if (!me && input.createAccount) {
    const pw = input.password ?? "";
    if (pw.length < 6) return { error: "Password must be at least 6 characters." };
    const [first, ...rest] = name.split(/\s+/);
    const email = input.email.trim();
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email address." };
    const r = await createCustomer({ first_name: first, last_name: rest.join(" "), email, phone, password: pw });
    if ("error" in r) return { error: r.error };
    await createSession(r.id);
    me = await getCustomer();
  } else if (me) {
    await linkGuestOrders(me.id, me.phone);
  }
  const orderNumber = `PA-${randomInt(100000, 999999)}`;

  const { data: order, error } = await db.from("orders").insert({
    order_number: orderNumber, customer_id: me?.id ?? null,
    customer_name: name, customer_phone: phone, customer_email: input.email.trim() || null,
    shipping_address: address, shipping_city: input.city.trim(), shipping_zone: zone.name,
    gross_sales: subtotal, product_discount: 0, coupon_discount: 0, order_discount: 0,
    shipping_charge: shipping, tax_amount: 0, net_order_total: total, cogs_amount: cogs,
    payment_method: "cod", payment_status: "pending", order_status: "pending",
    cod_charge: 0, cod_amount_due: total, cod_collection_status: "collection_pending",
    cod_collected_amount: 0, cod_remitted_amount: 0,
    order_notes: input.notes.trim() || null,
  }).select("id").single();
  if (error || !order) return { error: "Could not place your order. Please try again." };

  const { error: iErr } = await db.from("order_items").insert(
    lines.map((l) => ({
      order_id: order.id, product_id: l.product_id, variant_id: l.variant_id, product_name: l.product_name,
      variant_title: l.variant_title, sku: l.sku, quantity: l.quantity, unit_price: l.unit_price,
      unit_cost: l.unit_cost, allocated_discount: 0, line_subtotal: l.line_subtotal,
      line_net_revenue: l.line_subtotal, line_cogs: l.line_cogs,
    })),
  );
  if (iErr) {
    await db.from("orders").delete().eq("id", order.id);
    return { error: "Could not save order items. Please try again." };
  }

  await Promise.all([
    db.from("order_status_history").insert({ order_id: order.id, new_status: "pending", comment: "Order placed on website" }),
    db.from("payments").insert({
      payment_number: `PAY-COD-${randomInt(100000, 999999)}`, order_id: order.id,
      payment_method: "cod", gross_amount: total, gateway_fee: 0, status: "pending",
    }),
  ]);

  if (me && input.saveAddress) {
    const { count } = await db.from("customer_addresses").select("id", { count: "exact", head: true }).eq("customer_id", me.id);
    await db.from("customer_addresses").insert({
      customer_id: me.id, address_type: "home", recipient_name: name, phone, address_line: address,
      city: input.city.trim(), zone: zone.name, is_default: (count ?? 0) === 0,
    });
  }
  return { orderNumber };
}
