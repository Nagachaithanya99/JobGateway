import { motion } from "framer-motion";

export default function RecentActivity({ items = [] }) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-extrabold">Recent Activity</h3>
          <p className="text-sm text-muted mt-1">Latest events in the platform</p>
        </div>
        <div className="badge bg-slate-50 border-slate-200 text-slate-700">
          Live
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {items.map((a, idx) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.04 }}
            className="flex gap-3"
          >
            <div className="mt-1">
              <div className="w-3.5 h-3.5 rounded-full bg-brand-500" />
              <div className="w-[2px] h-full bg-slate-200 mx-auto mt-2" />
            </div>

            <div className="flex-1 pb-2">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold">{a.title}</div>
                <div className="text-xs text-muted font-semibold">{a.time}</div>
              </div>
              <div className="text-sm text-muted mt-1">{a.desc}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
