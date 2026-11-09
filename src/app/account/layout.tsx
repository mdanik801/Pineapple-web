import { redirect } from "next/navigation";
import { getCustomer } from "@/lib/session";
import AccountNav from "@/components/AccountNav";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const me = await getCustomer();
  if (!me) redirect("/login?next=/account");
  return (
    <div className="-mb-20 bg-[#f6f8f7] pb-20">
      <div className="container-x grid grid-cols-1 gap-6 py-8 md:py-12 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-10">
        <aside className="h-fit min-w-0 rounded-xl border border-line bg-white p-3 shadow-sm lg:sticky lg:top-24"><AccountNav /></aside>
        <div className="min-w-0 [animation:pageIn_.5s_cubic-bezier(.22,1,.36,1)_both]">{children}</div>
      </div>
    </div>
  );
}
