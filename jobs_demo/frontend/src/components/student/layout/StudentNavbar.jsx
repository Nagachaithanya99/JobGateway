import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  FiBell,
  FiChevronDown,
  FiLogOut,
  FiMenu,
  FiMessageSquare,
  FiSearch,
  FiSettings,
  FiUser,
  FiX,
} from "react-icons/fi";
import useAuth from "../../../hooks/useAuth.js";
import Modal from "../../common/Modal.jsx";
import LanguageSelector from "../../common/LanguageSelector.jsx";
import { useI18n } from "../../../context/I18nContext.jsx";
import {
  studentListConversations,
  studentListNotifications,
} from "../../../services/studentService.js";

const navItems = [
  { to: "/student", key: "nav.home" },
  { to: "/student/jobs", key: "nav.jobs" },
  { to: "/student/internship", key: "nav.internships" },
  { to: "/student/government", key: "nav.governmentJobs" },
  { to: "/student/my-jobs", key: "nav.myJobs" },
  { to: "/student/saved-jobs", key: "nav.saved" },
  { to: "/student/resume-builder", key: "nav.resumeBuilder" },
];

const desktopLinkCls = ({ isActive }) =>
  `rounded-xl px-3 py-2 text-sm font-semibold transition duration-200 ${
    isActive
      ? "bg-blue-50 text-[#2563EB]"
      : "text-slate-700 hover:bg-blue-50 hover:text-[#0F172A]"
  }`;

const mobileLinkCls = ({ isActive }) =>
  `block rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive ? "bg-blue-50 text-[#2563EB]" : "text-slate-700 hover:bg-slate-50"
  }`;

export default function StudentNavbar() {
  const { logout, user, isAuthed } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchType, setSearchType] = useState("Jobs");
  const [searchText, setSearchText] = useState("");

  const [messagesUnread, setMessagesUnread] = useState(0);
  const [notificationsUnread, setNotificationsUnread] = useState(0);
  const profileCompletion = Number(user?.profileCompletion ?? 0);

  const isNotificationsPage = location.pathname.startsWith("/student/notifications");
  const isMessagesPage = location.pathname.startsWith("/student/messages");
  const skipUnreadPolling =
    location.pathname.startsWith("/student/profile") ||
    location.pathname.startsWith("/student/settings") ||
    location.pathname.startsWith("/student/resume-builder");

  const initials = useMemo(() => {
    const name = (user?.name || "Student").trim();
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((x) => x[0]?.toUpperCase() || "")
      .join("");
  }, [user?.name]);

  const onLogout = () => {
    logout();
    nav("/student/login");
  };

  useEffect(() => {
    if (!isAuthed || skipUnreadPolling) {
      setMessagesUnread(0);
      setNotificationsUnread(0);
      return;
    }

    let mounted = true;

    const loadCounts = async () => {
      try {
        const [convRes, notifRes] = await Promise.all([
          studentListConversations(),
          studentListNotifications({ status: "Unread", limit: 1 }),
        ]);

        if (!mounted) return;

        const convItems = Array.isArray(convRes?.data) ? convRes.data : [];
        const msgCount = convItems.reduce(
          (sum, c) => sum + (Number(c?.unread) || 0),
          0
        );
        setMessagesUnread(msgCount);

        const notifUnread = Number(notifRes?.data?.unreadCount || 0);
        setNotificationsUnread(notifUnread);
      } catch {
        if (!mounted) return;
        setMessagesUnread(0);
        setNotificationsUnread(0);
      }
    };

    loadCounts();
    const timer = setInterval(loadCounts, 10000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [isAuthed, skipUnreadPolling, location.pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => setMobileOpen((s) => !s)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <FiX /> : <FiMenu />}
        </button>

        <Link to="/student" className="text-xl font-bold">
          <span className="text-[#2563EB]">Job</span>
          <span className="text-[#F97316]">Gateway</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink key={item.to} className={desktopLinkCls} to={item.to}>
              {t(item.key)}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LanguageSelector compact />
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label="Search"
          >
            <FiSearch />
          </button>

          <button
            type="button"
            onClick={() => nav("/student/messages")}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label="Messages"
          >
            <FiMessageSquare className={isMessagesPage ? "text-[#2563EB]" : ""} />
            {messagesUnread > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 animate-pulse items-center justify-center rounded-full bg-[#2563EB] px-1 text-[10px] font-bold text-white">
                {messagesUnread}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => nav("/student/notifications")}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label="Notifications"
          >
            <FiBell className={isNotificationsPage ? "text-[#2563EB]" : ""} />
            {notificationsUnread > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 animate-pulse items-center justify-center rounded-full bg-[#F97316] px-1 text-[10px] font-bold text-white">
                {notificationsUnread}
              </span>
            ) : null}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((s) => !s)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5 hover:bg-slate-50"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-[#F97316]">
                {initials}
              </span>
              <FiChevronDown className={`text-slate-500 transition ${menuOpen ? "rotate-180" : ""}`} />
            </button>

            {menuOpen ? (
              <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    nav("/student/profile");
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <FiUser />
                  {t("nav.myProfile")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    nav("/student/settings");
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <FiSettings />
                  {t("nav.settings")}
                </button>
                {isAuthed ? (
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
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="mx-auto max-w-[1200px] space-y-3 px-4 py-3 sm:px-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Profile Completion</span>
                <span>{profileCompletion}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[#F97316] transition-all"
                  style={{ width: `${Math.max(0, Math.min(100, profileCompletion))}%` }}
                />
              </div>
            </div>

            {navItems.map((item) => (
              <NavLink key={`m_${item.to}`} onClick={() => setMobileOpen(false)} className={mobileLinkCls} to={item.to}>
                {t(item.key)}
              </NavLink>
            ))}
            <NavLink onClick={() => setMobileOpen(false)} className={mobileLinkCls} to="/student/messages">
              {t("nav.messages")}
            </NavLink>
          </div>
        </div>
      ) : null}

      <Modal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        title={t("search.student.quick")}
        widthClass="max-w-lg"
        footer={
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Search
          </button>
        }
      >
        <div className="space-y-3">
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder={t("search.anything")}
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
          />
          <div className="flex flex-wrap gap-2">
            {["Jobs", "Companies", "Locations"].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setSearchType(chip)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  searchType === chip
                    ? "border-blue-200 bg-blue-50 text-[#2563EB]"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500">Search type: {searchType}</p>
        </div>
      </Modal>
    </header>
  );
}
