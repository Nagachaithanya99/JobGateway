import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiBell, FiChevronDown, FiLogOut, FiMenu, FiMessageSquare, FiSearch, FiSettings, FiUser } from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext.jsx";
import { getCompanyHeaderCounts } from "../../../services/companyService.js";
import LanguageSelector from "../../common/LanguageSelector.jsx";
import ThemeToggle from "../../common/ThemeToggle.jsx";
import { useI18n } from "../../../context/I18nContext.jsx";

export default function CompanyNavbar({ onOpenSidebar }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [headerCounts, setHeaderCounts] = useState({ notifications: 0, messages: 0 });

  useEffect(() => {
    let cancelled = false;
    let intervalId;

    async function fetchHeaderCounts() {
      try {
        const data = await getCompanyHeaderCounts();
        if (!cancelled) {
          setHeaderCounts({
            notifications: Number(data?.notifications || 0),
            messages: Number(data?.messages || 0),
          });
        }
      } catch {
        if (!cancelled) {
          setHeaderCounts({ notifications: 0, messages: 0 });
        }
      }
    }

    fetchHeaderCounts();
    intervalId = setInterval(fetchHeaderCounts, 10000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const initials = useMemo(() => {
    const name = (user?.name || "Company").trim();
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((x) => x[0]?.toUpperCase() || "")
      .join("");
  }, [user?.name]);

  const onLogout = () => {
    logout();
    navigate("/company/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="px-5 py-3.5 lg:px-7">
        <div className="flex min-h-[36px] items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
            aria-label="Open menu"
          >
            <FiMenu />
          </button>

          <Link to="/company/dashboard" className="text-xl font-bold">
            <span className="text-[#2563EB]">Job</span>
            <span className="text-[#F97316]">Gateway</span>
          </Link>

          <div className="mx-2 hidden flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100">
            <FiSearch className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm outline-none"
              placeholder={t("search.anything")}
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <LanguageSelector compact />
            <button
              type="button"
              onClick={() => navigate("/company/notifications")}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <FiBell />
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 animate-pulse items-center justify-center rounded-full bg-[#F97316] px-1 text-[10px] font-bold text-white">
                {headerCounts.notifications}
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/company/messages")}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <FiMessageSquare />
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 animate-pulse items-center justify-center rounded-full bg-[#2563EB] px-1 text-[10px] font-bold text-white">
                {headerCounts.messages}
              </span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-2 py-1.5 hover:bg-slate-50"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-[#2563EB]">
                  {initials}
                </span>
                <FiChevronDown className={`text-slate-500 transition ${menuOpen ? "rotate-180" : ""}`} />
              </button>

              {menuOpen ? (
                <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/company/profile");
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <FiUser />
                    Company Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/company/pricing");
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <FiUser />
                    Subscription
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/company/settings");
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <FiSettings />
                    {t("nav.settings")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onLogout();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    <FiLogOut />
                    {t("nav.logout")}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
