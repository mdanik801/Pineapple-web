"use client";
import { useState } from "react";
import { MapPin, Home, Briefcase, Phone, Plus, Pencil, Star, Trash2 } from "lucide-react";
import AddressForm from "./AddressForm";
import { deleteAddressAction, setDefaultAddressAction } from "@/actions/account";

type Addr = { id: string; address_type: string | null; recipient_name: string; phone: string; address_line: string; city: string; zone: string | null; postal_code: string | null; is_default: boolean | null };

const ICON = { home: Home, office: Briefcase, other: MapPin } as const;

export default function AddressList({ addresses, zones }: { addresses: Addr[]; zones: string[] }) {
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const act = "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-brand">Address Book</h1>
          <p className="mt-1 text-sm text-muted">{addresses.length} saved address{addresses.length === 1 ? "" : "es"} · used for faster checkout</p>
        </div>
        {editing !== "new" && addresses.length > 0 && <button onClick={() => setEditing("new")} className="btn btn-primary !py-3"><Plus size={16} /> Add address</button>}
      </div>

      {editing === "new" && <div className="mb-5"><AddressForm zones={zones} onDone={() => setEditing(null)} /></div>}

      {addresses.length === 0 && editing !== "new" ? (
        <div className="rounded-xl border border-dashed border-brand/30 bg-white px-6 py-16 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gold-50 text-gold-dark"><MapPin size={28} /></span>
          <p className="mt-4 font-semibold text-brand">No saved addresses yet</p>
          <p className="mt-1 text-sm text-muted">Add one now and checkout gets much faster.</p>
          <button onClick={() => setEditing("new")} className="btn btn-primary mt-6"><Plus size={16} /> Add your first address</button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {addresses.map((a, idx) => {
            if (editing === a.id) return <div key={a.id} className="md:col-span-2"><AddressForm a={a} zones={zones} onDone={() => setEditing(null)} /></div>;
            const Icon = ICON[(a.address_type as keyof typeof ICON) ?? "home"] ?? MapPin;
            return (
              <article key={a.id} style={{ animationDelay: `${idx * 70}ms` }}
                className={`group relative flex flex-col overflow-hidden rounded-xl border bg-white p-5 shadow-sm transition-all duration-300 [animation:popIn_.5s_cubic-bezier(.22,1,.36,1)_both] hover:-translate-y-1 hover:shadow-xl ${a.is_default ? "border-gold ring-1 ring-gold/40" : "border-line"}`}>
                {a.is_default && <span className="absolute inset-y-0 left-0 w-1 bg-gold" />}
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2.5">
                    <span className={`grid h-10 w-10 place-items-center rounded-full transition-colors duration-300 ${a.is_default ? "bg-gold text-white" : "bg-brand-50 text-brand group-hover:bg-brand group-hover:text-white"}`}><Icon size={18} /></span>
                    <span className="text-xs font-bold uppercase tracking-widest text-brand">{a.address_type ?? "home"}</span>
                  </span>
                  {a.is_default && <span className="flex items-center gap-1 rounded-full bg-gold-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gold-dark"><Star size={11} className="fill-current" /> Default</span>}
                </div>
                <h2 className="text-lg font-semibold">{a.recipient_name}</h2>
                <p className="mt-1 flex items-center gap-2 text-sm text-muted"><Phone size={14} className="text-gold-dark" />{a.phone}</p>
                <p className="mt-3 flex-1 text-sm leading-6 text-ink/80">{a.address_line}, {a.city}{a.zone ? <span className="text-muted"> · {a.zone}</span> : ""}{a.postal_code ? ` - ${a.postal_code}` : ""}</p>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                  {confirm === a.id ? (
                    <form action={deleteAddressAction} className="flex flex-wrap items-center gap-2 [animation:fadeIn_.25s_ease]">
                      <input type="hidden" name="id" value={a.id} />
                      <span className="text-xs text-muted">Delete this address?</span>
                      <button className={`${act} bg-red-600 text-white hover:bg-red-700`}>Yes, delete</button>
                      <button type="button" onClick={() => setConfirm(null)} className={`${act} bg-brand-50 text-brand hover:bg-brand-100`}>Cancel</button>
                    </form>
                  ) : (
                    <>
                      <button onClick={() => setEditing(a.id)} className={`${act} bg-brand-50 text-brand hover:bg-brand hover:text-white`}><Pencil size={13} /> Edit</button>
                      {!a.is_default && (
                        <form action={setDefaultAddressAction}><input type="hidden" name="id" value={a.id} /><button className={`${act} bg-gold-50 text-gold-dark hover:bg-gold hover:text-white`}><Star size={13} /> Make default</button></form>
                      )}
                      <button onClick={() => setConfirm(a.id)} className={`${act} ml-auto text-red-600 hover:bg-red-50`}><Trash2 size={13} /> Delete</button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
          {addresses.length > 0 && editing !== "new" && (
            <button onClick={() => setEditing("new")} className="group flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-brand/25 bg-white/60 p-6 text-brand transition-all duration-300 hover:-translate-y-1 hover:border-brand hover:bg-white hover:shadow-lg">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 transition-all duration-300 group-hover:rotate-90 group-hover:bg-brand group-hover:text-white"><Plus size={22} /></span>
              <span className="text-sm font-semibold">Add new address</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
