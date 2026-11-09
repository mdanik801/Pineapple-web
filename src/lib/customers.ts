import "server-only";
import { db } from "./supabase";
import { hashPassword } from "./password";

export const normPhone = (p: string) => p.replace(/[\s-]/g, "");
export const BD_PHONE = /^(\+?88)?01[3-9]\d{8}$/;
/** last 11 digits, e.g. 01712345678 — used to match +880.../880.../01... variants */
export const phoneKey = (p: string) => p.replace(/\D/g, "").slice(-11);
export const cleanFilter = (v: string) => v.replace(/[,()*\\"']/g, "");

/** Attach earlier guest orders (same phone, no customer) to this customer. */
export async function linkGuestOrders(customerId: string, phone: string) {
  const key = phoneKey(phone);
  if (key.length !== 11) return;
  await db.from("orders").update({ customer_id: customerId }).is("customer_id", null).like("customer_phone", `%${key}`);
}

export async function createCustomer(i: {
  first_name: string; last_name?: string; email?: string; phone: string; password: string;
}): Promise<{ error: string } | { id: string }> {
  const email = (i.email ?? "").trim().toLowerCase();
  const phone = normPhone(i.phone);
  const filter = email ? `phone.eq.${cleanFilter(phone)},email.eq.${cleanFilter(email)}` : `phone.eq.${cleanFilter(phone)}`;
  const { data: dup } = await db.from("customers").select("id,phone").or(filter).limit(1);
  if (dup?.length) return { error: dup[0].phone === phone ? "An account with this phone number already exists. Please sign in." : "An account with this email already exists. Please sign in." };

  const { data: last } = await db.from("customers").select("customer_code").like("customer_code", "CUST-%").order("customer_code", { ascending: false }).limit(1);
  const n = last?.[0] ? parseInt(last[0].customer_code.replace(/\D/g, ""), 10) || 0 : 0;
  const { data, error } = await db.from("customers")
    .insert({
      customer_code: `CUST-${String(n + 1).padStart(3, "0")}`, first_name: i.first_name,
      last_name: i.last_name || null, email: email || null, phone, status: "active", password_hash: hashPassword(i.password),
    }).select("id").single();
  if (error || !data) return { error: "Could not create your account. Please try again." };
  await linkGuestOrders(data.id, phone);
  return { id: data.id };
}
