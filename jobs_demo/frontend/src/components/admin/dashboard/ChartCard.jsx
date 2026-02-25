import { motion } from "framer-motion";

export default function ChartCard({ title, subtitle, points = [] }) {
  const max = Math.max(...points, 1);

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold">{title}</h3>
          {subtitle ? <p className="text-sm text-muted mt-1">{subtitle}</p> : null}
        </div>

        <div className="badge bg-brand-50 border-brand-200 text-brand-700">
          Last 7 days
        </div>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-3 items-end h-40">
        {points.map((v, i) => {
          const height = Math.max(10, Math.round((v / max) * 140));
          return (
            <div key={i} className="flex flex-col items-center gap-2">
              <motion.div
                initial={{ height: 0, opacity: 0.5 }}
                animate={{ height, opacity: 1 }}
                transition={{ duration: 0.5, delay: i * 0.03 }}
                className="w-full rounded-2xl bg-brand-200/80 border border-brand-200"
              />
              <div className="text-[11px] text-muted font-semibold">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
