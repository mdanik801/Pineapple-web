export const BRAND = "Pineapple";

export function money(n: number | null | undefined) {
  const v = Number(n ?? 0);
  return "৳" + v.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function effectivePrice(regular: number, sale: number | null | undefined) {
  const r = Number(regular);
  const s = sale == null ? null : Number(sale);
  return s && s > 0 && s < r ? s : r;
}

export function discountPct(regular: number, sale: number | null | undefined) {
  const p = effectivePrice(regular, sale);
  return p < Number(regular) ? Math.round((1 - p / Number(regular)) * 100) : 0;
}

export function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
