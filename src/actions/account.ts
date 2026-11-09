"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { getCustomer } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/password";
import type { FormState } from "./auth";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function updateProfileAction(_: FormState, f: FormData): Promise<FormState> {
  const me = await getCustomer();
  if (!me) return { error: "Please sign in again." };
  const first_name = s(f, "first_name");
  if (!first_name) return { error: "First name is required." };
  const email = s(f, "email").toLowerCase();
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email address." };
  if (email) {
    const { data } = await db.from("customers").select("id").eq("email", email).neq("id", me.id).limit(1);
    if (data?.length) return { error: "That email is used by another account." };
  }
  const { error } = await db.from("customers")
    .update({ first_name, last_name: s(f, "last_name") || null, email: email || null, updated_at: new Date().toISOString() })
    .eq("id", me.id);
  if (error) return { error: "Could not save changes." };
  revalidatePath("/account", "layout");
  return { ok: "Profile updated." };
}

export async function changePasswordAction(_: FormState, f: FormData): Promise<FormState> {
  const me = await getCustomer();
  if (!me) return { error: "Please sign in again." };
  const next = String(f.get("new") ?? "");
  if (next.length < 6) return { error: "New password must be at least 6 characters." };
  if (next !== String(f.get("confirm") ?? "")) return { error: "Passwords do not match." };
  const { data } = await db.from("customers").select("password_hash").eq("id", me.id).single();
  if (!verifyPassword(String(f.get("current") ?? ""), data?.password_hash)) return { error: "Current password is incorrect." };
  await db.from("customers").update({ password_hash: hashPassword(next), updated_at: new Date().toISOString() }).eq("id", me.id);
  return { ok: "Password changed." };
}

export async function saveAddressAction(_: FormState, f: FormData): Promise<FormState> {
  const me = await getCustomer();
  if (!me) return { error: "Please sign in again." };
  const row = {
    address_type: s(f, "address_type") || "home",
    recipient_name: s(f, "recipient_name"), phone: s(f, "phone").replace(/[\s-]/g, ""),
    address_line: s(f, "address_line"), city: s(f, "city"),
    zone: s(f, "zone") || null, postal_code: s(f, "postal_code") || null,
  };
  if (!row.recipient_name || !row.phone || !row.address_line || !row.city) return { error: "Name, phone, address and city are required." };
  const makeDefault = f.get("is_default") === "on";
  const id = s(f, "id");
  if (makeDefault) await db.from("customer_addresses").update({ is_default: false }).eq("customer_id", me.id);
  const { count } = await db.from("customer_addresses").select("id", { count: "exact", head: true }).eq("customer_id", me.id);
  const is_default = makeDefault || (!id && (count ?? 0) === 0);
  const { error } = id
    ? await db.from("customer_addresses").update({ ...row, is_default }).eq("id", id).eq("customer_id", me.id)
    : await db.from("customer_addresses").insert({ ...row, is_default, customer_id: me.id });
  if (error) return { error: "Could not save address." };
  revalidatePath("/account/addresses");
  return { ok: "Address saved." };
}

export async function deleteAddressAction(f: FormData) {
  const me = await getCustomer();
  if (!me) return;
  await db.from("customer_addresses").delete().eq("id", s(f, "id")).eq("customer_id", me.id);
  revalidatePath("/account/addresses");
}

export async function setDefaultAddressAction(f: FormData) {
  const me = await getCustomer();
  if (!me) return;
  await db.from("customer_addresses").update({ is_default: false }).eq("customer_id", me.id);
  await db.from("customer_addresses").update({ is_default: true }).eq("id", s(f, "id")).eq("customer_id", me.id);
  revalidatePath("/account/addresses");
}
