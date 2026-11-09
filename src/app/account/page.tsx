import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, Wallet, CalendarDays, ArrowRight } from "lucide-react";
import { getCustomer } from "@/lib/session";
import { db } from "@/lib/supabase";
import { ProfileForm, PasswordForm } from "@/components/ProfileForms";
import StatusBadge from "@/components/StatusBadge";
import { formatDate, money } from "@/lib/format";

export const metadata = { title: "My Account" };

export default async function Account() {
  const me = await getCustomer();
  if (!me) redirect("/login?next=/account");
  const { data: orders } = await db.from("orders").select("order_number,created_at,order_status,net_order_total").eq("customer_id", me.id).order("created_at", { ascending: false });
  const all = orders ?? [];
  const spent = all.filter((o) => o.order_status !== "cancelled").reduce((s, o) => s + Number(o.net_order_total), 0);
  const initials = `${me.first_name[0] ?? ""}${me.last_name?.[0] ?? ""}`.toUpperCase();
  const stats = [
    [Package, "Orders", String(all.length)], [Wallet, "Total spent", money(spent)], [CalendarDays, "Member since", formatDate(me.created_at)],
  ] as const;
  const card = "rounded-xl border border-line bg-white p-6 shadow-sm md:p-8";

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand to-brand-light p-6 text-white shadow-md md:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gold/20 blur-2xl" />
        <div className="relative flex items-center gap-5">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-2 border-gold bg-white/10 font-serif text-2xl text-gold md:h-20 md:w-20 md:text-3xl">{initials}</div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest text-gold">Welcome back</p>
            <h1 className="truncate font-serif text-2xl md:text-3xl">{me.first_name} {me.last_name}</h1>
            <p className="mt-1 truncate text-sm text-white/75">{me.phone}{me.email ? ` · ${me.email}` : ""} · {me.customer_code}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map(([Icon, label, value]) => (
          <div key={label} className="group flex items-center gap-4 rounded-xl border border-line bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-gold-50 text-gold-dark transition-colors duration-300 group-hover:bg-gold group-hover:text-white"><Icon size={22} /></span>
            <div><p className="text-xs uppercase tracking-wider text-muted">{label}</p><p className="mt-0.5 text-lg font-semibold text-brand">{value}</p></div>
          </div>
        ))}
      </section>

      {all.length > 0 && (
        <section className={card}>
          <div className="mb-4 flex items-center justify-between"><h2 className="font-serif text-xl text-brand">Recent orders</h2><Link href="/account/orders" className="group flex items-center gap-1 text-sm font-semibold text-gold-dark">View all <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></Link></div>
          <ul className="divide-y divide-line">
            {all.slice(0, 3).map((o) => (
              <li key={o.order_number}>
                <Link href={`/account/orders/${o.order_number}`} className="flex flex-wrap items-center justify-between gap-3 py-3.5 transition-colors hover:text-brand">
                  <span><span className="font-semibold">{o.order_number}</span><span className="ml-3 text-sm text-muted">{formatDate(o.created_at)}</span></span>
                  <span className="flex items-center gap-4"><StatusBadge status={o.order_status} /><span className="font-semibold">{money(o.net_order_total)}</span></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={card}>
        <h2 className="mb-5 font-serif text-xl text-brand">Personal information</h2>
        <ProfileForm me={me} />
      </section>
      <section className={card}>
        <h2 className="mb-5 font-serif text-xl text-brand">Change password</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
