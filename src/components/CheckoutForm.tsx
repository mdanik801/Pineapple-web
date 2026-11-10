"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, Lock } from "lucide-react";
import { useStore, useMounted, type CartItem } from "@/lib/store";
import { placeOrderAction } from "@/actions/order";
import SmartImage from "./SmartImage";
import { money } from "@/lib/format";

type Zone = { name: string; rate: number; estimated_days: string | null; free_shipping_threshold: number | null };
type Addr = { id: string; recipient_name: string; phone: string; address_line: string; city: string; zone: string | null; is_default: boolean | null };

const field = "w-full rounded-md border border-[#d3d8d5] bg-white px-3.5 py-3 text-sm sm:text-[15px] outline-none transition-[border-color,box-shadow] placeholder:text-[#707975] focus:border-brand focus:shadow-[0_0_0_2px_rgba(10,60,42,.18)]";

function Summary({ items, subtotal, shipping, total }: { items: CartItem[]; subtotal: number; shipping: number; total: number }) {
  return (
    <div>
      <ul className="space-y-4">
        {items.map((i) => (
          <li key={i.key} className="flex items-center gap-3 sm:gap-4">
            <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-lg border border-line bg-white shadow-2xs">
              <div className="relative h-full w-full overflow-hidden rounded-lg">
                <SmartImage src={i.image} alt={i.name} sizes="64px" className="object-cover" />
              </div>
              <span className="absolute -right-2 -top-2 grid h-5 min-w-5 sm:h-[22px] sm:min-w-[22px] place-items-center rounded-full bg-brand px-1 text-[10px] sm:text-xs font-semibold text-white">
                {i.qty}
              </span>
            </div>
            <div className="min-w-0 flex-1 text-xs sm:text-sm">
              <p className="line-clamp-2 font-medium leading-snug">{i.name}</p>
              {i.variantTitle && <p className="text-[11px] uppercase text-muted mt-0.5">{i.variantTitle}</p>}
            </div>
            <p className="text-xs sm:text-sm font-semibold text-ink shrink-0 text-right">{money(i.price * i.qty)}</p>
          </li>
        ))}
      </ul>
      <dl className="mt-6 space-y-2 text-xs sm:text-sm border-t border-line/60 pt-4">
        <div className="flex justify-between text-muted"><dt>Subtotal</dt><dd className="text-ink font-medium">{money(subtotal)}</dd></div>
        <div className="flex justify-between text-muted"><dt>Shipping</dt><dd className="text-ink font-medium">{shipping === 0 ? "FREE" : money(shipping)}</dd></div>
        <div className="flex items-baseline justify-between border-t border-line pt-3 text-base sm:text-lg font-bold text-brand">
          <dt>Total</dt>
          <dd><span className="mr-1.5 text-xs font-normal text-muted">BDT</span>{money(total)}</dd>
        </div>
      </dl>
    </div>
  );
}

