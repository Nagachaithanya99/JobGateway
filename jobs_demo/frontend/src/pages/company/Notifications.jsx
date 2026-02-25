// src/pages/company/Notifications.jsx
import { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiBell,
  FiCalendar,
  FiChevronRight,
  FiCreditCard,
  FiMessageSquare,
  FiUserPlus,
  FiX,
} from "react-icons/fi";
import Toast from "../../components/common/Toast.jsx";
import {
  getCompanySettingsMe,
  listCompanyNotifications,
  markAllCompanyNotificationsRead,
  markCompanyNotificationRead,
  updateCompanyNotifications,
} from "../../services/companyService.js";

function typeMeta(type) {
  const map = {
    Applications: { icon: FiUserPlus, tone: "text-[#2563EB] bg-blue-50" },
    Interviews: { icon: FiCalendar, tone: "text-orange-600 bg-orange-50" },
    Messages: { icon: FiMessageSquare, tone: "text-indigo-600 bg-indigo-50" },
    Billing: { icon: FiCreditCard, tone: "text-[#F97316] bg-orange-50" },
    System: { icon: FiAlertCircle, tone: "text-slate-600 bg-slate-100" },
  };
  return map[type] || map.System;
}

const filters = ["All", "Applications", "Interviews", "Messages", "Billing", "System Alerts"];

