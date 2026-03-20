import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiBell, FiChevronDown, FiLogOut, FiMenu, FiSearch, FiUser } from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";
import { useI18n } from "../../../context/I18nContext.jsx";
import LanguageSelector from "../../common/LanguageSelector.jsx";
import ThemeToggle from "../../common/ThemeToggle.jsx";

const titleMap = {
  "/admin": "Admin Dashboard",
  "/admin/companies": "Companies",
  "/admin/jobs": "Jobs",
  "/admin/applicants": "Applicants",
  "/admin/students": "Students",
  "/admin/interviews": "Interviews",
  "/admin/pricing": "Pricing Plans",
  "/admin/content": "Content Management",
  "/admin/ads": "Ads Users",
  "/admin/gov": "Government Updates",
  "/admin/roles": "Roles & Permissions",
  "/admin/notifications": "Notification Center",
  "/admin/profile": "Admin Profile",
  "/admin/settings": "Settings",
};

function getTitle(pathname) {
  if (titleMap[pathname]) return titleMap[pathname];

  const matched = Object.keys(titleMap).find(
    (route) => route !== "/admin" && pathname.startsWith(`${route}/`),
  );

  return matched ? titleMap[matched] : "Admin Panel";
}

export default function TopNavbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = useMemo(() => {
    const name = user?.name || "Admin User";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");
  }, [user?.name]);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1400px] items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#FF6B00] md:hidden"
          aria-label="Open sidebar"
        >
          <FiMenu className="text-lg" />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold text-[#1F2937]">{getTitle(location.pathname)}</h1>
        </div>

        <div className="mx-auto hidden w-full max-w-xl items-center md:flex">
          <label className="relative w-full">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t("search.anything")}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-orange-300 focus:bg-white"
            />
          </label>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <LanguageSelector compact />
          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#FF6B00]"
            aria-label="Notifications"
          >
            <FiBell className="text-lg" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#FF6B00]" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-2 py-1.5 transition hover:border-orange-200 hover:bg-orange-50"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF3EB] text-sm font-semibold text-[#FF6B00]">
                {initials}
              </span>
              <span className="hidden text-sm font-medium text-slate-700 sm:block">{user?.name || "Admin"}</span>
              <FiChevronDown className="text-slate-500" />
            </button>

            {menuOpen ? (
              <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    navigate("/admin/profile");
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50"
                >
                  <FiUser />
                  {t("nav.myProfile")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
                >
                  <FiLogOut />
                  {t("nav.logout")}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
