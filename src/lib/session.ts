import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./supabase";

const COOKIE = "pa_session";
const devSecret = process.env.NODE_ENV === "development" && !process.env.AUTH_SECRET
  ? randomBytes(32).toString("base64url")
  : undefined;
const key = () => {
  const secret = process.env.AUTH_SECRET || devSecret;
  return secret ? new TextEncoder().encode(secret) : null;
};

export type Customer = {
  id: string;
  customer_code: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string;
  status: string | null;
  total_orders: number | null;
  total_spent: number | null;
  created_at: string;
};

export async function createSession(customerId: string) {
  const signingKey = key();
  if (!signingKey) throw new Error("AUTH_SECRET is required to create customer sessions.");
  const token = await new SignJWT({ sub: customerId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(signingKey);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getCustomer(): Promise<Customer | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  const signingKey = key();
  if (!token || !signingKey) return null;
  try {
    const { payload } = await jwtVerify(token, signingKey);
    const { data } = await db
      .from("customers")
      .select("id,customer_code,first_name,last_name,email,phone,status,total_orders,total_spent,created_at")
      .eq("id", payload.sub as string)
      .maybeSingle();
    if (!data || data.status === "blocked" || data.status === "inactive") return null;
    return data as Customer;
  } catch {
    return null;
  }
}