export default function CheckoutForm({ zones, addresses, me, buyNowMode }: {
  zones: Zone[]; addresses: Addr[]; buyNowMode: boolean;
  me: { first: string; last: string; phone: string; email: string } | null;
}) {
  const mounted = useMounted();
  const router = useRouter();
  const { items: cartItems, buyNow, clear, setBuyNow } = useStore();
  const items: CartItem[] = buyNowMode ? (buyNow ? [buyNow] : []) : cartItems;
  const def = addresses.find((a) => a.is_default) ?? addresses[0];
  const [defFirst, ...defRest] = (def?.recipient_name ?? "").split(/\s+/);
  const [f, setF] = useState({
    first: def ? defFirst : me?.first ?? "", last: def ? defRest.join(" ") : me?.last ?? "",
    phone: def?.phone ?? me?.phone ?? "", email: me?.email ?? "",
    address: def?.address_line ?? "", city: def?.city ?? "", postal: "",
    zone: def?.zone && zones.some((z) => z.name === def.zone) ? def.zone : zones[0]?.name ?? "",
    notes: "", save: false, create: false, password: "",
  });
  const [err, setErr] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [pending, start] = useTransition();
  const set = (k: string, v: string | boolean) => setF((x) => ({ ...x, [k]: v }));

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const zone = zones.find((z) => z.name === f.zone);
  const shipping = !zone ? 0 : zone.free_shipping_threshold != null && subtotal >= zone.free_shipping_threshold ? 0 : zone.rate;
  const total = subtotal + shipping;

  function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    start(async () => {
      const r = await placeOrderAction({
        items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty })),
        name: `${f.first} ${f.last}`.trim(), phone: f.phone, email: f.email,
        address: f.postal ? `${f.address}, ${f.postal}` : f.address, city: f.city, zone: f.zone, notes: f.notes,
        payment: "cod", saveAddress: me ? f.save : false, createAccount: !me && f.create, password: f.password,
      });
      if ("error" in r) { setErr(r.error); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      if (buyNowMode) setBuyNow(null); else clear();
      router.push(`/order-success/${r.orderNumber}`);
    });
  }

  const Header = (
    <header className="border-b border-line bg-white py-3 sm:py-4 text-center">
      <Link href="/" aria-label="Back to Pineapple" className="inline-block">
        <Image src="/logo-full.jpg" alt="Pineapple" width={160} height={110} priority className="h-10 sm:h-12 w-auto" />
      </Link>
    </header>
  );

  if (!mounted) return <div className="min-h-screen bg-white">{Header}</div>;
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white">{Header}
        <div className="py-20 text-center px-4">
          <p className="text-muted text-sm sm:text-base">Your {buyNowMode ? "order" : "cart"} is empty.</p>
          <Link href="/shop" className="btn btn-primary mt-6 !px-6 !py-3 text-xs sm:text-sm">Continue shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white [animation:fadeIn_.4s_ease]">
      {Header}

      {/* Mobile order summary toggle */}
      <div className="border-b border-line bg-[#f8faf9] lg:hidden">
        <button
          type="button"
          aria-expanded={showSummary}
          onClick={() => setShowSummary(!showSummary)}
          className="container-x flex w-full items-center justify-between py-3.5 text-xs sm:text-sm text-brand"
        >
          <span className="flex items-center gap-1.5 font-medium">
            {showSummary ? "Hide" : "Show"} order summary{" "}
            <ChevronDown size={15} className={`transition-transform duration-300 ${showSummary ? "rotate-180" : ""}`} />
          </span>
          <span className="text-sm sm:text-base font-bold text-ink">{money(total)}</span>
        </button>
        <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${showSummary ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
          <div className="overflow-hidden">
            <div className="container-x pb-5 pt-2">
              <Summary items={items} subtotal={subtotal} shipping={shipping} total={total} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2">
        <div className="px-4 py-6 sm:px-6 sm:py-8 lg:flex lg:justify-end lg:pr-14 lg:pt-10">
          <form onSubmit={submit} className="w-full max-w-[520px] space-y-7 sm:space-y-9">
            {err && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-xs sm:text-sm text-red-700">{err}</p>}

            <section>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-lg sm:text-xl font-semibold">Contact</h2>
                {!me && <Link href={`/login?next=${encodeURIComponent("/checkout" + (buyNowMode ? "?buy=1" : ""))}`} className="text-xs sm:text-sm underline underline-offset-2 hover:text-brand">Sign in</Link>}
              </div>
              <div className="space-y-3">
                <input aria-label="Phone number" required inputMode="tel" placeholder="Phone number (01XXXXXXXXX)" className={field} value={f.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" />
                <input aria-label="Email" type="email" placeholder="Email (optional)" className={field} value={f.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg sm:text-xl font-semibold">Delivery</h2>
              {addresses.length > 1 && (
                <select aria-label="Saved addresses" defaultValue={def?.id} className={`${field} mb-3`} onChange={(e) => {
                  const a = addresses.find((x) => x.id === e.target.value); if (!a) return;
                  const [fn, ...ln] = a.recipient_name.split(/\s+/);
                  setF((x) => ({ ...x, first: fn, last: ln.join(" "), phone: a.phone, address: a.address_line, city: a.city, zone: a.zone && zones.some((z) => z.name === a.zone) ? a.zone : x.zone }));
                }}>
                  {addresses.map((a) => <option key={a.id} value={a.id}>{a.recipient_name} — {a.address_line}, {a.city}</option>)}
                </select>
              )}
              <div className="space-y-3">
                <div className="relative">
                  <label className="pointer-events-none absolute left-3.5 top-1.5 text-[10px] sm:text-xs text-muted">Country/Region</label>
                  <select disabled className={`${field} appearance-none pb-2 pt-5 sm:pt-6`} aria-label="Country"><option>Bangladesh</option></select>
                  <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input aria-label="First name" required placeholder="First name" className={field} value={f.first} onChange={(e) => set("first", e.target.value)} autoComplete="given-name" />
                  <input aria-label="Last name" placeholder="Last name" className={field} value={f.last} onChange={(e) => set("last", e.target.value)} autoComplete="family-name" />
                </div>
                <input aria-label="Address" required placeholder="Full address (house, road, block, area, thana…)" className={field} value={f.address} onChange={(e) => set("address", e.target.value)} autoComplete="street-address" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input aria-label="City or district" required placeholder="City / District" className={field} value={f.city} onChange={(e) => set("city", e.target.value)} />
                  <input aria-label="Postal code" placeholder="Postal code (optional)" className={field} value={f.postal} onChange={(e) => set("postal", e.target.value)} autoComplete="postal-code" />
                </div>
                <input aria-label="Order notes" placeholder="Order notes (optional)" className={field} value={f.notes} onChange={(e) => set("notes", e.target.value)} />
              </div>

              {me ? (
                <label className="mt-3.5 flex items-center gap-2.5 text-xs sm:text-sm"><input type="checkbox" checked={f.save} onChange={(e) => set("save", e.target.checked)} className="h-4 w-4 accent-[#0A3C2A]" /> Save this information for next time</label>
              ) : (
                <div className="mt-3.5">
                  <label className="flex items-center gap-2.5 text-xs sm:text-sm"><input type="checkbox" checked={f.create} onChange={(e) => set("create", e.target.checked)} className="h-4 w-4 accent-[#0A3C2A]" /> Create an account to track orders &amp; check out faster</label>
                  {f.create && <input aria-label="Choose a password" type="password" required minLength={6} placeholder="Choose a password (min 6 characters)" className={`${field} mt-3 [animation:megaIn_.3s_ease]`} value={f.password} onChange={(e) => set("password", e.target.value)} autoComplete="new-password" />}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-lg sm:text-xl font-semibold">Shipping method</h2>
              <div className="space-y-3">
                <div className="relative">
                  <select aria-label="Delivery area" className={`${field} appearance-none pr-10`} value={f.zone} onChange={(e) => set("zone", e.target.value)}>
                    {zones.map((z) => <option key={z.name} value={z.name}>{z.name}</option>)}
                  </select>
                  <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
                </div>
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 rounded-md border-2 border-brand bg-brand-50 px-3.5 py-3.5 text-xs sm:text-sm font-medium">
                  <span>Standard Shipping{zone?.estimated_days ? <span className="ml-1.5 font-normal text-muted">({zone.estimated_days})</span> : null}</span>
                  <span className="font-semibold text-brand">{shipping === 0 ? "FREE" : money(shipping)}</span>
                </div>
                {zone?.free_shipping_threshold != null && shipping > 0 && <p className="text-[11px] sm:text-xs text-gold-dark">Free shipping on orders over {money(zone.free_shipping_threshold)} in {zone.name}.</p>}
              </div>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-semibold">Payment</h2>
              <p className="mb-3 mt-1 flex items-center gap-1.5 text-xs sm:text-sm text-muted"><Lock size={13} /> All transactions are secure.</p>
              <div className="overflow-hidden rounded-md border-2 border-brand">
                <label className="flex items-center gap-2.5 bg-brand-50 px-3.5 py-3.5">
                  <input type="radio" checked readOnly className="h-4 w-4 accent-[#0A3C2A]" />
                  <span className="text-xs sm:text-sm font-semibold">Cash on Delivery (COD)</span>
                </label>
                <p className="border-t border-brand/20 bg-[#f7f9f8] px-3.5 py-3 text-xs sm:text-sm leading-relaxed text-ink/75">Pay with cash when your order is delivered. Please keep the exact amount ready.</p>
              </div>
            </section>

            <button disabled={pending} className="w-full rounded-md bg-brand py-3.5 sm:py-4 text-sm sm:text-base font-semibold text-white transition-all duration-200 hover:bg-brand-light active:scale-[.99] disabled:opacity-60 touch-manipulation shadow-sm">
              {pending ? "Placing order…" : `Complete order · ${money(total)}`}
            </button>

            <footer className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-4 text-[11px] sm:text-xs text-brand">
              <Link href="/pages/returns" className="underline">Refund policy</Link>
              <Link href="/pages/shipping" className="underline">Shipping policy</Link>
              <Link href="/pages/privacy" className="underline">Privacy policy</Link>
              <Link href="/pages/terms" className="underline">Terms of service</Link>
            </footer>
          </form>
        </div>

        <aside className="hidden border-l border-line bg-[#f8faf9] px-8 py-10 lg:block xl:px-14">
          <div className="sticky top-10 max-w-[460px]">
            <Summary items={items} subtotal={subtotal} shipping={shipping} total={total} />
          </div>
        </aside>
      </div>
    </div>
  );
}
