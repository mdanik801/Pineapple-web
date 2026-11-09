const tone: Record<string, string> = {
  pending: "bg-gold-50 text-gold-dark", confirmed: "bg-blue-50 text-blue-700", processing: "bg-blue-50 text-blue-700",
  shipped: "bg-purple-50 text-purple-700", dispatched: "bg-purple-50 text-purple-700",
  delivered: "bg-green-50 text-green-800", paid: "bg-green-50 text-green-800",
  cancelled: "bg-red-50 text-red-700", returned: "bg-red-50 text-red-700", refunded: "bg-red-50 text-red-700",
};
export default function StatusBadge({ status }: { status: string | null }) {
  const s = status ?? "pending";
  return <span className={`inline-block px-2.5 py-1 text-xs font-semibold capitalize ${tone[s] ?? "bg-brand-50 text-brand"}`}>{s.replace(/_/g, " ")}</span>;
}
