export default function StatusBadge({ value }) {
  const v = String(value || "").toLowerCase();

  const map = {
    pending: "bg-amber-50 border-amber-200 text-amber-700",
    approved: "bg-green-50 border-green-200 text-green-700",
    rejected: "bg-red-50 border-red-200 text-red-700",
    active: "bg-green-50 border-green-200 text-green-700",
    suspended: "bg-red-50 border-red-200 text-red-700",
  };

  const cls = map[v] || "bg-slate-50 border-slate-200 text-slate-700";

  return <span className={`badge ${cls}`}>{value}</span>;
}
