"use client";
import Link from "next/link";
import { useActionState } from "react";
import { loginAction, registerAction } from "@/actions/auth";

const Msg = ({ s }: { s?: { error?: string; ok?: string } }) =>
  s?.error ? <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{s.error}</p> : null;

export function LoginForm({ next }: { next: string }) {
  const [s, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Msg s={s} />
      <div><label className="label" htmlFor="identifier">Email or mobile number</label><input id="identifier" name="identifier" required className="input" autoComplete="username" /></div>
      <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" required className="input" autoComplete="current-password" /></div>
      <button disabled={pending} className="btn btn-primary w-full">{pending ? "Signing in…" : "Sign in"}</button>
      <p className="text-center text-sm text-muted">New to Pineapple? <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-semibold text-brand underline">Create an account</Link></p>
    </form>
  );
}

export function RegisterForm({ next }: { next: string }) {
  const [s, action, pending] = useActionState(registerAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Msg s={s} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="first_name">First name *</label><input id="first_name" name="first_name" required className="input" autoComplete="given-name" /></div>
        <div><label className="label" htmlFor="last_name">Last name</label><input id="last_name" name="last_name" className="input" autoComplete="family-name" /></div>
      </div>
      <div><label className="label" htmlFor="phone">Mobile number *</label><input id="phone" name="phone" required inputMode="tel" placeholder="01XXXXXXXXX" className="input" autoComplete="tel" /></div>
      <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" className="input" autoComplete="email" /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="password">Password *</label><input id="password" name="password" type="password" required minLength={6} className="input" autoComplete="new-password" /></div>
        <div><label className="label" htmlFor="confirm">Confirm password *</label><input id="confirm" name="confirm" type="password" required minLength={6} className="input" autoComplete="new-password" /></div>
      </div>
      <button disabled={pending} className="btn btn-gold w-full">{pending ? "Creating account…" : "Create account"}</button>
      <p className="text-center text-sm text-muted">Already registered? <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-brand underline">Sign in</Link></p>
    </form>
  );
}
