export default function StatusBadge({ value, type = "account" }) {
  const key = String(value || "").toLowerCase();

  const maps = {
    account: {
      active: "bg-green-50 border-green-200 text-green-700",
      suspended: "bg-red-50 border-red-200 text-red-700",
      pending: "bg-amber-50 border-amber-200 text-amber-700",
    },
    planType: {
      starter: "bg-blue-50 border-blue-200 text-[#2563EB]",
      growth: "bg-blue-50 border-blue-200 text-[#2563EB]",
      premium: "bg-blue-50 border-blue-200 text-[#2563EB]",
      unlimited: "bg-blue-50 border-blue-200 text-[#2563EB]",
    },
    planStatus: {
      active: "bg-blue-50 border-blue-200 text-[#2563EB]",
      expired: "bg-orange-50 border-orange-200 text-[#F97316]",
      pending: "bg-amber-50 border-amber-200 text-amber-700",
    },
    metric: {
      active: "bg-green-50 border-green-200 text-green-700",
      medium: "bg-amber-50 border-amber-200 text-amber-700",
      low: "bg-slate-50 border-slate-200 text-slate-700",
    },
  };

  const cls = maps[type]?.[key] || "bg-slate-50 border-slate-200 text-slate-700";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${cls}`}>
      {String(value || "-")}
    </span>
  );
}
