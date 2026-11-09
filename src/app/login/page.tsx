import { redirect } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { LoginForm } from "@/components/AuthForms";
import { getCustomer } from "@/lib/session";

export const metadata = { title: "Sign in" };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/account" } = await searchParams;
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  if (await getCustomer()) redirect(safe);
  return <AuthShell title="Welcome back"><LoginForm next={safe} /></AuthShell>;
}
