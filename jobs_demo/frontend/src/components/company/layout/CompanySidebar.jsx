import { NavLink } from "react-router-dom";
import {
  FiActivity,
  FiBell,
  FiBriefcase,
  FiCalendar,
  FiCompass,
  FiDollarSign,
  FiGrid,
  FiMessageSquare,
  FiPlusSquare,
  FiSettings,
  FiStar,
  FiTrendingUp,
  FiUsers,
  FiX,
} from "react-icons/fi";

const nav = [
  { to: "/company/dashboard", label: "Dashboard", icon: <FiGrid /> },
  { to: "/company/explore", label: "Explore", icon: <FiCompass /> },
  { to: "/company/post-job", label: "Post Job", icon: <FiPlusSquare /> },
  { to: "/company/my-jobs", label: "Posted Jobs", icon: <FiBriefcase /> },
  { to: "/company/candidates", label: "Applications", icon: <FiUsers /> },
  { to: "/company/ai-scoring", label: "AI Candidate Scoring", icon: <FiActivity /> },
  { to: "/company/shortlisted", label: "Shortlisted", icon: <FiStar /> },
  { to: "/company/interviews", label: "Interviews", icon: <FiCalendar /> },
  { to: "/company/messages", label: "Messages", icon: <FiMessageSquare /> },
  { to: "/company/notifications", label: "Notifications", icon: <FiBell /> },
  { to: "/company/pricing", label: "Subscription Plans", icon: <FiDollarSign /> },
  { to: "/company/billing", label: "Billing & Invoices", icon: <FiDollarSign /> },
  { to: "/company/boost-job", label: "Boost Job", icon: <FiTrendingUp />, premium: true },
  { to: "/company/settings", label: "Settings", icon: <FiSettings /> },
];

function MenuItem({ item, onClick, mobile = false }) {
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition ${
          isActive
            ? item.premium
              ? "border-l-4 border-l-[#F97316] bg-orange-50 text-[#F97316]"
              : "border-l-4 border-l-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
            : item.premium
              ? "text-slate-700 hover:bg-orange-50 hover:text-[#F97316]"
              : "text-slate-700 hover:bg-[#EFF6FF]"
        }`
      }
      title={!mobile ? item.label : undefined}
    >
      <span className="text-base">{item.icon}</span>
      <span className={mobile ? "truncate" : "hidden truncate xl:block"}>{item.label}</span>
    </NavLink>
  );
}

function CompanyInfo({ compact = false }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-slate-50 p-3 ${compact ? "text-center" : ""}`}>
      <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-[#2563EB] ${compact ? "" : "mr-2"}`}>
        TS
      </div>
      <div className={compact ? "hidden" : ""}>
        <p className="text-sm font-semibold text-[#0F172A]">Tech Solutions Inc.</p>
        <p className="mt-1 inline-flex rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-[#F97316]">
          Premium
        </p>
        <button type="button" className="mt-2 w-full rounded-lg border border-orange-200 px-3 py-1.5 text-xs font-semibold text-[#F97316] hover:bg-orange-50">
          Upgrade Plan
        </button>
      </div>
    </div>
  );
}

export default function CompanySidebar({ mobileOpen = false, onClose }) {
  return (
    <>
      <aside className="hidden h-screen border-r border-slate-200 bg-white shadow-sm lg:sticky lg:top-0 lg:block lg:w-[88px] xl:w-[240px]">
        <div className="flex h-full flex-col p-3 xl:p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 xl:px-1">Company Panel</div>
          <div className="mt-3 flex-1 space-y-1 overflow-y-auto">
            {nav.map((item) => (
              <MenuItem key={item.to} item={item} />
            ))}
          </div>
          <div className="mt-3 border-t border-slate-200 pt-3">
            <div className="xl:hidden">
              <CompanyInfo compact />
            </div>
            <div className="hidden xl:block">
              <CompanyInfo />
            </div>
          </div>
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/35" onClick={onClose} />
          <aside className="absolute left-0 top-0 h-full w-[240px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-[#0F172A]">Company Panel</p>
              <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50">
                <FiX />
              </button>
            </div>
            <div className="space-y-1 p-3">
              {nav.map((item) => (
                <MenuItem key={`m_${item.to}`} item={item} onClick={onClose} mobile />
              ))}
            </div>
            <div className="border-t border-slate-200 p-3">
              <CompanyInfo />
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
