import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiUsers, FiBriefcase, FiDollarSign, FiGlobe } from "react-icons/fi";

const actions = [
  { to: "/admin/companies", label: "Manage Companies", icon: <FiUsers /> },
  { to: "/admin/jobs", label: "Manage Jobs", icon: <FiBriefcase /> },
  { to: "/admin/pricing", label: "Pricing & Requests", icon: <FiDollarSign /> },
  { to: "/admin/gov", label: "Gov Updates", icon: <FiGlobe /> },
];

export default function QuickActions() {
  return (
    <div className="card p-6">
      <h3 className="text-lg font-extrabold">Quick Actions</h3>
      <p className="text-sm text-muted mt-1">Jump to common admin tasks</p>

      <div className="mt-5 grid sm:grid-cols-2 gap-3">
        {actions.map((a, i) => (
          <motion.div
            key={a.to}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.04 }}
          >
            <Link
              to={a.to}
              className="block rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-700 text-lg">
                  {a.icon}
                </div>
                <div className="font-semibold">{a.label}</div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
