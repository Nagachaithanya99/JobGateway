export default function ProgressBar({ label, used = 0, limit = 0, color = "blue" }) {
  const safeLimit = Number(limit) || 0;
  const safeUsed = Number(used) || 0;
  const pct = safeLimit > 0 ? Math.min(100, Math.round((safeUsed / safeLimit) * 100)) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-medium text-slate-600">
        <span>{label}</span>
        <span>
          {safeUsed}/{safeLimit}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${color === "orange" ? "bg-[#F97316]" : "bg-[#2563EB]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
