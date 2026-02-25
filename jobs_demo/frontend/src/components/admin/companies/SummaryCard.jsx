import { FiGrid } from "react-icons/fi";

export default function SummaryCard({ title, value, icon, accent = "orange" }) {
  const accentMap = {
    orange: "bg-orange-50 text-[#F97316]",
    blue: "bg-blue-50 text-[#2563EB]",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-[#1F2937]">{value}</p>
        </div>
        <span className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${accentMap[accent] || accentMap.orange}`}>
          {icon || <FiGrid />}
        </span>
      </div>
    </div>
  );
}
