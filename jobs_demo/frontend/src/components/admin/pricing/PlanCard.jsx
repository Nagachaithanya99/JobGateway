import { motion } from "framer-motion";
import { FiEdit2, FiCheckCircle } from "react-icons/fi";

export default function PlanCard({ plan, onEdit }) {
  const currency = plan?.currency || "₹";
  const isUnlimited = (v) => String(v).toLowerCase() === "unlimited";

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className={`card p-6 relative overflow-hidden ${
        plan?.highlight ? "ring-2 ring-brand-300" : ""
      }`}
    >
      {plan?.highlight ? (
        <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-brand-100" />
      ) : null}

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-muted font-semibold">Plan</div>
            <div className="text-2xl font-extrabold mt-1">{plan?.name}</div>
          </div>

          <button
            onClick={() => onEdit?.(plan)}
            className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center"
            title="Edit Plan"
          >
            <FiEdit2 />
          </button>
        </div>

        <div className="mt-4 flex items-end gap-2">
          <div className="text-4xl font-extrabold">
            {currency}
            {plan?.price}
          </div>
          <div className="text-sm text-muted font-semibold mb-1">
            / {plan?.durationDays} days
          </div>
        </div>

        <div className="mt-5 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted">Jobs Allowed</span>
            <b className="text-ink">
              {isUnlimited(plan?.jobsLimit) ? "Unlimited" : plan?.jobsLimit}
            </b>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Applications Allowed</span>
            <b className="text-ink">
              {isUnlimited(plan?.appsLimit) ? "Unlimited" : plan?.appsLimit}
            </b>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Status</span>
            <span
              className={`badge ${
                plan?.active
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              {plan?.active ? "Active" : "Disabled"}
            </span>
          </div>
        </div>

        <div className="mt-6">
          <button className="btn-primary w-full px-4 py-2 flex items-center justify-center gap-2">
            <FiCheckCircle /> Use as Featured (UI)
          </button>
          <div className="text-xs text-muted mt-2">
            * UI only now. Next step we will persist it.
          </div>
        </div>
      </div>
    </motion.div>
  );
}
