"use client";
import { useState } from "react";
import { Share2 } from "lucide-react";

export default function ShareButton({ title }: { title: string }) {
  const [msg, setMsg] = useState("Share");
  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) { await navigator.share({ title, url }); return; }
      await navigator.clipboard.writeText(url);
      setMsg("Link copied"); setTimeout(() => setMsg("Share"), 1800);
    } catch {}
  }
  return <button type="button" onClick={share} className="flex shrink-0 items-center gap-2 text-sm text-ink/70 underline underline-offset-4 hover:text-brand"><Share2 size={18} />{msg}</button>;
}
