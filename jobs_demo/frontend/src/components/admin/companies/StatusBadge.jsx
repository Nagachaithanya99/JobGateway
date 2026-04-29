export default function StatusBadge({ value, type = "account" }) {
  const rawKey = String(value ?? "").trim().toLowerCase();
  const accountKey = normalizeAccountStatus(rawKey);
  const key = type === "account" ? accountKey : rawKey;

  const styleMaps = {
    account: {
      active: "bg-green-50 border-green-200 text-green-700",
      suspended: "bg-red-50 border-red-200 text-red-700",
      inactive: "bg-red-50 border-red-200 text-red-700",
      disabled: "bg-red-50 border-red-200 text-red-700",
      false: "bg-red-50 border-red-200 text-red-700",
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

  const labelMaps = {
    account: { active: "Active", suspended: "Suspended", pending: "Pending" },
  };

  const cls = styleMaps[type]?.[key] || "bg-slate-50 border-slate-200 text-slate-700";
  const label = type === "account" ? labelMaps.account[key] || "Suspended" : String(value || "-");

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${cls}`}>
      {label}
    </span>
  );
}

function normalizeAccountStatus(value) {
  if (value === "active" || value === "true" || value === "1") return "active";
  if (value === "pending") return "pending";
  return "suspended";
}
