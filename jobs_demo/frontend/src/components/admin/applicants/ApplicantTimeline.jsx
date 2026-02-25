import { motion } from "framer-motion";

export default function ApplicantTimeline({ items = [] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-lg font-extrabold">Timeline</div>
          <div className="text-sm text-muted mt-1">Application journey</div>
        </div>
        <span className="badge bg-slate-50 border-slate-200 text-slate-700">
          {items.length} events
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {items.map((t, i) => (
          <motion.div
            key={`${t.at}-${i}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.28, delay: i * 0.04 }}
            className="flex gap-3"
          >
            <div className="mt-1">
              <div className="w-3.5 h-3.5 rounded-full bg-brand-500" />
              <div className="w-[2px] h-full bg-slate-200 mx-auto mt-2" />
            </div>

            <div className="flex-1 pb-2">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold">{t.label}</div>
                <div className="text-xs text-muted font-semibold">{t.at}</div>
              </div>
              <div className="text-sm text-muted mt-1">{t.desc}</div>
            </div>
          </motion.div>
        ))}

        {items.length === 0 ? (
          <div className="text-sm text-muted">No timeline events.</div>
        ) : null}
      </div>
    </motion.div>
  );
}
