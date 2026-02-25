import { AnimatePresence, motion } from "framer-motion";
import { FiCheck, FiX, FiEye } from "react-icons/fi";

function StatusPill({ status }) {
  const v = String(status || "").toLowerCase();
  const cls =
    v === "approved"
      ? "bg-green-50 border-green-200 text-green-700"
      : v === "rejected"
      ? "bg-red-50 border-red-200 text-red-700"
      : "bg-amber-50 border-amber-200 text-amber-700";
  return <span className={`badge ${cls}`}>{status}</span>;
}

export default function PlanRequestsTable({ rows = [], onView, onApprove, onReject }) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="font-extrabold">Plan Requests</div>
          <div className="text-sm text-muted mt-1">
            Approve or reject company plan purchase requests
          </div>
        </div>
        <span className="badge bg-brand-50 border-brand-200 text-brand-700">
          {rows.length} requests
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase text-muted">
            <tr className="text-left">
              <th className="px-6 py-3">Company</th>
              <th className="px-6 py-3">Plan</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">UTR</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            <AnimatePresence initial={false}>
              {rows.map((r, idx) => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22, delay: idx * 0.01 }}
                  className="border-t border-slate-100 hover:bg-slate-50/70 transition"
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold">{r.companyName}</div>
                    <div className="text-xs text-muted mt-1">ID: {r.companyId}</div>
                  </td>

                  <td className="px-6 py-4 font-semibold">{r.planName}</td>
                  <td className="px-6 py-4 font-semibold">{r.amount}</td>
                  <td className="px-6 py-4">{r.utr}</td>
                  <td className="px-6 py-4 text-muted">{r.createdAt}</td>
                  <td className="px-6 py-4"><StatusPill status={r.status} /></td>

                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center"
                        onClick={() => onView?.(r)}
                        title="View"
                      >
                        <FiEye />
                      </button>

                      <button
                        className="w-9 h-9 rounded-xl border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 flex items-center justify-center disabled:opacity-50"
                        onClick={() => onApprove?.(r)}
                        disabled={String(r.status).toLowerCase() !== "pending"}
                        title="Approve"
                      >
                        <FiCheck />
                      </button>

                      <button
                        className="w-9 h-9 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 flex items-center justify-center disabled:opacity-50"
                        onClick={() => onReject?.(r)}
                        disabled={String(r.status).toLowerCase() !== "pending"}
                        title="Reject"
                      >
                        <FiX />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>

            {rows.length === 0 && (
              <tr className="border-t border-slate-100">
                <td colSpan={7} className="px-6 py-10 text-center text-muted">
                  No plan requests.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
