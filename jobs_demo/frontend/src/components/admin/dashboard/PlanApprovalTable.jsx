import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCheck, FiX } from "react-icons/fi";

function PlanPill({ value }) {
  const v = String(value || "").toLowerCase();

  const cls =
    v === "premium"
      ? "bg-orange-50 text-orange-700 border-orange-200"
      : v === "enterprise"
      ? "bg-purple-50 text-purple-700 border-purple-200"
      : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cls}`}>
      {value}
    </span>
  );
}

export default function PlanApprovalTable({ items = [], onViewAll }) {
  const [rows, setRows] = useState(items);

  useEffect(() => {
    setRows(Array.isArray(items) ? items : []);
  }, [items]);

  const pendingRows = useMemo(() => {
    // show only pending OR all rows if status not provided
    const list = rows?.length ? rows : [];
    const pending = list.filter((r) => String(r.status || "pending").toLowerCase() === "pending");
    return pending.length ? pending : list;
  }, [rows]);

  const approve = (id) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "approved" } : r
      )
    );
  };

  const reject = (id) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "rejected" } : r
      )
    );
  };

  return (
    <div className="card p-0 overflow-hidden">
      {/* Header like screenshot */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base md:text-lg font-extrabold">
            Pending Plan Approvals
          </h3>
          <p className="text-sm text-muted mt-1">
            Approve or reject company plan requests
          </p>
        </div>

        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-brand-600 hover:underline"
        >
          View All
        </button>
      </div>

      {/* Table */}
      <div className="px-3 pb-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase text-muted">
            <tr className="text-left">
              <th className="px-4 py-3">Company Name</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            <AnimatePresence initial={false}>
              {pendingRows.map((r) => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="border-t border-slate-100 bg-white"
                >
                  <td className="px-4 py-4 font-semibold">{r.company}</td>

                  <td className="px-4 py-4">
                    <PlanPill value={r.planLabel || r.plan || "Basic"} />
                  </td>

                  <td className="px-4 py-4 font-semibold">{r.amount}</td>

                  <td className="px-4 py-4 text-muted">{r.date || r.requestedAt}</td>

                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => approve(r.id)}
                        disabled={String(r.status || "pending").toLowerCase() !== "pending"}
                        className="w-9 h-9 rounded-xl border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Approve"
                      >
                        <FiCheck className="mx-auto" />
                      </button>

                      <button
                        onClick={() => reject(r.id)}
                        disabled={String(r.status || "pending").toLowerCase() !== "pending"}
                        className="w-9 h-9 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Reject"
                      >
                        <FiX className="mx-auto" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        {pendingRows.length === 0 ? (
          <div className="text-center py-8 text-muted text-sm">
            No pending plan requests.
          </div>
        ) : null}
      </div>
    </div>
  );
}
