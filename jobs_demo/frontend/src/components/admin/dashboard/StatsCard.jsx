import { motion } from "framer-motion";

const toneMap = {
  orange: { wrap: "bg-orange-50", icon: "text-orange-500" },
  blue: { wrap: "bg-blue-50", icon: "text-blue-600" },
  purple: { wrap: "bg-violet-50", icon: "text-violet-600" },
  green: { wrap: "bg-green-50", icon: "text-green-600" },
  slate: { wrap: "bg-slate-100", icon: "text-slate-600" },
};

export default function StatsCard({ title, value, icon, trend, tone = "slate" }) {
  const up = String(trend?.dir || "").toLowerCase() === "up";
  const down = String(trend?.dir || "").toLowerCase() === "down";
  const trendText = trend?.value && trend?.label ? `${trend.value} ${trend.label}` : "No change";
  const trendClass = up ? "text-green-600" : down ? "text-red-600" : "text-slate-500";
  const currentTone = toneMap[tone] || toneMap.slate;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-500">{title}</div>
          <div className="text-[38px] leading-none font-bold text-slate-800 mt-2">{value}</div>
          <div className={`text-sm mt-3 ${trendClass}`}>
            {up ? "+ " : down ? "- " : ""}
            {trendText}
          </div>
        </div>

        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${currentTone.wrap} ${currentTone.icon}`}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
