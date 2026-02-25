import { motion } from "framer-motion";

function Pill({ status }) {
  const v = String(status || "").toLowerCase();
  const cls =
    v === "shortlisted"
      ? "bg-green-50 border-green-200 text-green-700"
      : v === "hold"
      ? "bg-amber-50 border-amber-200 text-amber-700"
      : v === "rejected"
      ? "bg-red-50 border-red-200 text-red-700"
      : "bg-slate-50 border-slate-200 text-slate-700";
  return <span className={`badge ${cls}`}>{status}</span>;
}

export default function StudentApplications({ items = [] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-0 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="font-extrabold">Applications</div>
          <div className="text-sm text-muted mt-1">Jobs applied by this student</div>
        </div>
        <span className="badge bg-slate-50 border-slate-200 text-slate-700">
          {items.length} applications
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase text-muted">
            <tr className="text-left">
              <th className="px-6 py-3">Job</th>
              <th className="px-6 py-3">Company</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/70 transition">
                <td className="px-6 py-4 font-semibold">{a.jobTitle}</td>
                <td className="px-6 py-4">{a.company}</td>
                <td className="px-6 py-4"><Pill status={a.status} /></td>
                <td className="px-6 py-4 text-muted">{a.date}</td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr className="border-t border-slate-100">
                <td colSpan={4} className="px-6 py-10 text-center text-muted">
                  No applications yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