export default function CompanyNotifications() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");

  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("This Month");

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", tone: "dark" });

  const [prefs, setPrefs] = useState({
    apps: true,
    interviews: true,
    planExpiry: true,
    dailySummary: true,
    sms: false,
    whatsapp: true,
  });

  const ping = (message, tone = "dark") => setToast({ show: true, message, tone });

  const fetchNotifications = async () => {
    try {
      setLoadErr("");
      setLoading(true);

      const data = await listCompanyNotifications({
        type: typeFilter,
        status: statusFilter,
      });

      const items = Array.isArray(data) ? data : data?.items || [];
      setRows(items);
    } catch (e) {
      setLoadErr(e?.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getCompanySettingsMe();
        const n = data?.company?.notifications || {};
        setPrefs({
          apps: Boolean(n.newApplication),
          interviews: Boolean(n.interviewScheduled),
          planExpiry: Boolean(n.planExpiry),
          dailySummary: Boolean(n.dailySummary),
          sms: Boolean(n.sms),
          whatsapp: Boolean(n.whatsapp),
        });
      } catch {
        // keep defaults if settings API fails
      }
    })();
  }, []);

  const unreadCount = rows.filter((r) => !r.read).length;

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (dateFilter === "Today" && r.dateGroup !== "Today") return false;
      if (dateFilter === "This Week" && r.dateGroup === "Earlier") return false;
      return true;
    });
  }, [rows, dateFilter]);

  const grouped = {
    Today: filtered.filter((r) => r.dateGroup === "Today"),
    Yesterday: filtered.filter((r) => r.dateGroup === "Yesterday"),
    Earlier: filtered.filter((r) => r.dateGroup === "Earlier"),
  };

  const markAllRead = async () => {
    try {
      setRows((prev) => prev.map((x) => ({ ...x, read: true })));
      await markAllCompanyNotificationsRead();
      ping("All notifications marked as read", "success");
    } catch (e) {
      ping(e?.response?.data?.message || "Failed to mark all read", "error");
      fetchNotifications();
    }
  };

  const toggleRead = async (id, nextRead) => {
    setRows((prev) => prev.map((x) => (x.id === id ? { ...x, read: nextRead } : x)));
    try {
      await markCompanyNotificationRead(id, nextRead);
    } catch (e) {
      ping("Failed to update", "error");
      fetchNotifications();
    }
  };

  return (
    <div className="space-y-5 pb-20 md:pb-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            Stay updated on applications, interviews, and billing activity
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={markAllRead}
            className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50"
          >
            Mark All as Read
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="rounded-xl px-1 py-2 text-sm font-semibold text-[#2563EB] hover:text-blue-700"
          >
            Notification Settings
          </button>

        </div>
      </header>

      {loadErr ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {loadErr}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                typeFilter === f
                  ? "border-blue-200 bg-blue-50 text-[#2563EB]"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {f}
            </button>
          ))}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="ml-auto h-9 rounded-lg border border-slate-200 px-3 text-xs"
          >
            <option>All</option>
            <option>Unread</option>
            <option>Read</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 px-3 text-xs"
          >
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
          </select>
        </div>
      </section>

      <section className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
            Loading notifications...
          </div>
        ) : (
          ["Today", "Yesterday", "Earlier"].map((group) =>
            grouped[group].length ? (
              <div key={group} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {group}
                </p>

                {grouped[group].map((n) => {
                  const meta = typeMeta(n.type);
                  const Icon = meta.icon;

                  return (
                    <article
                      key={n.id}
                      className={`rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                        n.read
                          ? "border-slate-200 bg-white"
                          : "border-blue-200 bg-blue-50/60"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${meta.tone}`}
                        >
                          <Icon />
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#0F172A]">
                            {n.title}
                          </p>
                          <p className="mt-0.5 text-sm text-slate-600">
                            {n.desc}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">{n.time}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {!n.read ? (
                            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#2563EB]" />
                          ) : null}

                          <button
                            onClick={() => {
                              if (n.actionUrl) window.location.assign(n.actionUrl);
                              else ping(`${n.action} opened`);
                            }}
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            {n.action || "Open"}
                          </button>

                          <button
                            onClick={() => toggleRead(n.id, !n.read)}
                            className="rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-blue-50"
                          >
                            {n.read ? "Mark Unread" : "Mark Read"}
                          </button>

                          <FiChevronRight className="text-slate-400" />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null
          )
        )}

        {!loading && filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            No notifications found.
          </div>
        ) : null}
      </section>

      {settingsOpen ? (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setSettingsOpen(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#0F172A]">
                Notification Settings
              </h3>
              <button
                onClick={() => setSettingsOpen(false)}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
              >
                <FiX />
              </button>
            </div>

            <div className="space-y-2">
              {[
                ["Email for New Applications", "apps"],
                ["Email for Interviews", "interviews"],
                ["Email for Plan Expiry", "planExpiry"],
                ["Daily Hiring Summary", "dailySummary"],
                ["SMS Alerts", "sms"],
                ["WhatsApp Alerts", "whatsapp"],
              ].map(([label, key]) => (
                <label
                  key={key}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-slate-700">{label}</span>
                  <input
                    type="checkbox"
                    checked={!!prefs[key]}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, [key]: e.target.checked }))
                    }
                    className="h-4 w-4 accent-[#2563EB]"
                  />
                </label>
              ))}
            </div>

            <button
              onClick={async () => {
                try {
                  await updateCompanyNotifications({
                    newApplication: !!prefs.apps,
                    interviewScheduled: !!prefs.interviews,
                    planExpiry: !!prefs.planExpiry,
                    dailySummary: !!prefs.dailySummary,
                    sms: !!prefs.sms,
                    whatsapp: !!prefs.whatsapp,
                  });
                  setSettingsOpen(false);
                  ping("Notification settings saved", "success");
                } catch (e) {
                  ping(e?.response?.data?.message || "Failed to save settings", "error");
                }
              }}
              className="mt-4 w-full rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Save Changes
            </button>
          </aside>
        </div>
      ) : null}

      {unreadCount ? (
        <div className="fixed left-4 top-20 z-30 inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2563EB]">
          <FiBell /> {unreadCount} unread
        </div>
      ) : null}

      <Toast
        show={toast.show}
        message={toast.message}
        tone={toast.tone}
        onClose={() => setToast((p) => ({ ...p, show: false }))}
      />
    </div>
  );
}
