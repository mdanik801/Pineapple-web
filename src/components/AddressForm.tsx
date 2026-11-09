"use client";
import { useActionState } from "react";
import { saveAddressAction } from "@/actions/account";

type A = { id?: string; address_type?: string | null; recipient_name?: string; phone?: string; address_line?: string; city?: string; zone?: string | null; postal_code?: string | null; is_default?: boolean | null };

const f = "w-full rounded-md border border-[#d3d8d5] bg-white px-3.5 py-3 text-[15px] outline-none transition-[border-color,box-shadow] focus:border-brand focus:shadow-[0_0_0_3px_rgba(10,60,42,.14)]";
const lbl = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-brand";

export default function AddressForm({ a = {}, zones, onDone }: { a?: A; zones: string[]; onDone?: () => void }) {
  const [s, action, pending] = useActionState(async (p: { error?: string; ok?: string } | undefined, fd: FormData) => {
    const r = await saveAddressAction(p, fd); if (r?.ok) onDone?.(); return r;
  }, undefined);
  return (
    <form action={action} className="grid gap-4 rounded-xl border border-line bg-white p-5 shadow-md [animation:popIn_.4s_cubic-bezier(.22,1,.36,1)] sm:grid-cols-2 md:p-6">
      <h3 className="font-serif text-xl text-brand sm:col-span-2">{a.id ? "Edit address" : "Add a new address"}</h3>
      {a.id && <input type="hidden" name="id" value={a.id} />}
      {s?.error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{s.error}</p>}
      <div><label className={lbl}>Recipient name *</label><input name="recipient_name" required defaultValue={a.recipient_name} className={f} autoComplete="name" /></div>
      <div><label className={lbl}>Mobile *</label><input name="phone" required defaultValue={a.phone} className={f} inputMode="tel" autoComplete="tel" /></div>
      <div className="sm:col-span-2"><label className={lbl}>Address *</label><textarea name="address_line" required rows={2} defaultValue={a.address_line} placeholder="House, road/lane, block/sector, area, thana" className={f} /></div>
      <div><label className={lbl}>City / District *</label><input name="city" required defaultValue={a.city} className={f} /></div>
      <div><label className={lbl}>Delivery area</label>
        <select name="zone" defaultValue={a.zone ?? ""} className={f}><option value="">Select area</option>{zones.map((z) => <option key={z}>{z}</option>)}</select></div>
      <div><label className={lbl}>Postal code</label><input name="postal_code" defaultValue={a.postal_code ?? ""} className={f} /></div>
      <div><label className={lbl}>Address type</label>
        <select name="address_type" defaultValue={a.address_type ?? "home"} className={f}><option value="home">Home</option><option value="office">Office</option><option value="other">Other</option></select></div>
      <label className="flex items-center gap-3 text-sm sm:col-span-2"><input type="checkbox" name="is_default" defaultChecked={!!a.is_default} className="h-4 w-4 accent-[#0A3C2A]" /> Make this my default address</label>
      <div className="flex gap-3 sm:col-span-2">
        <button disabled={pending} className="btn btn-primary">{pending ? "Saving…" : "Save address"}</button>
        {onDone && <button type="button" onClick={onDone} className="btn btn-outline">Cancel</button>}
      </div>
    </form>
  );
}
