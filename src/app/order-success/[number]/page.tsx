import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getCustomer } from "@/lib/session";

export const metadata = { title: "Order placed" };

export default async function Success({ params }: { params: Promise<{ number: string }> }) {
  const [{ number }, me] = await Promise.all([params, getCustomer()]);
  return (
    <div className="container-x py-20 text-center">
      <CheckCircle2 className="mx-auto text-brand" size={72} />
      <h1 className="section-title mt-6">Thank you for your order!</h1>
      <p className="mt-3 text-muted">Your order number is</p>
      <p className="mt-1 text-2xl font-bold tracking-wider text-gold-dark">{number.replace(/[^A-Za-z0-9-]/g, "")}</p>
      <p className="mx-auto mt-4 max-w-md text-sm text-muted">We&apos;ll call or message you to confirm shortly. Please keep the amount ready for cash on delivery.{!me && " Save your order number — you can track it anytime with your phone number, no account needed."}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {me ? <Link href="/account/orders" className="btn btn-primary">View my orders</Link> : <Link href={`/track-order?n=${encodeURIComponent(number)}`} className="btn btn-primary">Track this order</Link>}
        <Link href="/shop" className="btn btn-outline">Continue shopping</Link>
      </div>
    </div>
  );
}
