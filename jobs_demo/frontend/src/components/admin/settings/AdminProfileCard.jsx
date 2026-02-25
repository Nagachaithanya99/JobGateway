import { motion } from "framer-motion";
import { FiMail, FiShield, FiUser } from "react-icons/fi";

export default function AdminProfileCard({ profile }) {
  const p = profile || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="card p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted font-semibold">Admin Profile</div>
          <h3 className="text-lg font-extrabold mt-1">Account Details</h3>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center font-extrabold text-brand-700">
          {String(p?.name || "A")
            .split(" ")
            .map((x) => x[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
      </div>

      <div className="mt-5 space-y-3 text-sm">
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
            <FiUser />
          </span>
          <div>
            <div className="text-xs text-muted">Name</div>
            <div className="font-semibold text-ink">{p?.name || "—"}</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
            <FiMail />
          </span>
          <div>
            <div className="text-xs text-muted">Email</div>
            <div className="font-semibold text-ink">{p?.email || "—"}</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
            <FiShield />
          </span>
          <div>
            <div className="text-xs text-muted">Role</div>
            <span className="badge bg-brand-50 border-brand-200 text-brand-700 mt-1 inline-block">
              {p?.role || "Admin"}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
