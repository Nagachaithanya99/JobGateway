import { NavLink } from "react-router-dom";
import {
  FiGrid,
  FiUsers,
  FiBriefcase,
  FiFileText,
  FiBarChart2,
  FiSettings,
  FiHelpCircle,
} from "react-icons/fi";

const itemCls = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition ${
    isActive
      ? "bg-orange-600 text-white shadow-sm"
      : "text-slate-700 hover:bg-slate-100"
  }`;

export default function AdminSidebar() {
  return (
    <aside className="hidden md:flex w-[270px] shrink-0 border-r border-slate-200 bg-white min-h-screen sticky top-0">
      <div className="w-full p-4 flex flex-col">
        {/* Brand */}
        <div className="px-2 py-2">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-orange-600 text-white font-extrabold grid place-items-center">
              JP
            </div>
            <div className="leading-tight">
              <div className="text-lg font-extrabold text-slate-900">JobPortal</div>
              <div className="text-xs text-slate-500">Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="mt-4 space-y-1">
          <NavLink to="/admin" end className={itemCls}>
            <FiGrid />
            Dashboard
          </NavLink>

          <NavLink to="/admin/companies" className={itemCls}>
            <FiUsers />
            Companies
          </NavLink>

          <NavLink to="/admin/candidates" className={itemCls}>
            <FiFileText />
            Candidates
          </NavLink>

          <NavLink to="/admin/jobs" className={itemCls}>
            <FiBriefcase />
            Jobs
          </NavLink>

          <NavLink to="/admin/applications" className={itemCls}>
            <FiFileText />
            Applications
          </NavLink>

          <NavLink to="/admin/analytics" className={itemCls}>
            <FiBarChart2 />
            Analytics
          </NavLink>

          <NavLink to="/admin/settings" className={itemCls}>
            <FiSettings />
            Settings
          </NavLink>

          <NavLink to="/admin/support" className={itemCls}>
            <FiHelpCircle />
            Support
          </NavLink>
        </nav>

        {/* Help box */}
        <div className="mt-auto pt-4">
          <div className="rounded-2xl bg-orange-50 border border-orange-100 p-4">
            <div className="text-sm font-extrabold text-slate-900">Need Help?</div>
            <div className="text-xs text-slate-600 mt-1">
              Contact our support team.
            </div>
            <button className="mt-3 w-full h-10 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 transition">
              Get Support
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
