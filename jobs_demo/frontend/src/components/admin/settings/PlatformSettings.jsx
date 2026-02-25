import { motion } from "framer-motion";
import { FiPower, FiTool, FiUsers, FiBriefcase, FiBell } from "react-icons/fi";

function ToggleRow({ icon, title, desc, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 transition">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <div className="font-semibold text-ink">{title}</div>
          <div className="text-xs text-muted mt-1">{desc}</div>
        </div>
      </div>

      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange?.(e.target.checked)}
        className="w-5 h-5 accent-orange-500"
      />
    </div>
  );
}

export default function PlatformSettings({ platform, onChange }) {
  const pl = platform || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="card p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted font-semibold">Platform</div>
          <h3 className="text-lg font-extrabold mt-1">Platform Toggles</h3>
          <p className="text-sm text-muted mt-1">
            Turn modules on/off for the entire portal
          </p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
          <FiTool />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <ToggleRow
          icon={<FiUsers />}
          title="Student Module"
          desc="Enable student registration, profile completion, and job apply"
          value={pl.enableStudentModule}
          onChange={(v) => onChange?.({ ...pl, enableStudentModule: v })}
        />

        <ToggleRow
          icon={<FiBriefcase />}
          title="Company Module"
          desc="Enable company registration, plan purchase, and job posting"
          value={pl.enableCompanyModule}
          onChange={(v) => onChange?.({ ...pl, enableCompanyModule: v })}
        />

        <ToggleRow
          icon={<FiBell />}
          title="Government Updates"
          desc="Enable govt job updates and quick uploads"
          value={pl.enableGovernmentUpdates}
          onChange={(v) => onChange?.({ ...pl, enableGovernmentUpdates: v })}
        />

        <ToggleRow
          icon={<FiPower />}
          title="Maintenance Mode"
          desc="Temporarily disable public features (UI only)"
          value={pl.maintenanceMode}
          onChange={(v) => onChange?.({ ...pl, maintenanceMode: v })}
        />
      </div>
    </motion.div>
  );
}
