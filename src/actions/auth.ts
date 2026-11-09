"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/supabase";
import { verifyPassword } from "@/lib/password";
import { createCustomer, linkGuestOrders, normPhone, cleanFilter as clean, BD_PHONE } from "@/lib/customers";
import { createSession, destroySession } from "@/lib/session";

export type FormState = { error?: string; ok?: string } | undefined;

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const safeNext = (n: string) => (n.startsWith("/") && !n.startsWith("//") ? n : "/account");

export async function registerAction(_: FormState, f: FormData): Promise<FormState> {
  const first_name = s(f, "first_name"), last_name = s(f, "last_name");
  const email = s(f, "email").toLowerCase(), phone = normPhone(s(f, "phone"));
  const password = String(f.get("password") ?? "");
  if (!first_name) return { error: "First name is required." };
  if (!BD_PHONE.test(phone)) return { error: "Enter a valid Bangladeshi mobile number (e.g. 01712345678)." };
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };
  if (password !== String(f.get("confirm") ?? "")) return { error: "Passwords do not match." };

  const r = await createCustomer({ first_name, last_name, email, phone, password });
  if ("error" in r) return { error: r.error };
  await createSession(r.id);
  redirect(safeNext(s(f, "next")));
}

export async function loginAction(_: FormState, f: FormData): Promise<FormState> {
  const id = s(f, "identifier").toLowerCase();
  const password = String(f.get("password") ?? "");
  if (!id || !password) return { error: "Enter your email/phone and password." };
  const phone = normPhone(id);
  const { data } = await db.from("customers").select("id,phone,password_hash,status").or(`email.eq.${clean(id)},phone.eq.${clean(phone)}`).limit(1).maybeSingle();
  if (!data || !verifyPassword(password, data.password_hash)) return { error: "Incorrect email/phone or password." };
  if (data.status === "blocked" || data.status === "inactive") return { error: "This account is disabled. Please contact support." };
  await linkGuestOrders(data.id, data.phone);
  await createSession(data.id);
  redirect(safeNext(s(f, "next")));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
