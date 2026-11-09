"use client";
import { useActionState } from "react";
import { updateProfileAction, changePasswordAction } from "@/actions/account";

const Msg = ({ s }: { s?: { error?: string; ok?: string } }) =>
  s?.error ? <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 [animation:popIn_.3s_ease]">{s.error}</p>
  : s?.ok ? <p role="status" className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 [animation:popIn_.3s_ease]">{s.ok}</p> : null;

const f = "w-full rounded-md border border-[#d3d8d5] bg-white px-3.5 py-3 text-[15px] outline-none transition-[border-color,box-shadow] focus:border-brand focus:shadow-[0_0_0_3px_rgba(10,60,42,.14)]";
const lbl = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-brand";

export function ProfileForm({ me }: { me: { first_name: string; last_name: string | null; email: string | null; phone: string } }) {
  const [s, action, pending] = useActionState(updateProfileAction, undefined);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2 empty:hidden"><Msg s={s} /></div>
      <div><label className={lbl} htmlFor="fn">First name</label><input id="fn" name="first_name" required defaultValue={me.first_name} className={f} /></div>
      <div><label className={lbl} htmlFor="ln">Last name</label><input id="ln" name="last_name" defaultValue={me.last_name ?? ""} className={f} /></div>
      <div className="sm:col-span-2"><label className={lbl} htmlFor="em">Email</label><input id="em" name="email" type="email" defaultValue={me.email ?? ""} className={f} /></div>
      <div className="sm:col-span-2"><label className={lbl} htmlFor="ph">Mobile number</label><input id="ph" value={me.phone} disabled className={`${f} bg-brand-50 text-muted`} /><p className="mt-1.5 text-xs text-muted">Contact support to change your mobile number.</p></div>
      <div className="sm:col-span-2"><button disabled={pending} className="btn btn-primary">{pending ? "Saving…" : "Save changes"}</button></div>
    </form>
  );
}

export function PasswordForm() {
  const [s, action, pending] = useActionState(changePasswordAction, undefined);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2 empty:hidden"><Msg s={s} /></div>
      <div className="sm:col-span-2"><label className={lbl} htmlFor="cur">Current password</label><input id="cur" name="current" type="password" required className={f} autoComplete="current-password" /></div>
      <div><label className={lbl} htmlFor="nw">New password</label><input id="nw" name="new" type="password" required minLength={6} className={f} autoComplete="new-password" /></div>
      <div><label className={lbl} htmlFor="cf">Confirm password</label><input id="cf" name="confirm" type="password" required minLength={6} className={f} autoComplete="new-password" /></div>
      <div className="sm:col-span-2"><button disabled={pending} className="btn btn-outline">{pending ? "Updating…" : "Change password"}</button></div>
    </form>
  );
}
