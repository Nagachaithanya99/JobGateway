import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FiGrid,
  FiUsers,
  FiBriefcase,
  FiFileText,
  FiUser,
  FiDollarSign,
  FiImage,
  FiShield,
  FiBell,
  FiGlobe,
  FiSettings,
  FiX,
} from "react-icons/fi";

const navItems = [
  { to: "/admin", icon: <FiGrid />, label: "Dashboard" },
  { to: "/admin/companies", icon: <FiUsers />, label: "Companies" },
  { to: "/admin/jobs", icon: <FiBriefcase />, label: "Company Jobs" },
  { to: "/admin/my-jobs", icon: <FiBriefcase />, label: "My Jobs" },
  { to: "/admin/applicants", icon: <FiFileText />, label: "Company Applications" },
  { to: "/admin/my-applications", icon: <FiFileText />, label: "My Applications" },
  { to: "/admin/students", icon: <FiUser />, label: "Students" },
  { to: "/admin/pricing", icon: <FiDollarSign />, label: "Pricing Plans" },
  { to: "/admin/content", icon: <FiImage />, label: "Content Management" },
  { to: "/admin/ads", icon: <FiImage />, label: "Ads Users" },
  { to: "/admin/gov", icon: <FiGlobe />, label: "Government Updates" },
  { to: "/admin/roles", icon: <FiShield />, label: "Roles & Permissions" },
  { to: "/admin/notifications", icon: <FiBell />, label: "Notifications" },
  { to: "/admin/settings", icon: <FiSettings />, label: "Settings" },
];

function SidebarItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === "/admin"}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all ${
          isActive
            ? "border-orange-100 bg-[#FFF3EB] text-[#FF6B00]"
            : "border-transparent text-slate-600 hover:bg-[#FFF8F3] hover:text-[#FF6B00]"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive ? <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#FF6B00]" /> : null}

          <span
            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border text-[17px] transition-all ${
              isActive
                ? "border-orange-200 bg-white text-[#FF6B00]"
                : "border-slate-200 bg-slate-50 text-slate-500 group-hover:border-orange-200 group-hover:bg-orange-50 group-hover:text-[#FF6B00]"
            }`}
          >
            {icon}
          </span>

          <span className="hidden xl:block">{label}</span>
        </>
      )}
    </NavLink>
  );
}

function SidebarContent({ onClose }) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-5">
        <div className="text-xl font-bold tracking-tight">
          <span className="text-[#1F2937]">Job</span>
          <span className="text-[#FF6B00]">Gateway</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#FF6B00] md:hidden"
          aria-label="Close menu"
        >
          <FiX />
        </button>
      </div>

      <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <SidebarItem key={item.to} to={item.to} icon={item.icon} label={item.label} />
        ))}
      </nav>
    </div>
  );
}

export default function Sidebar({ mobileOpen, onClose }) {
  const location = useLocation();

  useEffect(() => {
    onClose?.();
  }, [location.pathname, onClose]);

  return (
    <>
      <aside className="sticky top-0 hidden h-screen overflow-hidden border-r border-slate-200 bg-white shadow-[6px_0_20px_rgba(15,23,42,0.04)] md:block md:w-24 xl:w-72">
        <SidebarContent />
      </aside>

      <aside
        className="fixed inset-y-0 left-0 z-50 w-72 overflow-hidden border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 md:hidden"
        style={{ transform: mobileOpen ? "translateX(0)" : "translateX(-100%)" }}
      >
        <SidebarContent onClose={onClose} />
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/35 md:hidden"
          onClick={onClose}
          aria-label="Close sidebar overlay"
        />
      ) : null}
    </>
  );
}
