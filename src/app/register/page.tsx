import { redirect } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { RegisterForm } from "@/components/AuthForms";
import { getCustomer } from "@/lib/session";

export const metadata = { title: "Create account" };

export default async function Register({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/account" } = await searchParams;
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  if (await getCustomer()) redirect(safe);
  return <AuthShell title="Create account"><RegisterForm next={safe} /></AuthShell>;
}
