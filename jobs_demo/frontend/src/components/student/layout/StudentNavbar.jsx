import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  FiBell,
  FiBriefcase,
  FiChevronDown,
  FiClock,
  FiCompass,
  FiCreditCard,
  FiLogOut,
  FiMenu,
  FiMapPin,
  FiMessageSquare,
  FiSearch,
  FiSettings,
  FiTrendingUp,
  FiUser,
  FiX,
} from "react-icons/fi";
import useAuth from "../../../hooks/useAuth.js";
import LanguageSelector from "../../common/LanguageSelector.jsx";
import ThemeToggle from "../../common/ThemeToggle.jsx";
import { useI18n } from "../../../context/I18nContext.jsx";
import {
  studentListConversations,
  studentListNotifications,
} from "../../../services/studentService.js";

const navItems = [
  { to: "/student", key: "nav.home" },
  { to: "/student/career-pulse", key: "nav.home", label: "Pulse" },
  { to: "/student/jobs", key: "nav.jobs" },
  { to: "/student/internship", key: "nav.internships" },
  { to: "/student/government", key: "nav.governmentJobs" },
  { to: "/student/my-jobs", key: "nav.myJobs" },
  { to: "/student/interviews", key: "nav.interviews" },
  { to: "/student/billing", key: "nav.billing", label: "Billing" },
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
  const [recentSearches, setRecentSearches] = useState([]);

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

  const quickSearches = [
    { key: "Jobs", label: "Jobs", helper: "Role, skills, company", icon: <FiBriefcase /> },
    { key: "Companies", label: "Companies", helper: "Brand and hiring teams", icon: <FiCompass /> },
    { key: "Locations", label: "Locations", helper: "City and remote filters", icon: <FiMapPin /> },
  ];
  const searchStorageKey = useMemo(() => {
    const studentKey = user?._id || user?.id || user?.email || user?.name || "guest";
    return `jobgateway-student-searches:${studentKey}`;
  }, [user]);

  const popularSearches = useMemo(
    () => ({
      Jobs: ["Frontend Developer", "UI UX Designer", "React Developer", "Java Developer", "Data Analyst"],
      Companies: ["TCS", "Infosys", "Wipro", "Accenture", "Google"],
      Locations: ["Hyderabad", "Bengaluru", "Chennai", "Pune", "Remote"],
    }),
    [],
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(searchStorageKey);
      const parsed = JSON.parse(raw || "[]");
      setRecentSearches(Array.isArray(parsed) ? parsed.slice(0, 6) : []);
    } catch {
      setRecentSearches([]);
    }
  }, [searchStorageKey]);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchText("");
    setSearchType("Jobs");
  };

  const navigateSearch = (type, value) => {
    const params = new URLSearchParams();

    if (type === "Locations") {
      if (value) params.set("location", value);
    } else {
      if (value) params.set("q", value);
      if (type === "Companies") params.set("scope", "company");
    }

    nav(`/student/jobs${params.toString() ? `?${params.toString()}` : ""}`);
    setSearchOpen(false);
  };

  const storeRecentSearch = (type, value) => {
    const trimmed = String(value || "").trim();
    if (!trimmed) return;
    const next = [{ type, value: trimmed }, ...recentSearches.filter((item) => !(item.type === type && item.value === trimmed))].slice(0, 6);
    setRecentSearches(next);
    try {
      window.localStorage.setItem(searchStorageKey, JSON.stringify(next));
    } catch {
      // ignore storage failures
    }
  };

  const runSearch = () => {
    const value = searchText.trim();
    if (!value) return;
    storeRecentSearch(searchType, value);
    navigateSearch(searchType, value);
  };

  const handlePresetSearch = (type, value) => {
    setSearchType(type);
    setSearchText(value);
    storeRecentSearch(type, value);
    navigateSearch(type, value);
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
      <div className="flex h-16 w-full items-center gap-3 px-4 sm:px-6 lg:px-8">
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
            <NavLink key={item.to} className={desktopLinkCls} to={item.to} end={item.to === "/student"}>
              {item.label || t(item.key)}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <LanguageSelector compact />
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#dbe6ff] bg-[linear-gradient(135deg,#eff6ff_0%,#fff7ed_100%)] text-[#1d4ed8] shadow-[0_10px_25px_rgba(37,99,235,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(249,115,22,0.16)]"
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
                    nav("/student/billing");
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <FiCreditCard />
                  Billing
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

      {searchOpen ? (
        <div className="border-t border-slate-200 bg-[linear-gradient(180deg,rgba(246,248,255,0.96)_0%,rgba(241,245,255,0.98)_100%)]">
          <div className="mx-auto w-full max-w-[1500px] px-4 py-3 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-[22px] border border-white/70 bg-white/75 p-3 shadow-[0_16px_38px_rgba(15,23,42,0.07)] backdrop-blur">
              <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_48%,#eef4ff_100%)] p-4 shadow-[0_10px_22px_rgba(15,23,42,0.04)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[12px] font-black uppercase tracking-[0.22em] text-[#2563EB]">Quick Search</p>
                    <p className="mt-1 text-[13px] font-semibold text-slate-500">Search jobs, companies, or locations</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeSearch}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50"
                    aria-label="Close quick search"
                  >
                    <FiX />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {quickSearches.map((chip) => (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => setSearchType(chip.key)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-extrabold transition ${
                        searchType === chip.key
                          ? "border-[#bfdbfe] bg-[linear-gradient(135deg,#eff6ff_0%,#fff7ed_100%)] text-[#2563EB] shadow-[0_10px_24px_rgba(37,99,235,0.10)]"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-base">{chip.icon}</span>
                      {chip.label}
                    </button>
                  ))}
                </div>

                <div className="mt-4 rounded-[20px] border border-slate-200 bg-white p-3.5 shadow-[0_12px_26px_rgba(15,23,42,0.05)]">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,#ffedd5_0%,#dbeafe_100%)] text-[20px] text-[#2563EB]">
                      <FiSearch />
                    </div>
                    <div className="min-w-0 flex-1">
                      <input
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") runSearch();
                        }}
                        placeholder={
                          searchType === "Locations"
                            ? "Search by city, state, or remote"
                            : searchType === "Companies"
                            ? "Search by company or hiring team"
                            : "Job title, skills, or company"
                        }
                        className="h-12 w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-[15px] font-semibold text-slate-700 outline-none transition focus:border-orange-300 focus:bg-white"
                      />
                      <p className="mt-2 px-1 text-[13px] font-semibold text-slate-500">
                        Active search: <span className="font-extrabold text-slate-900">{searchType}</span>
                      </p>
                    </div>
                    <div className="flex gap-3 self-end xl:self-auto">
                      <button
                        type="button"
                        onClick={closeSearch}
                        className="inline-flex h-12 items-center justify-center rounded-[16px] border border-slate-200 bg-white px-4 text-[15px] font-bold text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={runSearch}
                        className="inline-flex h-12 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,#2563EB_0%,#F97316_100%)] px-5 text-[15px] font-extrabold text-white shadow-[0_16px_30px_rgba(37,99,235,0.20)]"
                      >
                        Search Now
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-[18px] border border-slate-200 bg-slate-50/80 p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
                          <FiClock />
                        </span>
                        <div>
                          <p className="text-[13px] font-extrabold text-slate-900">Recent Searches</p>
                          <p className="text-[11px] font-semibold text-slate-500">Searches from this student</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {recentSearches.length ? (
                          recentSearches.map((item) => (
                            <button
                              key={`${item.type}-${item.value}`}
                              type="button"
                              onClick={() => handlePresetSearch(item.type, item.value)}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-bold text-slate-700 hover:border-orange-200 hover:text-[#F97316]"
                            >
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
                                {item.type}
                              </span>
                              {item.value}
                            </button>
                          ))
                        ) : (
                          <p className="text-[13px] font-semibold text-slate-500">No recent searches yet. Your next search will appear here.</p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[18px] border border-slate-200 bg-[linear-gradient(135deg,#fff7ed_0%,#eff6ff_100%)] p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#2563EB] shadow-sm">
                          <FiTrendingUp />
                        </span>
                        <div>
                          <p className="text-[13px] font-extrabold text-slate-900">Popular Searches</p>
                          <p className="text-[11px] font-semibold text-slate-500">Quick picks for {searchType.toLowerCase()}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(popularSearches[searchType] || []).map((item) => (
                          <button
                            key={`${searchType}-${item}`}
                            type="button"
                            onClick={() => handlePresetSearch(searchType, item)}
                            className="inline-flex items-center rounded-full border border-[#dbe6ff] bg-white/90 px-3 py-1.5 text-[13px] font-bold text-slate-700 hover:border-[#93c5fd] hover:text-[#2563EB]"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {mobileOpen ? (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="w-full space-y-3 px-4 py-3 sm:px-6">
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
              <NavLink key={`m_${item.to}`} onClick={() => setMobileOpen(false)} className={mobileLinkCls} to={item.to} end={item.to === "/student"}>
                {item.label || t(item.key)}
              </NavLink>
            ))}
            <NavLink onClick={() => setMobileOpen(false)} className={mobileLinkCls} to="/student/messages">
              {t("nav.messages")}
            </NavLink>
          </div>
        </div>
      ) : null}

    </header>
  );
}
